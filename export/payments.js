module.exports = {
	fileName: 'Pagos',
	rawQuery: `SELECT par_identificador, CCON.con_identificador AS con_identificador, CCON.con_cliente AS con_cliente, par_fecha, par_monto, 
		par_referencia, par_fecha_pago, par_penas, par_monto_pagado, par_remanente, par_observaciones, par_especial, par_extra, par_extra_activo, 
		par_monto_extra, par_monto_pena
			FROM parcialidades PA 
			INNER JOIN contrato CCON 
		WHERE PA.con_identificador = CCON.con_identificador;`,
	transform: function (rows) {
		let list = rows.slice();
		let count = 0;

		for (let item of list) { }

		return list;
	},
	fields: [{
		sourceName: 'par_identificador',
		targetName: 'Id',
		defaultValue: ''
	}, {
		sourceName: 'con_identificador',
		targetName: 'Contrato (ID)',
		defaultValue: ''
	}, {
		sourceName: 'no_contrato',
		targetName: 'No. Contrato',
		defaultValue: ''
	}, {
		sourceName: 'con_cliente',
		targetName: 'Cliente',
		defaultValue: ''
	}, {
		sourceName: 'par_fecha',
		targetName: 'Fecha',
		defaultValue: ''
	}, {
		sourceName: 'par_monto',
		targetName: 'Monto',
		defaultValue: ''
	}, {
		sourceName: 'par_referencia',
		targetName: 'Referencia',
		defaultValue: ''
	}, {
		sourceName: 'par_fecha_pago',
		targetName: 'Fecha Pago',
		defaultValue: ''
	}, {
		sourceName: 'par_monto_pagado',
		targetName: 'Monto pagado',
		defaultValue: ''
	}, {
		sourceName: 'par_tramites',
		targetName: 'Tramites',
		defaultValue: ''
	}, {
		sourceName: 'par_monto_pena',
		targetName: 'Multas',
		defaultValue: ''
	}, {
		sourceName: 'par_monto_extra',
		targetName: 'Extras',
		defaultValue: ''
	}, {
		sourceName: 'par_extra',
		targetName: 'Concepto Extra',
		defaultValue: ''
	}, {
		sourceName: 'par_remanente',
		targetName: 'Remanente',
		defaultValue: ''
	}, {
		sourceName: 'par_observaciones',
		targetName: 'Observaciones',
		defaultValue: ''
	}]
}