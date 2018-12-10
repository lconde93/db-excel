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
		if (row['Contrato (ID)'] != currentContract) {
			currentContract = row['Contrato (ID)'];
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
		let contractList = db.list.filter(x => x['Contrato (ID)'] == args.contract.id);

		if (!contractList.length) return;

		if (paymentIndex < (contractList.length - 1)) {
			paymentIndex++;
			return;
		}

		return { list: contractList, contract: args.contract };
	}, async function (db, row, index, args) {
		console.log(args.contract);

		const realPaymentsExcel = args.list.filter(x => x['Monto pagado'] > 0);
		let totalAmount = realPaymentsExcel.map(x => parseFloat(x['Monto pagado'])).reduce((prev, x) => {
			return prev + x;
		}, 0);
		let auxTotalAmount = totalAmount;

		console.log('62 Contract', args.contract.id, 'TOTAL', totalAmount, 'No pagos');

		const scheduledPayments = await db.query(`SELECT Pago_ID, Pago, Monto, Total, Fecha_Pago, Activo, Visible FROM cat_pagos WHERE Contrato_ID = ${args.contract.id} AND Monto < Total ORDER BY Fecha_Pago;`);
		const copiedScheduledPayments = scheduledPayments.slice();

		try {
			for (let i = 0; i < realPaymentsExcel.length; i++) {
				const item = realPaymentsExcel[i];
				const findPagoProg = copiedScheduledPayments.findIndex(x => x.Monto < x.Total);

				if (findPagoProg < 0) {
					db.log('SUCCESS', `No se inserto pago real | Contrato_ID: ${args.contract.id} No. Contrato: ${args.contract.noContrato} Index: ${i}`);
					return;
				}

				if (auxTotalAmount > copiedScheduledPayments[findPagoProg].Total) {
					copiedScheduledPayments[findPagoProg].Monto = copiedScheduledPayments[findPagoProg].Total;
					auxTotalAmount = auxTotalAmount - copiedScheduledPayments[findPagoProg].Total;
				} else {
					copiedScheduledPayments[findPagoProg].Monto = auxTotalAmount;
				}

				const register = await registerPayment(db, {
					monto: item['Monto pagado'],
					pagoId: copiedScheduledPayments[findPagoProg].Pago_ID,
					referencia: item['Referencia'],
					fecha: item['Fecha Pago'],
					descripcion: item['Observaciones']
				}, i);

				db.log('SUCCESS', `Pago real insertado | ID: ${register.id} Contrato_ID: ${args.contract.id} No. Contrato: ${args.contract.noContrato}`);
			}

			let modifiedPayments = updatePaymentsList(scheduledPayments.slice(), totalAmount);

			const updateScheduled = await updatePaymentsDB(db, modifiedPayments);
		} catch (err) {
			console.error('STEP 4:', err);
			process.exit(0);
		}

		return;
	}],
}

const updatePaymentsList = async function (array, totalAmount) {
	let auxArray = array.slice();
	let auxTotalAmount = totalAmount;

	for (let i = 0; i < array.length; i++) {
		let payment = auxArray[i];
		let auxAmount = auxTotalAmount;

		if (auxAmount > payment.Total) {
			auxAmount = payment.Total;
			auxTotalAmount = auxTotalAmount - payment.Total;
		}

		payment.Monto = auxAmount;
	}

	return auxArray;
}

const updatePaymentsDB = async function (db, payments) {
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
				WHERE Pago_ID = ${payment.Pago_ID};
			`, [payment.Pago, payment.Monto, payment.Total, payment.Fecha_Pago]);
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

/* let updatePayments = function (array, totalAmount) {
	return new Promise((resolve, reject) => {
		let asyncLoop = function (i, callback) {
			if (i < array.length) {
				let newAmount = 0;
				let payment = array[i];

				if (i == (array.length - 1)) {
					newAmount = totalAmount;
					totalAmount = totalAmount - newAmount;
				} else {
					let amountDifference = payment.Total - payment.Monto; //monto que se le puede agregar al registro
					if (totalAmount >= amountDifference) {//se hace un pago parcial con lo maximo que se puede pagara para ese registro
						newAmount = payment.Monto + amountDifference;
						totalAmount = totalAmount - amountDifference;
					}
					else {
						newAmount = totalAmount + payment.Monto;
						totalAmount = totalAmount - newAmount;
					}
				}

				sqlQuery = 'CALL sp_update_scheduled_payment(?, ?, ?, ?, ?, ?, ?)';
				sqlData = [payment.Pago_ID, payment.Pago, newAmount, payment.Total, payment.Fecha_Pago, payment.Activo, payment.Visible];

				Promise.using(getConnection(), function (connection) {
					return connection.query(sqlQuery, sqlData);
				}).then(function (rows) {
					if (totalAmount <= 0)
						i = array.length;
					return asyncLoop(++i, callback);
				}).catch((err) => {
					return callback(err);
				});
			} else {
				return callback(null, 'SUCCESS');
			}
		}

		asyncLoop(0, function (err, result) {
			if (err) return reject(err);
			return resolve(result);
		});
	});
} */