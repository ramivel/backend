  
const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { usuarioGetActDir,
        getUsuarios,
        getUsuariosRepo,
        updateUsuario,
        usuarioSolicitudGet,
        usuarioElaboradoGet,
        brindaAccesoPut,
        agregarUsuarioPost,
        crearUsuariosAleatorios,
        borrarUsuario } = require('../controllers/usuario.controller');
const { validaUsuario } = require('../middlewares/valida-usuario.middlewares');
        
const { validarJWT } = require('../middlewares/validador-jwt');

const router = Router();

router.get('/usrsol',[validarJWT], usuarioSolicitudGet);
router.get('/usrela/:departamento',[validarJWT], usuarioElaboradoGet);
router.get('/:id/:dat',[validarJWT], usuarioGetActDir);
router.get('/usuarios-get',[validarJWT], getUsuarios);
router.get('/usuarios-get-rep',[validarJWT], getUsuariosRepo);
router.put('/usuario-update',[validarJWT], updateUsuario);
router.put('/:id',[validarJWT], brindaAccesoPut)
router.post('/',[validarJWT],[check('login', 'Por favor introduzca el usuario').not().isEmpty(),
                 check('id_rol', 'Por favor introduzca el rol del usuario').not().isEmpty(),
                 check('id_departamento', 'Por favor introduzca el departamento').not().isEmpty(),
                 check('login').custom(validaUsuario),validarCampos], agregarUsuarioPost);
router.delete('/:id',[validarJWT], borrarUsuario)
                 
router.post('/genera-usuarios',[validarJWT], [check('login', 'El login es requerido').not().isEmpty(),
check('nombre', 'El nombre es requerido').not().isEmpty(),
check('id_rol', 'El rol es requerido').not().isEmpty(),
check('password', 'La contraseña es requerida').not().isEmpty(),
check('password', 'El pasword debe de ser mas de 8 letras').isLength({min:8}),
check('password', ' Al menos una mayuscula, minuscula, numero y un caracter especial').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])([A-Za-z\d$@$!%*?&]|[^ ]){8,15}$/), validarCampos], crearUsuariosAleatorios);
module.exports = router;