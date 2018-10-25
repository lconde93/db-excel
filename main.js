const exportOptions = require('./values');
const dbExport = require('./lib/methods/export')(exportOptions);

const main = async function () {
    try {
        await dbExport.export();
    } catch (err) {
        console.error('main.js 19', err);
    }
    process.exit(0);
}();
