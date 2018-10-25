module.exports = {
    fileName: 'user',
    rawQuery: 'SELECT * FROM usuario;SELECT * FROM algo',
    /* transform: function(result) {
        
        return { name: '', apellido: '' };
    }, */
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
}