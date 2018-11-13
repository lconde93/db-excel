module.exports = {
	fileName: '2018-11-01-Contratos.xlsx',
	/* disabled: true, */
	fields: [],
	data: {
		clients: async function (db) {
			const rows = await db.target.query(`SELECT Usuario_ID AS id, UPPER(CONCAT(Nombre, ' ', Apellido_Paterno, ' ', Apellido_Materno)) AS name,
				email, tel, tel_local
				FROM seg_usuarios 
				WHERE Usuario_App = 1`);

			return rows;
		},
		requestTypes: async function (db) {
			const rows = await db.target.query(`SELECT * FROM cat_tipo_solicitudes`);

			return rows;
		}
	},
	steps: [async function (db, row, index) {
		try {
			const agencyName = row.Agencia.trim();
			const existAgency = await db.query(`SELECT Agencia_Id AS id FROM cat_agencia WHERE Nombre = UPPER('${agencyName}')`);
			const agencyName = row.Agencia.trim().toUpperCase();

			if (!existAgency.length) {
				const insertAgency = await db.insert({
					table: 'cat_agencias',
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

			return { productId: args.id };

		} catch (err) {
			console.error('STEP 3:', err);
			return;
		}
	}, async function (db, row, index, args) {
		let client = db.data.clients.find(x => x.name === row.Cliente.toUpperCase());

		try {
			const insertRequest = await db.insert({
				table: 'cat_solicitudes',
				fields: {
					Nombre: row.Cliente,
					Tipo_Solicitud_ID: db.data.requestTypes.find(x => x.Linea_ID == row['Linea (ID)']).Solicitud_ID,
					Archivo: db.dateFormatter(new Date(), 'YYYYMMDDHHmmsstt') + '_solicitud.html',
					Informacion: JSON.stringify({
						deposit: row['Deposito en Garantía'],
						clientName: row.Cliente,
						clientPhone: client.tel,
						clientEmail: client.email,
					}),
					Deposito_Garantia: row['Deposito en Garantía'],
					Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Visible: 1,
					Activo: 1,
					Usuario_Creacion_ID: '1',
				}
			});

			return { requestId: insertRequest.id, productId: args.productId };
		} catch (err) {
			console.error('STEP 4:', err);
			return;
		}
	}, async function (db, row, index, args) {
		let client = db.data.clients.find(x => x.name === row.Cliente.toUpperCase());

		if (!client) {
			return;
		}

		try {
			const insertQuotation = await db.insert({
				table: 'cat_cotizaciones',
				fields: {
					Descripcion: '',
					Fecha_Caducidad: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Usuario_ID: client.id,
					Producto_ID: args.productId,
					Linea_ID: row['Linea (ID)'],
					Pago: row['Pago Semanal'],
					Fecha_Pago_Inicial: db.dateFormatter(new Date(row['Fecha primer Pago']), 'YYYY-MM-DD HH:mm:ss'),
					Reserva: 0,
					Enganche: 0,
					Estado: 2,
					Residual: 0,
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

			return { quotationId: insertQuotation.id };
		} catch (err) {
			console.error('STEP 5:', err);
			return;
		}
	}, async function (db, row, index, args) {
		/* const maxContractNumber = await db.query(`SELECT IFNULL(MAX((No_Contrato * 1)), 0) AS maxContractNumber
			FROM cat_contratos C 
			INNER JOIN cat_cotizaciones CC ON CC.Cotizacion_ID = C.Cotizacion_ID 
			WHERE CC.Linea_ID = "${row['Linea (ID)']}"`); */

		try {
			const insertContract = await db.insert({
				table: 'cat_contratos',
				fields: {
					Contrato_ID: row['Id'],
					No_Contrato: fillNumber(row['No. Contrato']),
					Descripcion: '',
					Cotizacion_ID: args.quotationId,
					Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Visible: 1,
					Activo: 1,
					Usuario_Creacion_ID: '1',
					Fecha_Firma: db.dateFormatter(new Date(row['Fecha primer Pago']), 'YYYY-MM-DD HH:mm:ss'),
					Placas: row.Placas
				}
			});

			return { contractId: insertContract.id };
		} catch (err) {
			console.error('STEP 6:', err);
			return;
		}
	}],
}

const fillNumber = function (index) {
	let number = index;

	if (number > 9999) return number;

	return Array(4 - number.toString().length).fill('0', 0).join('') + (number.toString());
}