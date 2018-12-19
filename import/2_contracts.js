const pagosPlazo = [52, 12];

module.exports = {
	fileName: '2018-11-15-Contratos.xlsx',
	disabled: true,
	fields: [],
	data: {
		clients: async function (db) {
			const rows = await db.target.query(`SELECT Usuario_ID AS id, UPPER(CONCAT(Nombre, ' ', Apellido_Paterno, ' ', Apellido_Materno)) AS name,
				CONCAT(Nombre, ' ', Apellido_Paterno, ' ', Apellido_Materno) AS fullName,
				email, tel, tel_local, No_Cliente as noCliente
				FROM seg_usuarios 
				WHERE Usuario_App = 1`);

			return rows;
		},
		lines: async function (db) {
			const rows = await db.target.query(`SELECT Linea_ID AS id, Prefijo AS prefix, Nombre AS name FROM cat_lineas`);

			return rows;
		},
		requestTypes: async function (db) {
			const rows = await db.target.query(`SELECT * FROM cat_tipo_solicitudes`);

			return rows;
		}
	},
	steps: [async function (db, row, index) {
		try {
			const agencyName = row.Agencia.trim().toUpperCase();
			const existAgency = await db.query(`SELECT Agencia_Id AS id FROM cat_agencia WHERE Nombre = UPPER('${agencyName}')`);

			if (!existAgency.length) {
				const insertAgency = await db.insert({
					table: 'cat_agencia',
					fields: {
						Nombre: agencyName,
						Descripcion: '',
						Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
						Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
						Visible: 1,
						Activo: 1,
						Usuario_Creacion_ID: '1',
						Usuario_Actualizacion_ID: '1',
					}
				});

				db.log('SUCCESS', `Agencia insertada | ID: ${insertAgency.id}, Nombre: ${agencyName}`);
				return { agencyId: insertAgency.id };
			}

			return { agencyId: existAgency[0].id }
		} catch (err) {
			console.error('STEP 2:', err);
			return {};
		}
	}, async function (db, row, index) {
		try {
			const concatenatedName = row.Marca.trim() + ' ' + row.Modelo.trim();

			const existsProduct = await db.query(`SELECT Producto_ID AS id, Marca, Modelo, Nombre FROM cat_productos WHERE Nombre = UPPER('${concatenatedName}')`);

			return {
				id: existsProduct.length ? existsProduct[0].id : null,
				brand: row.Marca.trim().toUpperCase(),
				model: row.Modelo.trim().toUpperCase(),
				name: concatenatedName.toUpperCase()
			}
		} catch (err) {
			console.error('STEP 2:', err);
			return { product: {} };
		}
	}, async function (db, row, index, args) {
		let insertProduct = null;

		try {
			if (!args.id) {
				insertProduct = await db.insert({
					table: 'cat_productos',
					fields: {
						Nombre: args.name,
						Marca: args.brand,
						Modelo: args.model,
						Version: '',
						Precio: 0,
						Precio_Lista: 0,
						Descripcion: '',
						Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
						Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
						Visible: 1,
						Activo: 1,
						Usuario_Creacion_ID: '1'
					}
				});

				if (insertProduct.id) {
					db.log('SUCCESS', `Vehiculo insertado | ID: ${insertProduct.id}, Nombre: ${args.name}`);
					args.id = insertProduct.id;
				} else {
					return;
				}
			}

			return { productId: args.id, productName: args.name };
		} catch (err) {
			console.error('STEP 3:', err);
			return;
		}
	}, async function (db, row, index, args) {
		const clientName = row.Cliente.trim();
		const clientNumber = parseInt(row['Cliente (ID)']) - 3;
		let client = db.data.clients.find(x => parseInt(x.noCliente) == clientNumber);

		if (!client) {
			db.log('ERROR', `Solicitud | No existe el cliente | Nombre: ${clientName}`);
			return;
		}

		try {
			const deposit = isNaN(row['Deposito en Garantía']) ? 0 : row['Deposito en Garantía'];

			const insertRequest = await db.insert({
				table: 'cat_solicitudes',
				fields: {
					Nombre: client.fullName,
					Tipo_Solicitud_ID: db.data.requestTypes.find(x => x.Linea_ID == row['Linea (ID)']).Solicitud_ID,
					Archivo: db.dateFormatter(new Date(), 'YYYYMMDDHHmmsstt') + '_solicitud.html',
					Informacion: JSON.stringify({
						exp_deposito_garantia: deposit,
						clientName: client.name,
						clientPhone: client.tel,
						clientEmail: client.email,
						clientNumber: client.noCliente,
						contractNumber: row['No Contrato'],
						producto_id: args.productId,
						consecutivo_contrato: transformContractNumber(row['No. Contrato']),
						pago_semanal: row['Pago Semanal'],
						producto: args.productName,
						linea_id: row['Linea (ID)'],
						fecha_primer_pago: row['Fecha primer pago'],
						placas: row['Placas']
					}),
					Deposito_Garantia: deposit,
					Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Visible: 1,
					Activo: 1,
					Usuario_Creacion_ID: '1',
				}
			});

			db.log('SUCCESS', `Solicitud insertada | ID: ${insertRequest.id} Cliente: ${clientName} | ${client.name}`);
			return { requestId: insertRequest.id, productId: args.productId, client: client };
		} catch (err) {
			console.error('STEP 4:', err);
			return;
		}
	}, async function (db, row, index, args) {
		const clientName = row.Cliente.trim();
		let client = args.client;

		if (!client) {
			db.log('ERROR', `Cotización | No existe el cliente | Nombre: ${clientName}`);
			return;
		}

		let plazo = row['Mensuales'] == 'Si' ? 2 : 1;
		let anios = parseInt(row['No. Semanas']) / pagosPlazo[plazo - 1];

		try {
			const insertQuotation = await db.insert({
				table: 'cat_cotizaciones',
				fields: {
					Descripcion: '',
					Fecha_Caducidad: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Usuario_ID: client.id,
					Producto_ID: args.productId,
					Linea_ID: row['Linea (ID)'],
					Pago: anios.toFixed(3),
					Fecha_Pago_Inicial: db.dateFormatter(new Date(row['Fecha primer Pago']), 'YYYY-MM-DD HH:mm:ss'),
					Reserva: 0,
					Enganche: 0,
					Estado: 2,
					Residual: 0,
					Plazo: plazo,
					Tir: 30,
					Extras: JSON.stringify([]),
					Seguro: JSON.stringify({}),
					Tasa: JSON.stringify({
						tasa_veh: 23, tasa_seg: 35, tasa_ext: 35
					}),
					Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Visible: 1,
					Activo: 1,
					Usuario_Creacion_ID: '1',
					Solicitud_ID: args.requestId
				}
			});

			db.log('SUCCESS', `Cotización insertada | ID: ${insertQuotation.id} Cliente: ${clientName}`);
			return { quotationId: insertQuotation.id, client: client };
		} catch (err) {
			console.error('STEP 5:', err);
			return;
		}
	}, async function (db, row, index, args) {
		const clientName = row.Cliente.trim();
		/* const maxContractNumber = await db.query(`SELECT IFNULL(MAX((No_Contrato * 1)), 0) AS maxContractNumber
			FROM cat_contratos C 
			INNER JOIN cat_cotizaciones CC ON CC.Cotizacion_ID = C.Cotizacion_ID 
			WHERE CC.Linea_ID = "${row['Linea (ID)']}"`); */
		const contractNumber = transformContractNumber(row['No. Contrato']);
		const line = db.data.lines.find(x => x.id === row['Linea (ID)']);
		let client = args.client;

		try {
			let fechaAux = new Date(row['Fecha primer Pago']);
			fechaAux.setDate(fechaAux.getDate() - 7);
			fechaAux.setHours(0, 0, 0, 0);
			let fechaCreacion = db.dateFormatter(fechaAux, 'YYYY-MM-DD HH:mm:ss');

			const insertContract = await db.insert({
				table: 'cat_contratos',
				fields: {
					Contrato_ID: row['Id'],
					No_Contrato: contractNumber,
					Descripcion: '',
					Cotizacion_ID: args.quotationId,
					Fecha_Creacion: fechaCreacion,
					Fecha_Actualizacion: fechaCreacion,
					Visible: 1,
					Activo: 1,
					Usuario_Creacion_ID: '1',
					Fecha_Firma: db.dateFormatter(new Date(row['Fecha primer Pago']), 'YYYY-MM-DD HH:mm:ss'),
					Placas: row.Placas
				}
			});

			db.log('SUCCESS', `Contrato insertado | ID: ${insertContract.id} No_Contrato: ${row['No. Contrato']} Cliente: ${clientName}`);
			return { contract: { id: insertContract.id, fecha: fechaCreacion } };
		} catch (err) {
			console.error('STEP 6:', err);
			return;
		}
	}, async function (db, row, index, args) {
		try {
			let noPagos = row['No. Semanas'];
			let pagoSemanal = row['Pago Semanal'];
			let startingDate = new Date(row['Fecha primer Pago']);
			let esquema = row['Mensuales'] == 'Si';
			startingDate.setHours(0, 0, 0, 0);

			let month = startingDate.getMonth();
			let year = startingDate.getFullYear();

			let fechaAnterior = startingDate;

			console.log('Insertando pagos programados para contrato:', args.contract.id);

			for (let i = 0; i < noPagos; i++) {
				let fechaPago = fechaAnterior;
				let daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

				const paymentInsert = await db.insert({
					table: 'cat_pagos',
					fields: {
						Contrato_ID: args.contract.id,
						Fecha_Pago: db.dateFormatter(fechaPago, 'YYYY-MM-DD HH:mm:ss'),
						Pago: pagoSemanal,
						Total: pagoSemanal,
						Monto: 0,
						Orden: (i + 1),
						Estado: '0',
						Metodo: '0',
						Tarjeta_ID: null,
						Refinanciamiento: 0,
						Fecha_Creacion: db.dateFormatter(args.contract.fecha, 'YYYY-MM-DD HH:mm:ss'),
						Fecha_Actualizacion: db.dateFormatter(args.contract.fecha, 'YYYY-MM-DD HH:mm:ss'),
						Visible: 1,
						Activo: 1
					}
				});

				if (esquema) { // Mensual
					if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
						daysInMonth[1] = 29;
					}

					month++;
					if (month == 12) {
						month = 0;
						year++;
					}

					fechaPago.setMonth(month);
					fechaPago.setFullYear(year);

					if (startingDate.getDate() > daysInMonth[month]) {
						fechaPago.setDate(daysInMonth[month]);
					} else {
						fechaPago.setDate(startingDate.getDate());
					}

					fechaAnterior = fechaPago;
				} else { // Semanal
					fechaAnterior.setDate(fechaPago.getDate() + 7);
				}
			}

			db.log('SUCCESS', `Pagos programados insertados | Contrato_ID: ${args.contract.id} Cantidad: ${pagoSemanal} No. Pagos ${noPagos}`);

			return;
		} catch (err) {
			console.error('STEP 2:', err);
			process.exit(0);
			return;
		}
	}],
}

const transformContractNumber = function (string) {
	return fillNumber(parseInt(string.replace(/[A-Z]+/, '')));
}

const fillNumber = function (index) {
	let number = index;

	if (number > 9999) return number;

	return Array(4 - number.toString().length).fill('0', 0).join('') + (number.toString());
}