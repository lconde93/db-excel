const dbExport = require('./lib/methods/export')(exportOptions);

module.exports = {
    export: dbExport.export
}
