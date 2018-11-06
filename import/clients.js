module.exports = {
	fileName: '2018-11-06-Clientes.xlsx',
	fields: [/* {
		sourceName: 'Id',
		targetName: 'identif'
	} */],
	steps: [async function (db, row) {
		const existsAdress = await db.query('select colonia_id from cat_colonias where colonia like "%' + row['Colonia'] + '%" and cp = ' + row['Codigo Postal']  +';');


		return { keys: [] }
	}, async function(db, row, keys) {

	}, async function(db, row, keys) {

	}],
}