const db = require('../common/database-connection');


exports.init = function(arr) {
    const instances = {};
    
    for (let item of arr) {
        instances[item.name] = db(item.options);
        console.log(instances[item.name]);
    }

    return instances;
}