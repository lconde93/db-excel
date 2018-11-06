const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const fileMethods = require('./file');

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
	/**
	 * Read content of input files         
	 * @returns {Promise.<String>} Returns final file name
	 */
	return async function () {
		const basePath = options.path;

		try {
			let sourcePath = options.import.sourcePath;

			if (typeof sourcePath !== 'string') {
				throw new Error('Source path must be defined and must be a string');
			}

			let fileNames = await fs.readdirAsync(sourcePath);

		} catch (err) {
			console.log(err);
			throw err;
		}
	}
}