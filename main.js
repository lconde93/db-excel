const mainFile = require('./values');
const db = require('./lib/methods/database');
const connections = [mainFile.sourceDatabase, mainFile.targetDatabase];
const instances = db.init(connections);
const fileExport = require('./lib/methods/file')(instances);

const consult = async function () {

    try {
        const rows = await fileExport.create({ rawQuery: 'SELECT * FROM usuario;' });

        rows.map((x, i) => {
            console.log((i + 1) + ':', x);
        });
    } catch (err) {
        console.error('main.js 19', err);
    }
}

const main = function () {
    consult();
}();
