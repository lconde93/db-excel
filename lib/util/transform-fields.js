/**
 * @param {Array.<any>} originalList List to transform
 * @param {Array.<any>} fields Fields transform options
*/
module.exports = function (originalList, fields) {
	const list = [];

	for (let item of originalList) {
		const auxObj = {};

		for (let sub of fields) {
			auxObj[sub.targetName] = item[sub.sourceName];
		}

		list.push(auxObj);
	}
}