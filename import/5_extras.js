module.exports = {
	fileName: 'PERSONA FISICA EXTRAS.xlsx',
	/* disabled: true, */
	fields: [],
	data: {
		payments: async function (db) {
			const rows = await db.target.query(`SELECT P.Pago_ID AS id, C.Contrato_ID AS contratoId, CONCAT(L.Prefijo, C.No_Contrato) as noContrato,
				P.fecha_Pago, P.Orden, P.Monto, P.Total
				FROM cat_pagos P
				INNER JOIN cat_contratos C ON C.Contrato_ID = P.Contrato_ID
				INNER JOIN cat_cotizaciones CC ON CC.Cotizacion_ID = C.Cotizacion_ID
				INNER JOIN cat_lineas L ON L.Linea_ID = CC.Linea_ID
			`);

			return rows;
		},
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
		}
	},
	steps: [async function (db, row, index) {
		const contract = db.data.contracts.find(x => x.id === row['Contrato (ID)']);

		if (!contract) {
			db.log('ERROR', `No existe el contrato con ID: ${row['Contrato (ID)']}`);
			return;
		}

		try {
			const insert = await db.insert({
				table: 'tramites_multas',
				fields: {
					Contrato_ID: row['Contrato (ID)'],
					Orden: row['Semana aplicacion'],
					Tipo: row['Multas'] == 'Si' ? 2 : 3,
					Concepto: row['Concepto'],
					Total: row['Total a pagar'],
					Monto: row['Monto a pagar'],
					No_Pagos: row['No. Pagos'],
					Financiamento: row['Financiamiento'],
					Pago_Inicial: row['Pago inicial'],
					Registro_Pago_ID: null,
					Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Visible: 1,
					Activo: 1,
					Usuario_Creacion_ID: '1',
					Usuario_Actualizacion_ID: '1',
					De_Sistema: 0,
					Oculto: 0
				}
			});

			db.log('SUCCESS', `Extra insertado | ID: ${insert.id} Nombre: ${row['Concepto']} Contrato_ID: ${contract.id}`);
			return { contract: contract };
		} catch (err) {
			console.log('Step: 1', err);
			process.exit(0);
		}
	}, async function (db, row, index, args) {
		try {
			const minOrden = row['Semana aplicacion'];
			const maxOrden = minOrden + row['No. Pagos'];

			const scheduledPayments = await db.query(`SELECT Pago_ID, Monto, Total, Orden FROM cat_pagos 
				WHERE Contrato_ID = ${args.contract.id} 
				AND Orden >= ${minOrden} AND Orden < ${maxOrden}`)

			for (let i = 0; i < scheduledPayments.length; i++) {
				let item = scheduledPayments[i];
				let beforeUpdate = item.Total;
				let newAmount = item.Total + row['Monto a pagar'];

				const updateScheduled = await db.query(`UPDATE cat_pagos SET Total = ${newAmount} WHERE Pago_ID = ${item.Pago_ID}`);

				db.log('SUCCESS', `Monto total de pago programado actualizado | ID: ${item.Pago_ID}, Orden: ${item.Orden} Total antes de actualizar: $${beforeUpdate}, Total despues de actualizar: $${newAmount}, Contrato_ID: ${args.contract.id}, No. Contrato: ${args.contract.noContrato}`);
			}

			return;
		} catch (err) {
			console.log('Step: 2', err);
			process.exit(0);
		}
	}]
}