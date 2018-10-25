const db = require('../common/database-connection');

/**
 * Initialize connection
 * @param {Object} arr Object of properties
 * @param {string} arr.name Name of instance
 * @param {number} arr.options Connection options of instance
 * @returns {Array<Object>} instances
 */
exports.init = function (arr) {
    const instances = {};

    for (let item of arr) 
        instances[item.name] = db(item.options);        

    return instances;
}