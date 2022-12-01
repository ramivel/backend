const express = require('express')
const router = express.Router();
const app = express();
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const {
    shapeMunicipio,
    puntosFormulario,
    totalCriterios,
    criterios,
    criteriosFinal,
    listaCriterios,
    justificarCriterio,
    getUpm 
} = require('../controllers/cobertura-cartografica.controller')
const { validarJWT } = require('../middlewares/validador-jwt');   
router.get('/shapeMunicipio/:codigo',[validarJWT], shapeMunicipio);
router.get('/puntosFormulario/:departamento/:provincia/:municipio', [validarJWT], puntosFormulario);
router.get('/getUpm/:departamento/:provincia/:municipio/:area/:distrito',[validarJWT], getUpm);
router.get('/totalCriterios/:id',[validarJWT], totalCriterios);
router.get('/criterios/:id',[validarJWT], criterios);
router.get('/criteriosFinal/:id',[validarJWT], criteriosFinal);
router.get('/listaCriterios/:id',[validarJWT], listaCriterios);
router.post('/justificarCriterio',[validarJWT], justificarCriterio);
module.exports = router;