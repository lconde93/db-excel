module.exports = {
    sourceDatabase: {
        name: 'source',
        options: {
            host: '192.168.100.2',
            user: 'root',
            password: 'Bitware2016',
            database: 'fintraco_sistema',
            port: 3306
        }
    },
    targetDatabase: {
        name: 'target',
        options: {
            host: '192.168.100.2',
            user: 'root',
            password: 'Bitware2016',
            database: 'fintradesa',
            port: 3306
        }
    }
}