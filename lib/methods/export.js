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
         * @returns {Object} as
         */
        export: async function () {
            try {
                let fileNames = await fs.readdirAsync(path.join(__dirname, '../../export'));

                for (const fileName of fileNames) {
                    const content = require(path.join(__dirname, '../../export', fileName));
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
                    await fileExport.create({ fileName: content.fileName, rows: excelRows, path: options.export.path });
                    const response = '------ ' + content.fileName + '.xlsx' + ' created ------';

                    console.log(response);
                    return response;
                }
            } catch (err) {
                console.error('main.js 19', err);
                throw err;
            }
        }
    }
}