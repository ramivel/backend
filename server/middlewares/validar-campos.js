const { validationResult } = require('express-validator');

module.exports.validarCampos = (req, res, next ) => {
    
    const err = validationResult(req);
    if(!err.isEmpty()) return res.status(400).json(err);
    
    next();
}