const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const fileMethods = require('./file');
const formatDate = require('../util/date-formatter');
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
	db = instances;
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

			for (const file of fileNames) {
				const data = {};
				const content = require(path.join(sourcePath, file));
				if (content.disabled === true) continue;

				if (!(typeof content.fileName === 'string' && content.fileName.trim() != '')) {
					throw new Error('fileName must be an no empty string');
				}

				let fullPath = path.join(options.import.path, content.fileName);

				if (typeof content.steps !== 'undefined') {
					if (!Array.isArray(content.steps) || !(content.steps.every(x => typeof x === 'function'))) {
						throw new Error('Parameter "steps" must by an array of functions');
					}
				}

				const jsonArray = await fileMethods.read({ path: fullPath, fields: content.fields });

				if (typeof content.data === 'object') {
					for (const fn in content.data) {
						data[fn] = await content.data[fn](db);
					}
				}

				for (let i = 0; i < jsonArray.length; i++) {
					const row = jsonArray[i];
					const insert = await execSteps(0, row, i, content.steps, data);
					console.log(i, insert);
				}

				console.log('------ ' + content.fileName + ' imported ------');
			}
		} catch (err) {
			console.error(err);
			throw err;
		}
	}
}

const execSteps = async function (step, row, index, callbacks, data, cbArgs) {
	if (step < callbacks.length) {
		try {
			const insertItem = await callbacks[step]({ query: db.target.query, insert: makeInsert, dateFormatter: formatDate, data: data }, row, index, cbArgs);

			if (insertItem && typeof insertItem === 'object') {
				return execSteps(step + 1, row, index, callbacks, data, insertItem || {});
			} else {
				return 'Steps Completed';
			}
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
	const fieldsNames = keysArray.join(',');
	const values = keysArray.map(key => args.fields[key]);

	const insert = await db.target.query(`INSERT INTO ${args.table} (${fieldsNames}) VALUES (${generateInsertValues(length)})`, values);

	return { id: insert.insertId };
}

const generateInsertValues = function (length) {
	return Array(length)
		.fill('?', 0)
		.join(',');
} 