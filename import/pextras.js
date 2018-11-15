module.exports = {
	fileName: '2018-11-14-Extras.xlsx',
	disabled: true,
	fields: [],
	data: {
		payments: async function (db) {
			const rows = await db.target.query(`SELECT P.Pago_ID AS id C.Contrato_ID AS contratoId, CONCAT(L.Prefijo, C.No_Contrato) as noContrato,
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
		try {
			const insert = await db.insert({
				table: 'tramites_multas',
				fields: {
					Contrato_ID: row['Contrato (ID)'],
					Orden: 1,
					Tipo: 3,
					Concepto: row['Concepto'],
					Total: row['Total a pagar'],
					Monto: row['Monto a pagar'],
					No_Pagos: row['No. Pagos'],
					Financiamiento: row['Financiamiento'],
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

			db.log('SUCCESS', `Extra insertado | ID: ${insert.id} Nombre: ${row['Concepto']} Contrato_ID: ${row['Contrato (ID)']}`);
			return;
		} catch (err) {
			console.log('Step: 2', err);
		}
	}]
}