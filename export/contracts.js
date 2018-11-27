const linesList = [{
	id: 1,
	name: 'Plataformas electrónicas',
	source: 'con_uber'
}, {
	id: 2,
	name: 'Colectivos',
	source: 'con_colectivo'
}, {
	id: 3,
	name: 'Taxis',
	source: 'con_taxi'
}, {
	id: 4,
	name: 'Persona Física',
	source: 'con_persona'
}, {
	id: 5,
	name: 'Persona Moral',
	source: 'con_moral'
}, {
	id: 6,
	name: 'Utilitarios',
	source: 'con_utilitario'
}]

module.exports = {
	fileName: 'Contratos',
	rawQuery: `SELECT con_identificador, con_tipo, con_cliente, con_semanal, con_primer_pago, con_pagare, 
		con_marca, con_modelo, con_gps, con_trabapalancas, con_sensor, con_placas, con_factura, con_motor, con_agencia,
		con_activo, con_semanas
		FROM contrato;`,
	transform: function (rows) {
		let list = rows.slice();
		let count = 0;

		for (let item of list) {
			let findType = linesList.findIndex(x => x.source === item.con_tipo);

			if (findType > -1) {
				item.con_tipo = linesList[findType].name;
				item.id_linea = linesList[findType].id;
			}

			item.con_gps = item.con_gps ? 'Si' : 'No';
			item.con_sensor = item.con_sensor == '1' ? 'Si' : 'No';
			item.con_trabapalancas = item.con_trabapalancas == '1' ? 'Si' : 'No';

			item.con_activo = item.con_activo === '0' ? 'No' : 'Si';
		}

		return list;
	},
	fields: [{
		sourceName: 'con_identificador',
		targetName: 'Id',
		defaultValue: ''
	}, {
		sourceName: 'con_no_contrato',
		targetName: 'No. Contrato',
		defaultValue: ''
	}, {
		sourceName: 'con_tipo',
		targetName: 'Linea de Negocio',
		defaultValue: ''
	}, {
		sourceName: 'id_linea',
		targetName: 'Linea (ID)',
		defaultValue: ''
	}, {
		sourceName: 'con_cliente',
		targetName: 'Cliente',
		defaultValue: ''
	}, {
		sourceName: 'con_semanal',
		targetName: 'Pago Semanal',
		defaultValue: ''
	}, {
		sourceName: 'con_semanas',
		targetName: 'No. Semanas',
		defaultValue: ''
	}, {
		sourceName: 'con_primer_pago',
		targetName: 'Fecha primer Pago',
		defaultValue: ''
	}, {
		sourceName: 'con_pagare',
		targetName: 'Deposito en Garantía',
		defaultValue: ''
	}, {
		sourceName: 'con_marca',
		targetName: 'Marca',
		defaultValue: ''
	}, {
		sourceName: 'con_modelo',
		targetName: 'Modelo',
		defaultValue: ''
	}, {
		sourceName: 'con_gps',
		targetName: 'Geolocalizador',
		defaultValue: ''
	}, {
		sourceName: 'con_trabapalancas',
		targetName: 'Trabapalancas',
		defaultValue: ''
	}, {
		sourceName: 'con_sensor',
		targetName: 'Sensor de Precencia',
		defaultValue: ''
	}, {
		sourceName: 'con_placas',
		targetName: 'Placas',
		defaultValue: ''
	}, {
		sourceName: 'con_factura',
		targetName: 'Folio factura',
		defaultValue: ''
	}, {
		sourceName: 'con_motor',
		targetName: 'Motor',
		defaultValue: ''
	}, {
		sourceName: 'con_agencia',
		targetName: 'Agencia',
		defaultValue: ''
	}, {
		sourceName: 'con_activo',
		targetName: 'Activo',
		defaultValue: ''
	}]
}