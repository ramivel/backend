const { Router } = require('express');
const {
    getlista,
    manzanas
} = require('../controllers/muestreo.controller')
const { validarJWT } = require('../middlewares/validador-jwt');
const router = Router();
router.get('/manzanas/:depto/:prov/:mun/:ciucom/:area/:distrito', [validarJWT], manzanas);
router.get('/getlista/:depto/:prov/:mun/:ciucom/:area/:distrito', [validarJWT], getlista);
module.exports = router;