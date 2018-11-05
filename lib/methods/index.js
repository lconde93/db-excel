const db = require('./database');

let instances = null;

module.exports = function (options) {
    const connections = [options.sourceDatabase, options.targetDatabase];
    instances = db.init(connections);

    return {
        export: require('./export')(options, instances),
        import: require('./import')(options, instances)
    }
}