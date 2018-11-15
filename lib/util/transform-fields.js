/**
 * @param {Array.<any>} originalList List to transform
 * @param {Array.<any>} fields Fields transform options
*/
module.exports = function (originalList, fields) {
	const list = [];

	for (let item of originalList) {
		const auxObj = {};

		for (let key in item) {
			const findKey = fields.find(x => x.sourceName == key);

			if (item.hasOwnProperty(key)) {
				if (findKey) {
					if (typeof item[findKey.sourceName] === 'undefined' || typeof item[findKey.sourceName] === null) {
						auxObj[findKey.targetName] = findKey.defaultValue || '';
						continue;
					}

					auxObj[findKey.targetName] = item[findKey.sourceName];
				} else {
					auxObj[key] = item[key];
				}
			}
		}

		for (let notExist of fields.filter(x => Object.keys(item).indexOf(x.sourceName) < 0)) {
			auxObj[notExist.targetName] = notExist.defaultValue;
		}

		list.push(auxObj);
	}

	return list;
}