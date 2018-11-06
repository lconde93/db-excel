const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
<<<<<<< HEAD
const db = require('./database');
const xlsx = require('xlsx');

let instances = null;
let fileExport = null;
let fileImport = null;
=======
const fileMethods = require('./file');
>>>>>>> bec3e2f2cddbcbaac14d1b2fed5ee1ba77a49922

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
<<<<<<< HEAD
        }, 
        import: async function () {
            try {
                /* console.log(options); */
                let sourcePath = options.export.sourcePath;
                /* console.log(sourcePath); */

                if (typeof sourcePath !== 'string') {
                    throw new Error('Source path must be defined and must be a string');
                }

                let fileNames = await fs.readdirAsync(sourcePath);

                for (const fileName of fileNames) {
                    /* console.log(fileName); */
                    let workbook = await xlsx.readFile(path.join(sourcePath, fileName));
                    let worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    let jsonBody = xlsx.utils.sheet_to_json(worksheet);
                    /* console.log(jsonBody); */
                    let newList = {};
                    for (let item of jsonBody) {
                        /* let item = jsonBody[0]; */
                        /* console.log(item); */
                        newList[item['Correo']] = newList[item['Correo']] || [];
                        newList[item['Correo']].push(item);

                        /* let rows = await instances.target.query('select colonia_id from cat_colonias where colonia like "%' + item['Colonia'] + '%" and cp = ' + item['Codigo Postal']  +';');
                        console.log(rows); */
                    }
                    var keys = Object.keys(newList);
                    for (let key of keys) {
                        if (newList[key].length > 1)
                            console.log(newList[key]);
                    }
                /*    const content = require(path.join(sourcePath, fileName));
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
                    } */

                    /* create excel */
                   /*  const response = await fileExport.create({ fileName: content.fileName, rows: excelRows, path: options.export.path, timestamps: options.export.timestamps });

                    console.log('------ ' + response + ' created ------');
                    return response;*/
                } 
            } catch (err) {
                console.error('main.js 19', err);
                throw err;
            }
=======

            return 'success';
        } catch (err) {
            console.error('main.js 19', err);
            throw err;
>>>>>>> bec3e2f2cddbcbaac14d1b2fed5ee1ba77a49922
        }
    }
}