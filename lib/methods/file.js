const model = require('../../models/file-export-options');

module.exports = function(db) {
    const obj = {};

    obj.create = async function(options) {
        const rows = await db.source.query(options.rawQuery);

        return rows;
    }

    return obj;
}
