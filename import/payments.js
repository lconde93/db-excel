let count = 0;
let currentContract = 0;
let paymentIndex = 0;

module.exports = {
	fileName: 'PERSONA FISICA PAGOS.xlsx',
	disabled: true,
	fields: [],
	data: {
		contracts: async function (db) {
			const rows = await db.target.query(`SELECT C.Contrato_ID AS id, CONCAT(L.Prefijo, C.No_Contrato) as noContrato, CC.Usuario_ID AS clienteId,
				UPPER(CONCAT(U.Nombre, ' ', U.Apellido_Paterno, ' ', U.Apellido_Materno)) as cliente, C.Fecha_Creacion as fecha, P.nombre AS producto
				FROM cat_contratos C
				INNER JOIN cat_cotizaciones CC ON CC.Cotizacion_ID = C.Cotizacion_ID
				INNER JOIN cat_productos P ON P.Producto_ID = CC.Producto_ID
				INNER JOIN seg_usuarios U ON U.Usuario_ID = CC.Usuario_ID
				INNER JOIN cat_lineas L ON L.Linea_ID = CC.Linea_ID
			`);

			return rows;
		},
		sourceContracts: async function (db) {
			const rows = await db.source.query(`SELECT con_identificador AS id, UPPER(con_cliente) AS cliente, CONCAT(con_marca, ' ', con_modelo) AS producto FROM contrato`);

			return rows;
		}
	},
	steps: [async function (db, row, index) {
		if (row['Contrato (ID)'] != currentContract) {
			currentContract = row['Contrato (ID)'];
			count = 0;
			paymentIndex = 0;
		}

		try {
			const contract = db.data.contracts.find(x => x.id == currentContract);

			return { contract: contract };
		} catch (err) {
			console.error('STEP 1:', err);
			process.exit(0);
			return;
		}
	}, async function (db, row, index, args) {
		try {
			let paymentId = null;

			if (!(row['Concepto Extra'] == '' || row['Concepto Extra'] == undefined || row['Concepto Extra'] == 'pago inicial')) return { ext: true, contract: args.contract };

			let total = parseFloat(row['Monto']);

			if (total > 0) {
				let order = count + 1;

				if (row['Concepto Extra'] == 'pago inicial') {
					order = -1;
				} else {
					count++;
				}

				const paymentInsert = await db.insert({
					table: 'cat_pagos',
					fields: {
						Contrato_ID: args.contract.id,
						Fecha_Pago: db.dateFormatter(row['Fecha'], 'YYYY-MM-DD HH:mm:ss'),
						Pago: row['Monto'],
						Total: total,
						Monto: 0,
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

				db.log('SUCCESS', `Pago programado insertado | ID: ${paymentInsert.id} Contrato_ID: ${args.contract.id}`);
				paymentId = paymentInsert.id;
			}

			return { paymentId: paymentId, contract: args.contract };
		} catch (err) {
			console.error('STEP 2:', err);
			process.exit(0);
			return;
		}
	}, async function (db, row, index, args) {
		let noteInsert = {};
		let paymentId = args.paymentId;

		try {
			if (!paymentId) {
				const lastPayment = db.query(`SELECT pago_id as id from cat_pagos where contrato_id = ${args.contract.id} order by fecha_pago desc limit 1`);

				if (lastPayment.length) {
					paymentId = lastPayment[0].id;
				}
			}

			if (paymentId && row.Observaciones) {
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

				db.log('SUCCESS', `Nota insertada | ID: ${noteInsert.id} Pago_ID: ${args.paymentId} Contrato_ID: ${args.contract.id} No. Contrato: ${args.contract.noContrato}`);

				return { noteId: noteInsert.id, contract: args.contract };
			} else {
				if (row.Observaciones) {
					db.log('ERROR', `No se agrego nota | Contrato_ID: ${args.contract.id} No. Contrato: ${args.contract.noContrato} Texto: ${row.Observaciones}`);
				}

				return { contract: args.contract };
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