const mainFile = require('./values');
const Promise = require('bluebird');
const db = require('./lib/methods/database');
const connections = [mainFile.sourceDatabase, mainFile.targetDatabase];
const instances = db.init(connections);
const fileExport = require('./lib/methods/file')(instances);
const fs = Promise.promisifyAll(require('fs'));
const path = require('path')
const xlsx = require('xlsx');

const consult = async function () {

    try {        
        let fileNames = await fs.readdirAsync(path.join(__dirname, '/input-data'));
        
        for (let counter = 0; counter < fileNames.length; counter ++) {            
            let file = require(path.join(__dirname, '/input-data', fileNames[counter]));

            for (let dataCounter = 0; dataCounter < file.data.length; dataCounter ++) {
                let jsonObject = file.data[dataCounter];

                const rows = await fileExport.executeQuery(jsonObject);
                let excelRows = [];
                rows.map((row, i) => {
                    let excelRowAux = {};
                    jsonObject.fields.forEach((field) => {
                        if (row.hasOwnProperty(field.sourceName))
                            excelRowAux[field.targetName] = row[field.sourceName];
                        else
                            excelRowAux[field.targetName] = field.defaultValue;
                    });
                    /* console.log((i + 1) + ':', row); */
                    /* console.log(excelRowAux); */
                    excelRows.push(excelRowAux);
                });

                /* create excel */
                await fileExport.create({ fileName: jsonObject.fileName, rows: excelRows });                
            }
        }
    } catch (err) {
        console.error('main.js 19', err);
    }
}

const main = async function () {
    await consult();
    process.exit(0);
}();
