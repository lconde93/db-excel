const util = require('../lib/util');

module.exports = {
	fileName: '2018-11-06-Clientes.xlsx',
	/* disabled: true, */
	fields: [/* {
		sourceName: 'Id',
		targetName: 'identif'
	} */],
	steps: [async function (db, row, index) {
		try {
			const existsColony = await db.query('select colonia_id AS id from cat_colonias where colonia like "%' + row['Colonia'] + '%" and cp = ' + row['Codigo Postal'] + ';');

			if (!existsColony.length) {
				db.log('MISSING_INFO', `No hay registros de Colonia(s) con ${row['Colonia']} y CP: ${row['Codigo Postal']}`);
				return { coloniaId: null };
			}

			db.log('SUCCESS', `Existe la colonia: ${row['Colonia']} y CP: ${row['Codigo Postal']}`);
			return { coloniaId: existsColony[0].id };
		} catch (err) {
			console.error('STEP 1:', err);
			return { coloniaId: null };
		}
	}, async function (db, row, index, args) {
		console.log('Step: 2', args);
		let result = null;

		try {
			if (args.coloniaId) {
				result = await db.insert({
					table: 'direcciones',
					fields: {
						Calle: row.Calle,
						Numero_Exterior: row['No. exterior'],
						Numero_Interior: row['No. interior'],
						Colonia_ID: args.coloniaId,
						Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
						Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
						Visible: 1,
						Activo: 1,
						Usuario_Creacion_ID: '1'
					}
				});

				db.log('SUCCESS', `Direccion insertada: ${row['Calle']} ${row['Colonia']} cp: ${row['Codigo Postal']}`);
			}
		} catch (err) {
			console.error('STEP 2:', err);
		}

		return { direccionId: result ? result.id : null };
	}, async function (db, row, index, args) {
		console.log('Step: 3', args);

		try {
			const username = genUsername(db, { firstName: row.Nombre.trim().toLowerCase(), lastName: row['Apellido Paterno'].trim().toLowerCase() })
			const email = transformEmail(row['Correo'], index);

			const result = await db.insert({
				table: 'seg_usuarios',
				fields: {
					Nombre_Usuario: genUsername(),
					Contrasena: '',
					Nombre: row.Nombre.trim().toUpperCase(),
					Apellido_Paterno: row['Apellido Paterno'].trim().toUpperCase(),
					Apellido_Materno: row['Apellido Materno'].trim().toUpperCase(),
					Tel: row['Celular'],
					Url_Imagen: '',
					Tel_Local: row['Teléfono local'],
					Email: email,
					First_Login: 1,
					No_Cliente: fillNumber(index),
					Token_Op: '',
					Estatus: '0',
					Tipo: '0',
					Carrier_ID: '1',
					Direccion_ID: args.direccionId ? args.direccionId : '0',
					Rol_ID: '0',
					Usuario_Admin: 0,
					Usuario_App: 1,
					Fecha_Creacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Fecha_Actualizacion: db.dateFormatter(new Date(), 'YYYY-MM-DD HH:mm:ss'),
					Visible: 1,
					Activo: 1,
					Usuario_Creacion_ID: '1'
				}
			});

			db.log('SUCCESS', `Usuario insertado | ID: ${result.id} - ${username}, ${email}`);
			return { userId: result ? result.id : null };
		} catch (err) {
			console.error('STEP 3:', err);

			return { userId: null };
		}
	}, async function (db, row, index, args) {
		try {
			const updateRow = await db.query(`UPDATE seg_usuarios SET Contrasena = MD5('querty.123') WHERE Usuario_ID = ${args.userId}`);

			db.log('SUCCESS', `Contraseña de usuario actualizado | ID: ${args.userId}`);
		} catch (err) {
			console.error('STEP 4:', err);
		}

		return { updateId: args.userId };
	}],
}

const transformEmail = function (mail, index) {
	if (mail === 'contacto@fintra.com.mx') {
		return 'contacto' + (index + 1) + '@fintra.com.mx';
	}

	return mail.toLowerCase();
}

const fillNumber = function (index) {
	let number = index + 1;

	if (number > 9999) return number;

	return Array(4 - number.toString().length).fill('0', 0).join('') + (number.toString());
}

const genUsername = async function (db, obj) {
	try {
		let username = util.generateUsername(obj.firstName, obj.lastName);

		const users = db.query(`SELECT Usuario_ID AS id, Nombre_Usuario as username WHERE Usuario_App = 1 AND Nombre_Usuario LIKE('%'${username}'%')`);

		if (!users.length) return username;

		let result = username;
		let counter = 0;

		users = users.filter(x => x.username.length >= username.length);

		while (users[counter] && result === users[counter].username) {
			result = username + (counter + 1)
			counter++;
		}

		return result;
	} catch (err) {
		throw err;
	}
}