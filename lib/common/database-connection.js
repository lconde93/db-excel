const Promise = require('bluebird');
const mysql = require('promise-mysql');

function getConnection(pool) {    
    return pool.getConnection().disposer(function (conn) {
        pool.releaseConnection(conn);
    });
}


/**
 * Create DB connections
 * @param {Object} options Object of properties
 * @param {string} options.host Host to connect
 * @param {number} options.port Port to use
 * @param {string} options.user User of database 
 * @param {string} options.password Password of user
 * @param {string} options.database Name of database to use 
 * @returns {Object} object
 */
module.exports = function (options) {
    let pool = mysql.createPool({
        host: options.host,
        user: options.user,
        password: options.password,
        database: options.database,
        port: options.port || 3306,
        multipleStatements: true
    });

    /**
     * Execute Query
     * @param {string} rowSQL Query to execute
     * @param {string} data Data to use when SP is used
     
     * @returns {Promise.<any>} Promise.<any>
     */
    const query = function (rawSQL, data) {
        return Promise.using(getConnection(pool), function (conn) {
            return conn.query(rawSQL, data);
        }).then(function (rows) {
            return rows;
        }).catch(function (err) {
            let errSend = {
                options: Object.assign({}, options),
                error: err
            }

            delete errSend.options.password;
            return Promise.reject(errSend);
        });
    }


    return {
        query
    };
}