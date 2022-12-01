  
const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { rolesGet, rolesGetActive } = require('../controllers/roles.controller');
const { validaUsuario } = require('../middlewares/valida-usuario.middlewares');
const { validarJWT } = require('../middlewares/validador-jwt');       
const router = Router();
router.get('/', [validarJWT], rolesGet);
router.get('/active', [validarJWT], rolesGetActive);
module.exports = router;