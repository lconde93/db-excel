module.exports = {
	fileName: 'Extras',
    rawQuery: `
		SELECT con.con_identificador, con.con_cliente, fin.fin_concepto ,fin.fin_total, fin.fin_inicial, fin.fin_financiado, 
		fin.fin_financiamiento, fin.fin_pagos, fin.fin_pagomonto 
		FROM financiamiento fin
	        INNER JOIN(
				SELECT con_identificador, con_cliente FROM contrato
			) con ON con.con_identificador = fin.con_identificador;`,
	transform: function (rows) {
		let list = rows.slice();

		return list;
	},
	fields: [{
		sourceName: 'con_identificador',
		targetName: 'Contrato (ID)',
		defaultValue: ''
	}, {
		sourceName: 'con_cliente',
		targetName: 'Cliente',
		defaultValue: ''
	}, {
		sourceName: 'fin_concepto',
		targetName: 'Concepto',
		defaultValue: ''
	}, {
		sourceName: 'fin_total',
		targetName: 'Total a pagar',
		defaultValue: ''
	}, {
		sourceName: 'fin_inicial',
		targetName: 'Pago inicial',
		defaultValue: ''
	}, {
		sourceName: 'fin_financiado',
		targetName: 'Monto financiado',
		defaultValue: ''
	}, {
		sourceName: 'fin_financiamiento',
		targetName: 'Financiamiento',
		defaultValue: ''
	}, {
		sourceName: 'fin_pagos',
		targetName: 'No. Pagos',
		defaultValue: ''
	}, {
		sourceName: 'fin_pagomonto',
		targetName: 'Monto a pagar',
		defaultValue: ''
	}, {
		sourceName: '',
		targetName: 'Semana aplicacion',
		defaultValue: ''
	}]
}