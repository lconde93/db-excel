const xlsx = require('xlsx');
const path = require('path');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

const model = require('../../models/file-export-options');
const util = require('../util');

/**
 * Util function of file
 * @returns {Object} Object
 * @property {Function} create Create excel final file and return file name
 * @property {Function} read Read excel file and return transformed list
 */
module.exports = {
    /** Create final file
    * @param {Object} options Options Object
    * @param {string} options.path final path where files will be saved
    * @param {string} options.fileName Name of the file
    * @param {Array<Object>} options.rows Rows to insert in final file
    * @returns {Promise.<any>} Promise.<any>
    */
    create: async function (options) {
        let targetPath = options.path;

        let fileName = (options.timestamps ? util.dateFormat(new Date(), 'YYYYMMDDHHmmsstt') + '-' : '') + options.fileName + '.xlsx';
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

        return fileName;
    },
    /**
     * 
     * @param {Object} options Options Object
     */
    read: async function (options) {
        let filePath = options.path;

        const workbook = xlsx.readFile(filePath, { cellDates: true });

        const list = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        return util.transformFields(list, options.fields);
    }
}