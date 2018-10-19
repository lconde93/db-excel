const Promise = require('bluebird');
const mysql = require('promise-mysql');

function getConnection(pool) {
    //console.log(pool);
    return pool.getConnection().disposer(function (conn) {
        pool.releaseConnection(conn);
    });
}

module.exports = function (options) {
    let pool = mysql.createPool({
        host: options.host,
        user: options.user,
        password: options.password,
        database: options.database,
        port: options.port || 3306
    });


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