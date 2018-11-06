module.exports = {
	fileName: '2018-11-01-Contratos.xlsx',
	disabled: true,
	fields: [],
	steps: [async function (db, row) {
		const existsProduct =
			await db.query('select producto_id from cat_colonias where colonia like "%' + row['Colonia'] + '%" and cp = ' + row['Codigo Postal'] + ';');

		console.log('10', existsAdress);

		return { keys: [] }
	}, async function (db, row, keys) {

	}, async function (db, row, keys) {

	}],
}