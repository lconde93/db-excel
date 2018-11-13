module.exports = {
    fileName: 'Solicitudes',
    rawQuery: `select acr_identificador, acr_nombre, acr_paterno, acr_materno, acr_telefono, 
        acr_celular, acr_correo, acr_calle, acr_exterior, acr_interior, acr_colonia, acr_cp 
        from acreditado;`,
    transform: function(rows) {
        let users = [];
        let count = 0;

        for(let item of rows) {
            if (item.acr_nombre != '-') {
                if (item.acr_telefono == '-' || item.acr_telefono == '--' || item.acr_telefono == '000' || item.acr_telefono == '-' || item.acr_telefono == '0000000' || item.acr_telefono == '00000000000' || item.acr_telefono == '1' || item.acr_telefono == 'OOOOOO')
                    item.acr_telefono = '';

                if (item.acr_interior == 's/n' || item.acr_interior == 'S/N' || item.acr_interior == '--' || item.acr_interior == 'SN')
                    item.acr_interior = '';
                
                /* item.noContrato = 'C00' + ++count; */

                users.push(item);
            }
        }
        
        return users;
    },
    fields: [{
        sourceName: 'acr_identificador',
        targetName: 'Id',
        defaultValue: ''
    }, {
        sourceName: 'acr_nombre',
        targetName: 'Nombre',
        defaultValue: ''
    }, {
        sourceName: 'acr_paterno',
        targetName: 'Apellido Paterno',
        defaultValue: ''
    }, {
        sourceName: 'acr_materno',
        targetName: 'Apellido Materno',
        defaultValue: ''
    }, {
        sourceName: 'acr_telefono',
        targetName: 'Teléfono local',
        defaultValue: ''
    }, {
        sourceName: 'acr_celular',
        targetName: 'Celular',
        defaultValue: ''
    }, {
        sourceName: 'acr_correo',
        targetName: 'Correo',
        defaultValue: ''
    }, {
        sourceName: 'acr_calle',
        targetName: 'Calle',
        defaultValue: ''
    }, {
        sourceName: 'acr_exterior',
        targetName: 'No. exterior',
        defaultValue: ''
    }, {
        sourceName: 'acr_interior',
        targetName: 'No. interior',
        defaultValue: ''
    }, {
        sourceName: 'acr_colonia',
        targetName: 'Colonia',
        defaultValue: ''
    }, {
        sourceName: 'acr_cp',
        targetName: 'Codigo Postal',
        defaultValue: ''
    }, /* {
        sourceName: 'noContrato',
        targetName: 'No',
        defaultValue: ''
    } */]
}