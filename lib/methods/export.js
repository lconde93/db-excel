const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const fileMethods = require('./file');

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

                let rows = await instances.source.query(content.rawQuery);
                let excelRows = [];

                if (typeof content.transform === 'function') {
                    rows = content.transform(rows);
                }

                for (let row of rows) {
                    let excelRowAux = {};

                    content.fields.forEach((field) => {
                        if (row.hasOwnProperty(field.sourceName))
                            excelRowAux[field.targetName] = row[field.sourceName];
                        else
                            excelRowAux[field.targetName] = field.defaultValue;
                    });

                    excelRows.push(excelRowAux);
                }

                /* create excel */
                const response = await fileMethods.create({ fileName: content.fileName, rows: excelRows, path: options.export.path, timestamps: options.export.timestamps });

                console.log('------ ' + response + ' created ------');
            }

            return 'success';
        } catch (err) {
            console.error('main.js 19', err);
            throw err;
        }
    }
}