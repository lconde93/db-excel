/**
 * @param {Array.<any>} originalList List to transform
 * @param {Array.<any>} fields Fields transform options
*/
module.exports = function (originalList, fields) {
	const list = [];

	for (let item of originalList) {
		const auxObj = {};

		for (let key in item) {
			if (item.hasOwnProperty(key)) {
				const findKey = fields.find(x => x.sourceName == key);

				if (findKey) {
					auxObj[findKey.targetName] = item[findKey.sourceName];
				} else {
					auxObj[key] = item[key];
				}
			}
		}

		list.push(auxObj);
	}

	return list;
}