module.exports = {
    data: [{
        fileName: 'user',
        rawQuery: 'SELECT * FROM usuario',
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
        }]
    }]
}