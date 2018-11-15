const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const fileMethods = require('./file');
const formatDate = require('../util/date-formatter');
const util = require('../util');
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

			if (!fs.existsSync(options.import.logPath)) {
				console.log('Create log path');
				fs.mkdirSync(options.import.logPath);
			}

			const logPath = util.dateFormat(new Date(), 'YYYYMMDDHHmmss');
			await fs.mkdirAsync(path.join(options.import.logPath, logPath));

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

				console.log('------ Importing: ' + content.fileName + ' ------');

				const jsonArray = await fileMethods.read({ path: fullPath, fields: content.fields });

				data.fileName = content.fileName;
				data.path = path.join(options.import.logPath, logPath);
				data.logName = file.replace('.js', '') + '.log';

				if (typeof content.data === 'object') {
					for (const fn in content.data) {
						data[fn] = await content.data[fn](db);
					}
				}

				for (let i = 0; i < jsonArray.length; i++) {
					const row = jsonArray[i];
					const insert = await execSteps(0, jsonArray, row, i, content.steps, data);
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

const execSteps = async function (step, list, row, index, callbacks, data, cbArgs) {
	if (step < callbacks.length) {
		try {
			const exCb = await callbacks[step]({
				query: db.target.query,
				insert: makeInsert,
				dateFormatter: formatDate,
				data: data,
				list: list,
				log: logFile(index, data.path, data.logName, data.fileName)
			}, row, index, cbArgs);

			if (exCb && typeof exCb === 'object') {
				return execSteps(step + 1, list, row, index, callbacks, data, exCb || {});
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

const logFile = function (index, logPath, name, fileName) {
	return async function (type, text) {
		const datetime = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');

		const appendText = `\r\n [${datetime}] [${type}] [Index: ${index}] [File: ${fileName}] | ${text} \r\n`;

		try {
			await fs.appendFileAsync(path.join(logPath, name), appendText);
		} catch (err) {
			console.log('LOG ERROR:', err);
		}

		return appendText;
	}
}