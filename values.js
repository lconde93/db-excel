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
            database: 'fintra_carga_inicial',
            port: 3306
        }
    },
    export: {
        /* sourcePath: 'C:/Users/e-bitware/Documents/Node/db-excel/export',
        path: 'C:/Users/e-bitware/Documents/excelPrueba', */
        sourcePath: 'C:/Users/AV90197/Documents/node-projects/db-excel/export',
        path: 'C:/Users/AV90197/Documents/Documentacion/Fintra/Layouts',
        timestamps: true
    },
    import: {
        sourcePath: 'C:/Users/AV90197/Documents/node-projects/db-excel/import',
        path: 'C:/Users/AV90197/Documents/Documentacion/Fintra/CargasMasivas',
    }
}