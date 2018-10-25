const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');

const db = require('./database');

let instances = null;
let fileExport = null;

module.exports = function (options) {
    const connections = [options.sourceDatabase, options.targetDatabase];
    instances = db.init(connections);
    fileExport = require('./file')(instances);

    return {
        export: async function () {
            try {
                let fileNames = await fs.readdirAsync(path.join(__dirname, '../../export'));

                for (const fileName of fileNames) {
                    const content = require(path.join(__dirname, '../../export', fileName));
                    const rows = await fileExport.execQuery(content);

                    let excelRows = [];

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