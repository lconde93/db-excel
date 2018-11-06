const exportOptions = require('./values');
const excelExport = require('./index')(exportOptions);

const main = async function () {
    try {

        /* await excelExport.export(); */
        await excelExport.import();

    } catch (err) {
        console.error('main.js 19', err);
    }
    process.exit(0);
}();
