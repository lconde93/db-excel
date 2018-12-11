let currentContract = 0;
let paymentIndex = 0;

module.exports = {
	fileName: 'PERSONA FISICA PAGOS.xlsx',
	/* disabled: true, */
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
		/* sourceContracts: async function (db) {
			const rows = await db.source.query(`SELECT con_identificador AS id, UPPER(con_cliente) AS cliente, CONCAT(con_marca, ' ', con_modelo) AS producto FROM contrato`);

			return rows;
		} */
	},
	steps: [async function (db, row, index) {
		const contractId = row['Contrato (ID)'];

		if (contractId != currentContract) {
			currentContract = contractId;
			paymentIndex = 0;
		}

		try {
			const contract = db.data.contracts.find(x => x.id == currentContract);

			if (!contract) {
				console.log('No existe el contrato');
				process.exit(0);
			}

			return { contract: contract };
		} catch (err) {
			console.error('STEP 1:', err);
			process.exit(0);
			return;
		}
	}, async function (db, row, index, args) {
		let contractList = db.list.filter(x => x['Contrato (ID)'] == currentContract);

		if (!contractList.length) return;

		if (paymentIndex < (contractList.length - 1)) {
			paymentIndex++;
			return;
		}

		return { list: contractList, contract: args.contract };
	}, async function (db, row, index, args) {
		const realPaymentsExcel = args.list.filter(x => x['Monto pagado'] > 0);
		let totalAmount = realPaymentsExcel.map(x => parseFloat(x['Monto pagado'])).reduce((prev, x) => {
			return prev + x;
		}, 0);

		const scheduledPayments = await db.query(`SELECT Pago_ID, Pago, Monto, Total, Orden, Fecha_Pago FROM cat_pagos WHERE Contrato_ID = ${currentContract} AND Monto < Total ORDER BY Fecha_Pago;`);

		let modifiedPayments = scheduledPayments.slice();

		try {
			for (let i = 0; i < realPaymentsExcel.length; i++) {
				const item = realPaymentsExcel[i];
				const findPagoProg = modifiedPayments.findIndex(x => x.Monto < x.Total);

				if (findPagoProg < 0) {
					db.log('ERROR', `No se inserto pago real | Contrato_ID: ${currentContract} No. Contrato: ${args.contract.noContrato} Index: ${i}`);
				} else {
					const register = await registerPayment(db, {
						monto: item['Monto pagado'],
						pagoId: modifiedPayments[findPagoProg].Pago_ID,
						referencia: item['Referencia'],
						fecha: item['Fecha Pago'],
						descripcion: item['Observaciones']
					}, i);

					modifiedPayments = updatePaymentsList(modifiedPayments, parseFloat(item['Monto pagado']));

					db.log('SUCCESS', `Pago real insertado | ID: ${register.id} Contrato_ID: ${currentContract} No. Contrato: ${args.contract.noContrato}`);
				}
			}

			const updateScheduled = await updatePaymentsDB(db, modifiedPayments, args.contract);
		} catch (err) {
			console.error('STEP 4:', err);
			process.exit(0);
		}

		return;
	}]
}

const updatePaymentsList = function (array, totalAmount) {
	let auxArray = array.slice();
	let auxTotalAmount = totalAmount;
	let selectedIndex = auxArray.findIndex(x => x.Monto < x.Total);

	while (auxTotalAmount > 0) {
		let item = auxArray[selectedIndex];

		if (!item) {
			auxTotalAmount = 0;
			break;
		}

		let faltante = item.Total - item.Monto;

		if (auxTotalAmount > faltante) {
			item.Monto = item.Total;
			auxTotalAmount = auxTotalAmount - faltante;
			selectedIndex++;
		} else {
			item.Monto += auxTotalAmount;
			auxTotalAmount = 0;
		}
	}

	return auxArray;
}

const updatePaymentsDB = async function (db, payments, contract) {
	try {
		for (let i = 0; i < payments.length; i++) {
			const payment = payments[i];

			const updateResult = await db.query(`
				UPDATE cat_pagos SET
					Pago = ?,
					Monto = ?,
					Total = ?,
					Fecha_Pago = ?,
					Activo = 1,
					Visible = 1
				WHERE Pago_ID = ${payment.Pago_ID} AND Contrato_ID = ${contract.id};
			`, [payment.Pago, payment.Monto, payment.Total, payment.Fecha_Pago]);

			db.log('SUCCESS', `Pago programado actualizado | ID: ${payment.Pago_ID} Contrato_ID: ${contract.id} No. Contrato: ${contract.noContrato}`);
		}
	} catch (err) {
		console.log('UPDATE PAYMENT ERROR:', err);
		return false;
	}

	return true;
}

const registerPayment = async function (db, obj, index) {
	try {
		const registerPaymentInsert = await db.insert({
			table: 'cat_registro_pago',
			fields: {
				Monto: obj.monto,
				Pago_ID: obj.pagoId,
				Descripcion: obj.descripcion,
				Referencia: obj.referencia.substr(0, 44),
				Modalidad_ID: 3,
				Banco_ID: 2,
				Fecha_Registro_Usuario: db.dateFormatter(obj.fecha, 'YYYY-MM-DD HH:mm:ss'),
				Fecha_Creacion: db.dateFormatter(obj.fecha, 'YYYY-MM-DD HH:mm:ss'),
				Fecha_Actualizacion: db.dateFormatter(obj.fecha, 'YYYY-MM-DD HH:mm:ss'),
				Visible: 1,
				Activo: 1,
				Usuario_Creacion_ID: '1'
			}
		});

		return registerPaymentInsert;
	} catch (err) {
		console.log('REGISTER PAYMENT ERROR');
		throw err;
	}
}