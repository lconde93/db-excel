const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const fileMethods = require('./file');
let db = null;

/**
 * Read config files and create new files
 * @param {Object} options Content of file
 * @property {Object} options.sourceDatabase Source Database to use
 * @property {Object} options.targetDatabase Target Database to use
 * @property {Object} options.import Import Options
 * @property {string} options.import.sourcePath Folder where are import options of each excel file
 * @property {string} options.import.path Folder where excel files exists
 * @returns {Object} as
 */
module.exports = function (options, instances) {
	db = instances.target;
	/**
	 * Read content of input files         
	 * @returns {Promise.<String>} Returns final file name
	 */
	return async function () {
		const basePath = options.import.path;

		try {
			let sourcePath = options.import.sourcePath;

			if (typeof sourcePath !== 'string') {
				throw new Error('Source path must be defined and must be a string');
			}

			let fileNames = await fs.readdirAsync(sourcePath);

			if (typeof options.steps !== 'undefined') {
				if (!Array.isArray(options.steps) || !(options.steps.every(x => typeof x === 'function'))) {
					throw new Error('Parameter "steps" must by an array of functions');
				}
			}

			for (const file of fileNames) {
				const content = require(path.join(sourcePath, file));
				let fullPath = path.join(options.import.path, content.fileName);

				const jsonArray = fileMethods.read({ path: fullPath, fields: content.fields });

				console.log(jsonArray);
				return jsonArray;

				/* let count = 0;
				for (const row of jsonArray) {
					const insert = await execSteps(0, row, options.steps);

					console.log(count++, insert);
				} */
			}
		} catch (err) {
			console.error(err);
			throw err;
		}
	}
}

const execSteps = async function (index, row, callbacks, keys) {
	if (index < callbacks.length) {
		try {
			const insertItem = await callbacks[index]({ query: db.query, insert: makeInsert }, row, keys);

			return execSteps(index + 1, row, callbacks, insertItem.keys || []);
		} catch (err) {
			throw err;
		}
	} else {
		return 'Steps completed';
	}
}

const makeInsert = async function (args) {
	const keysArray = Object.keys(args.fields);

	const length = keysArray.length;
	const fieldsNames = keysArray.join(',').slice(0, -1);
	const values = keysArray.map(x => args.fields[x]);

	const insert = await db.query(`INSERT INTO ${args.table} (${fieldsNames}) VALUES ${generateInsertValues(length)}`, values);

	return { id: insert.insertId };
}

const generateInsertValues = function (length) {
	return Array(length)
		.map(x => {
			return '?'
		})
		.join(',')
		.slice(0, -1);
} 