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

			for (const file of fileNames) {
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

				for (let i = 0; i < jsonArray.length; i++) {
					const row = jsonArray[i];
					const insert = await execSteps(0, row, i, content.steps);
					console.log(i, insert);
				}
			}
		} catch (err) {
			console.error(err);
			throw err;
		}
	}
}

const execSteps = async function (step, row, index, callbacks, cbArgs) {
	if (step < callbacks.length) {
		try {
			const insertItem = await callbacks[step]({ query: db.query, insert: makeInsert }, row, index, cbArgs);

			if (insertItem && typeof insertItem === 'object') {
				return execSteps(step + 1, row, index, callbacks, insertItem || {});
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