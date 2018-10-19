module.exports = {
    fileName: '', // Name to save in the server
    rawQuery: '', // Raw SQL Query
    fields: [{
        sourceName: '', // Field from the rawQuery
        targetName: '', // Field name in excel file
        defaultValue: '' // Default value if field in raw query is NULL
    }]
}