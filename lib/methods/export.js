const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const db = require('./database');

let instances = null;
let fileExport = null;

/**
 * Read config files and create new files
 * @param {Object} options Content of file
 * @param {Object} options.sourceDatabase Source Database to use
 * @param {Object} options.targetDatabase Target Database to use
 * @param {Object} options.export Export Object
 * @param {string} options.export.path Folder where should be saved exported files
 * @returns {Object} as
 */
module.exports = function (options) {
    const connections = [options.sourceDatabase, options.targetDatabase];
    instances = db.init(connections);
    fileExport = require('./file')(instances);

    return {
        /**
         * Read content of input files         
         * @returns {Promise.<String>} Returns final file name
         */
        export: async function () {
            try {
                let sourcePath = options.export.sourcePath;

                if (typeof sourcePath !== 'string') {
                    throw new Error('Source path must be defined and must be a string');
                }

                let fileNames = await fs.readdirAsync(sourcePath);

                for (const fileName of fileNames) {
                    const content = require(path.join(sourcePath, fileName));
                    let rows = await fileExport.execQuery(content);
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
                    const response = await fileExport.create({ fileName: content.fileName, rows: excelRows, path: options.export.path, timestamps: options.export.timestamps });

                    console.log('------ ' + response + ' created ------');
                    return response;
                }
            } catch (err) {
                console.error('main.js 19', err);
                throw err;
            }
        }
    }
}