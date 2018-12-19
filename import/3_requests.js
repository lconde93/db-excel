const clientCounts = {}

module.exports = {
	fileName: '2018-11-14-Solicitudes.xlsx',
	disabled: true,
	fields: [],
	data: {
		clients: async function (db) {
			const rows = await db.target.query(`SELECT Usuario_ID AS id, UPPER(CONCAT(Nombre, ' ', Apellido_Paterno, ' ', Apellido_Materno)) AS name,
				email, tel, tel_local, (No_Cliente * 1) AS noCliente
				FROM seg_usuarios 
				WHERE Usuario_App = 1`);

			return rows;
		},
		requests: async function (db) {
			const rows = await db.target.query(`
				SELECT CS.Solicitud_ID AS id, CS.Nombre AS name, UPPER(CONCAT(SU.Nombre, ' ', SU.Apellido_Paterno, ' ', SU.Apellido_Materno)) AS cliente, 
				CS.Informacion AS info, UPPER(P.nombre) as producto, CS.Deposito_Garantia as deposito, CONCAT(L.Prefijo, CCON.No_Contrato) AS noContrato, 
				L.Linea_ID AS lineaId, CCON.No_Contrato AS consecutivoContrato, (SU.No_Cliente * 1) AS noCliente
					FROM cat_contratos CCON
					INNER JOIN cat_cotizaciones CC ON CCON.Cotizacion_ID = CC.Cotizacion_ID
					INNER JOIN cat_solicitudes CS ON CC.Solicitud_ID = CS.Solicitud_ID
					INNER JOIN cat_lineas L ON L.Linea_ID = CC.Linea_ID
					INNER JOIN seg_usuarios SU ON SU.Usuario_ID = CC.Usuario_ID
					INNER JOIN cat_productos P ON P.Producto_ID = CC.Producto_ID;
			`);

			for (let item of rows) {
				item.info = JSON.parse(item.info);
			}

			return rows;
		},
		lines: async function (db) {
			const linesList = [{
				id: 1,
				name: 'Plataformas electrónicas',
				source: 'sol_uber'
			}, {
				id: 2,
				name: 'Colectivos',
				source: 'sol_colectivo'
			}, {
				id: 3,
				name: 'Taxis',
				source: 'sol_taxi'
			}, {
				id: 4,
				name: 'Persona Física',
				source: 'sol_persona'
			}, {
				id: 5,
				name: 'Persona Moral',
				source: 'sol_moral'
			}, {
				id: 6,
				name: 'Utilitarios',
				source: 'sol_utilitario'
			}]

			return linesList;
		},
		requestTypes: async function (db) {
			const rows = await db.target.query(`SELECT * FROM cat_tipo_solicitudes`);

			return rows;
		}
	},
	steps: [async function (db, row, index) {
		try {
			let noClientAux = (parseInt(row['acr_identificador']) - 3).toString();

			if (!clientCounts[noClientAux]) {
				clientCounts[noClientAux] = 0;
			}

			let countAux = clientCounts[noClientAux];

			const concatenatedName = (row['acr_nombre'].trim() + ' ' + row['acr_paterno'].trim() + ' ' + row['acr_materno'].trim()).toUpperCase();
			const line = db.data.lines.find(x => x.source = (row['exp_tipo']).trim());
			let request = db.data.requests.filter((x) => x.noCliente == (parseInt(row['acr_identificador']) - 3));
			request = request.find((x, i) => i == countAux);

			if (!request) {
				db.log('ERROR', `No existe la solicitud | Fila: ${index + 1}, exp_identificador: ${row['exp_identificador']} acr_identificador: ${row['acr_identificador']}`);
				const clientName = concatenatedName;

				let client = db.data.clients.find(x => x.noCliente === (parseInt(row['acr_identificador']) - 3));

				if (client) {
					const info = {
						clientName: client.name,
						clientPhone: client.tel,
						clientEmail: client.email,
					};

					const line = db.data.lines.find(x => x.source === (row['exp_tipo']).trim());

					const insertRequest = await db.insert({
						table: 'cat_solicitudes',
						fields: {
							Nombre: clientName,
							Tipo_Solicitud_ID: db.data.requestTypes.find(x => x.Linea_ID == line.id).Solicitud_ID,
							Archivo: db.dateFormatter(new Date(), 'YYYYMMDDHHmmsstt') + '_solicitud.html',
							Informacion: JSON.stringify(info),
							Deposito_Garantia: 0,
							Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
							Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
							Visible: 1,
							Activo: 1,
							Usuario_Creacion_ID: '1',
						}
					});

					db.log('SUCCESS', `Nueva solicitud creada | ID: ${insertRequest.id} Cliente: ${clientName}`);

					request = {
						id: insertRequest.id,
						info: JSON.stringify(info)
					}
				} else {
					db.log('ERROR', `No existe el cliente | Nombre: ${clientName}`);
					return;
				}
			}

			const auxObj = Object.assign({}, request.info);

			for (let key in row) {
				auxObj[key] = row[key] || '';
			}

			const jsonString = JSON.stringify(auxObj);

			const update = await db.query(`UPDATE cat_solicitudes SET Informacion = ? WHERE Solicitud_ID = ?`, [jsonString, request.id]);

			clientCounts[noClientAux] = clientCounts[noClientAux] + 1;

			db.log('SUCCESS', `Solicitud actualizada | ID: ${request.id} Nombre: ${request.name} | ${auxObj.clientName}`);

			return { updatedId: request.id };
		} catch (err) {
			console.error('STEP 1:', err);
			process.exit(0);
		}
	}]
}

function replacer(key, value) {
	return value.toString().replace(/[^\w\s]/gi, '');
}