const jwt = require('jsonwebtoken');

module.exports.validarJWT = (req, res, next) => {
    const token = req.header('token');
    if (!token) {
        res.status(401).send({ msg: 'El token no es valido' })
    } else {
        jwt.verify(token, process.env.SEED, function (err, decoded) {
            if(err){
                res.status(401).send({ msg: 'El token no es valido' });
            }else{
                if(decoded.uid){
                    req.body.usulogin = decoded.uid;
                    next();
                }else{
                    res.status(401).send({ msg: 'El token no es valido' });
                }
            }
        })
    }
}