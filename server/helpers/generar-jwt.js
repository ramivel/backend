const jwt = require('jsonwebtoken');

/* Agregar rol cuando corresponda */
const generarJWT = (uid = '') => {
    return new Promise( (resolve, reject) => {
        const payload = { uid };
        jwt.sign( payload, process.env.SEED, {
            expiresIn: '24h'
        }, (err, token) => {
            if(err) reject('No se pudo generar token');
            else resolve(token);
        });
    });
};

module.exports = {
    generarJWT
};