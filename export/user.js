module.exports = {
    fileName: 'user',
    rawQuery: 'SELECT * FROM usuario;SELECT * FROM acreditado;',
    transform: function(rows) {
        let users = rows[0];
        let acre = rows[1];

        let count = 0;
        for(let item of users) {
            item.usu_nombre += ' ' + (acre[count].acr_nombre ? acre[count].acr_nombre : 'No tiene prro');
            item.noContrato = 'C00' + count;
            count++;
        }
        return users;
    },
    fields: [{
        sourceName: 'emp_identificador',
        targetName: 'identificador',
        defaultValue: ''
    }, {
        sourceName: 'usu_nombre',
        targetName: 'nombre',
        defaultValue: ''
    }, {
        sourceName: 'usu_cuenta',
        targetName: 'usuario',
        defaultValue: ''
    }, {
        sourceName: 'usu_perfil',
        targetName: 'rol',
        defaultValue: ''
    }, {
        sourceName: 'noContrato',
        targetName: 'No Contrato',
        defaultValue: ''
    }]
}