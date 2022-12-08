const express = require('express');

const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validaUsuarioUnico } = require('../middlewares/validar-usuario-unico');
const { validarJWT } = require('../middlewares/validador-jwt');
const {
    obtenerUsuariosGet,
    obtenerUsuarioGet,
    agregarUsuarioPost,
    actualizarUsuarioPut,
    borrarUsuarioDelete
} = require('../controllers/usuario.controller');

const routerUsuario = require('express').Router();

routerUsuario.get('/',[validarJWT], obtenerUsuariosGet);
routerUsuario.get('/:id',[validarJWT], obtenerUsuarioGet);
routerUsuario.post('/',[validarJWT],[
    check('usuario', 'Debe ingresar el Usuario.').notEmpty(),
    check('usuario').custom(validaUsuarioUnico),
    check('email', 'Debe ingresar el E-Mail').notEmpty(),
    check('contrasena', 'Debe ingresar la Contraseña').notEmpty(),
    validarCampos
], agregarUsuarioPost);
routerUsuario.put('/',[validarJWT],[
    check('id', 'El ID es obligatorio.').notEmpty(),
    check('usuario', 'Debe ingresar el Usuario.').notEmpty(),
    validarCampos        
], actualizarUsuarioPut);
routerUsuario.delete('/',[validarJWT],[
    check('id', 'El ID es obligatorio.').notEmpty(),    
    validarCampos        
], borrarUsuarioDelete);

module.exports = routerUsuario;