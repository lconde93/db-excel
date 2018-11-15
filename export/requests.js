module.exports = {
    fileName: 'Solicitudes',
    rawQuery: `
        SELECT * FROM expediente EXP
            LEFT JOIN acreditado ACR ON ACR.exp_identificador = EXP.exp_identificador
            LEFT JOIN actividad_actual ACTA ON ACTA.exp_identificador = EXP.exp_identificador
            LEFT JOIN marco_familiar MAR ON MAR.exp_identificador = EXP.exp_identificador
            LEFT JOIN actividad_anterior ACTN ON ACTN.exp_identificador = EXP.exp_identificador
            LEFT JOIN aval AV ON AV.exp_identificador = EXP.exp_identificador
            LEFT JOIN verificacion_documentos VD ON VD.exp_identificador = EXP.exp_identificador
            LEFT JOIN proyeccion PR ON PR.exp_identificador = EXP.exp_identificador
        `,
    transform: function (rows) {
        let list = rows.slice();

        for (const item of list) {
            delete item.emp_identificador;
            delete item.exp_llave;
        }

        return list;
    },
    fields: []
};