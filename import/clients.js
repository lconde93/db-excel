module.exports = {
	fileName: '2018-11-06-Clientes.xlsx',
	disabled: false,
	fields: [/* {
		sourceName: 'Id',
		targetName: 'identif'
	} */],
	steps: [async function (db, row, index) {
		const existsAdress =
			await db.query('select colonia_id from cat_colonias where colonia like "%' + row['Colonia'] + '%" and cp = ' + row['Codigo Postal'] + ';');

		console.log('Step 1:', existsAdress);

		return { keys: [{ id: 1 }] };
	}, async function (db, row, index, args) {
		console.log('Step: 2', args);

		return { hello: 1 };
	}, async function (db, row, index, args) {
		console.log('Step: 2', args, index);

		return { keys: [] };
	}],
}