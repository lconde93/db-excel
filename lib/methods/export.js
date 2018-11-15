const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const fileMethods = require('./file');
const util = require('../util');

/**
 * Read config files and create new files
 * @param {Object} options Content of file
 * @property {Object} options.sourceDatabase Source Database to use
 * @property {Object} options.targetDatabase Target Database to use
 * @property {Object} options.export Export Object
 * @property {string} options.export.path Folder where should be saved exported files
 * @returns {Object} as
 */
module.exports = function (options, instances) {
    /**
     * Read content of input files         
     * @returns {Promise.<String>} Returns final file name
     */
    return async function () {
        try {
            let sourcePath = options.export.sourcePath;

            if (typeof sourcePath !== 'string') {
                throw new Error('Source path must be defined and must be a string');
            }

            let fileNames = await fs.readdirAsync(sourcePath);

            for (const fileName of fileNames) {
                const content = require(path.join(sourcePath, fileName));
                if (content.disabled === true) continue;

                console.log('------ Exporting: ' + content.fileName + ' ------');

                let rows = await instances.source.query(content.rawQuery);
                let excelRows = [];

                if (typeof content.transform === 'function') {
                    rows = content.transform(rows);
                }

                excelRows = util.transformFields(rows, content.fields);

                /* create excel */
                const response = await fileMethods.create({ fileName: content.fileName, rows: excelRows, path: options.export.path, timestamps: options.export.timestamps });

                console.log('------ ' + content.fileName + ' imported ------');
                console.log('------ ' + response + ' created ------ \n');
            }

            return 'success';
        } catch (err) {
            console.error('main.js 19', err);
            throw err;
        }
    }
}