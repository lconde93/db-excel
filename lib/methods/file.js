const xlsx = require('xlsx');
const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

const model = require('../../models/file-export-options');

module.exports = function (db) {
    const obj = {};

    obj.execQuery = async function (options) {
        const rows = await db.source.query(options.rawQuery);

        return rows;
    }

    obj.create = async function (options) {
        let targetPath = options.path;

        let fileName = options.fileName + '.xlsx';
        let filePath = targetPath && typeof targetPath === 'string' ? targetPath : path.join(__dirname, '../../files');
        let fullPath = path.join(filePath, fileName);

        let parsedExcel = xlsx.utils.json_to_sheet(options.rows);
        let wb = { SheetNames: [], Sheets: {} };

        wb.SheetNames.push('Hoja 1');
        wb.Sheets['Hoja 1'] = parsedExcel;

        try {
            await fs.accessAsync(filePath);
        } catch (err) {
            await fs.mkdirAsync(filePath);
        }

        try {
            await Promise.promisify(xlsx.writeFileAsync)(fullPath, wb, { bookType: 'xlsx' });
        } catch (err) {
            throw err;
        }
    }

    return obj;
}