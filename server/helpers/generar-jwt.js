const jwt = require('jsonwebtoken');

const generarJWT = ( uid = '', id_rol = '', id_departamento = '' ) => {
    return new Promise( (resolve, reject) => {
        
            const payload = { uid, id_rol, id_departamento };

            jwt.sign( payload, process.env.SEED, {
                expiresIn: '24h'
            }, (err, token) => {
                if( err ){
                    reject('No se pudo generar token')
                } else {
                    
                    resolve(token);
                }
            })

    })


};

module.exports = {
    generarJWT
};