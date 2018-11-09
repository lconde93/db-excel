let count = 0;
let acumMonto = 0;
let currentContract = 0;

module.exports = {
	fileName: '2018-11-08-Pagos.xlsx',
	disabled: false,
	fields: [],
	data: {
		contracts: async function (db) {
			const rows = await db.target.query(`SELECT C.Contrato_ID AS id, CONCAT(L.Prefijo, C.No_Contrato) as noContrato, CC.Usuario_ID AS clienteId,
				LOWER(CONCAT(U.Nombre, ' ', U.Apellido_Paterno, ' ', U.Apellido_Materno)) as cliente, C.Fecha_Creacion as fecha, P.nombre AS producto
				FROM cat_contratos C
				INNER JOIN cat_cotizaciones CC ON CC.Cotizacion_ID = C.Contrato_ID
				INNER JOIN cat_productos P ON P.Producto_ID = CC.Producto_ID
				INNER JOIN seg_usuarios U ON U.Usuario_ID = CC.Usuario_ID
				INNER JOIN cat_lineas L ON L.Linea_ID = CC.Linea_ID
			`);

			return rows;
		},
		sourceContracts: async function (db) {
			const rows = await db.source.query(`SELECT con_identificador AS id, LOWER(con_cliente) AS cliente, CONCAT(con_marca, ' ', con_modelo) AS producto FROM contrato`);

			return rows;
		}
	},
	steps: [async function (db, row, index) {
		if (row['Contrato (ID)'] != currentContract) {
			currentContract = row['Contrato (ID)'];
			count = 0;
			acumMonto = 0;
		}

		try {
			const sourceContract = db.data.sourceContracts.find(x => x.id == currentContract);

			if (!sourceContract) return;

			const contract = db.data.contracts.find(x => x.cliente.trim() == sourceContract.cliente.trim() && x.producto.trim() == sourceContract.producto.trim())

			if (!contract) return;

			return { contract: contract };
		} catch (err) {
			console.error('STEP 1:', err);
			process.exit(0);
			return;
		}
	}, async function (db, row, index, args) {
		try {
			let order = count + 1;
			let payedAmount = 0;

			if (!(row['Concepto Extra'] == '' || row['Concepto Extra'] == undefined || row['Concepto Extra'] == 'pago inicial')) return { ext: true, contract: args.contract };

			if (row['Concepto Extra'] == 'pago inicial') {
				order = -1;
			} else {
				count++;
			}

			let total = (parseFloat(row['Monto']) + parseFloat(row['Multas']) + parseFloat(row['Extras']));
			let paymentId;
			payedAmount = acumMonto + parseFloat(row['Monto pagado']);
			if (payedAmount > total) {
				acumMonto = payedAmount - total;
				payedAmount = total;
			}
			const payment = await db.query(`SELECT Pago_ID FROM cat_pagos WHERE Fecha_Pago = '${db.dateFormatter(row['Fecha'], 'YYYY-MM-DD HH:mm:ss')}' AND Contrato_ID = ${args.contract.id} AND Orden = ${order};`);
			/* console.log('-+-+-+-+-' + JSON.stringify(payment)); */
			if (payment && payment.length == 1)
				paymentId = payment[0].Pago_ID;
			else {
				const paymentInsert = await db.insert({
					table: 'cat_pagos',
					fields: {
						Contrato_ID: args.contract.id,
						Fecha_Pago: db.dateFormatter(row['Fecha'], 'YYYY-MM-DD HH:mm:ss'),
						Pago: row['Monto'],
						Total: total,
						Monto: payedAmount,
						Orden: order,
						Estado: '0',
						Metodo: '0',
						Tarjeta_ID: null,
						Refinanciamiento: 0,
						Fecha_Creacion: db.dateFormatter(args.contract.fecha, 'YYYY-MM-DD HH:mm:ss'),
						Fecha_Actualizacion: db.dateFormatter(row['Fecha Pago'], 'YYYY-MM-DD HH:mm:ss'),
						Visible: 1,
						Activo: 1
					}
				});
				paymentId = paymentInsert.id;
			}

			return { paymentId: paymentId, contract: args.contract };
		} catch (err) {
			console.error('STEP 2:', err);
			process.exit(0);
			return;
		}
	}, async function (db, row, index, args) {
		console.log(args.contract.id);
		let noteInsert = {};
		let registerPaymentInsert = {};

		try {
			if (args.paymentId) {
				noteInsert = await db.insert({
					table: 'cat_notas_cobranza',
					fields: {
						Pago_ID: args.paymentId,
						Descripcion: row.Observaciones,
						Fecha_Creacion: db.dateFormatter(row['Fecha'], 'YYYY-MM-DD HH:mm:ss'),
						Fecha_Actualizacion: db.dateFormatter(row['Fecha'], 'YYYY-MM-DD HH:mm:ss'),
						Visible: 1,
						Activo: 1,
						Usuario_Creacion_ID: '1'
					}
				});

				if (row['Concepto Extra'] == 'pago inicial') return;

				if (row['Monto pagado'] > 0) {
					registerPaymentInsert = await db.insert({
						table: 'cat_registro_pago',
						fields: {
							Monto: row['Monto pagado'],
							Pago_ID: args.paymentId,
							Descripcion: 'Pago ' + (count + 1),
							Referencia: row.Referencia.substr(0, 44),
							Modalidad_ID: 3,
							Banco_ID: 2,
							Pago_ID: args.paymentId,
							Fecha_Registro_Usuario: db.dateFormatter(row['Fecha Pago'], 'YYYY-MM-DD HH:mm:ss'),
							Fecha_Creacion: db.dateFormatter(row['Fecha Pago'], 'YYYY-MM-DD HH:mm:ss'),
							Fecha_Actualizacion: db.dateFormatter(row['Fecha Pago'], 'YYYY-MM-DD HH:mm:ss'),
							Visible: 1,
							Activo: 1,
							Usuario_Creacion_ID: '1'
						}
					});
				}

				return { noteId: noteInsert.id, registerId: registerPaymentInsert.id };
			} else if (args.ext) {
				let findPago = db.query(`SELECT Pago_ID AS id FROM cat_pagos WHERE Orden = ${count} AND Contrato_ID = ${args.contract.id}`);

				if (row['Monto pagado'] > 0 && findPago.length) {
					registerPaymentInsert = await db.insert({
						table: 'cat_registro_pago',
						fields: {
							Monto: row['Monto pagado'],
							Pago_ID: args.paymentId,
							Descripcion: 'Pago ' + (count + 1),
							Referencia: row.Referencia.substr(0, 44),
							Modalidad_ID: 3,
							Banco_ID: 2,
							Pago_ID: findPago[0].id,
							Fecha_Registro_Usuario: db.dateFormatter(row['Fecha Pago'], 'YYYY-MM-DD HH:mm:ss'),
							Fecha_Creacion: db.dateFormatter(row['Fecha Pago'], 'YYYY-MM-DD HH:mm:ss'),
							Fecha_Actualizacion: db.dateFormatter(row['Fecha Pago'], 'YYYY-MM-DD HH:mm:ss'),
							Visible: 1,
							Activo: 1,
							Usuario_Creacion_ID: '1'
						}
					});
				}
				return { registerId: registerPaymentInsert.id };
			}
		} catch (err) {
			console.error('STEP 3:', err);
			process.exit(0);
			return;
		}
	}],
}

const fillNumber = function (index) {
	let number = index;

	if (number > 9999) return number;

	return Array(4 - number.toString().length).fill('0', 0).join('') + (number.toString());
}