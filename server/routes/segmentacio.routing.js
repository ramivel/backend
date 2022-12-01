const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { 
    finalizarArea,
    finalizarJustificacion,
    finalizarFormulario,
    boletasDatos,
    obtenerBoletasFormulario,
    obtenerCatalogoBrigada,
    obtenerCatalagoComunidad,
    obtenerConteoAreas,
    obtenerDatosGrafico,
    realizarConsistencia,
    obtenerObservaciones,
    obtenerObservacion,
    infoActualizadoresBrigada,
    lista_brigada,
    lista_brigada_supervicion,
    obtenerPuntosBrigadas,
    obtenerPuntosFormulario,
    obtenerPuntosEdificacion,
    lista_shapeManzanas,
    lista_Equipamientos,
    habilitarManzano,
    updateManzano,
    shapeequip_historicoa,
    listarAreas,
    reportes,
    columnas,
    lista_shapeAreas,
    lista_shapeConlindantes,
    lista_rios,
    lista_caminos,
    lista_cerros,
    updateArea,
    observarArea,
    justificarArea,
    observarReporte,
    observarFormulario,
    observarJustificacion,  
    obtenerRespuestasFormulario,
    updateLado,
    desaprobar,formularioVerificacion
} = require('../controllers/segmentacion.controller');
const { validaUsuario } = require('../middlewares/valida-usuario.middlewares');
        
const { validarJWT } = require('../middlewares/validador-jwt');

const router = Router();


router.get('/realizarConsistencia/:upm/:tipo',[validarJWT],realizarConsistencia);
router.put('/finalizarArea',[validarJWT], finalizarArea);
router.put('/desaprobar',[validarJWT], desaprobar);
router.put('/finalizarJustificacion',[validarJWT], finalizarJustificacion);
router.put('/finalizarFormulario',[validarJWT], finalizarFormulario);
router.put('/updateManzano',[validarJWT], updateManzano);
router.get('/obtenerDatosGrafico/:id/:tipo/:id_distrito/:id_depto/:id_provincia/:id_municipio/:id_brigada',[validarJWT],obtenerDatosGrafico);
router.get('/boletasDatos/:id/:sw/:tipo',[validarJWT],boletasDatos);
router.get('/obtenerBoletasFormulario/:departamento/:provincia/:municipio',[validarJWT],obtenerBoletasFormulario);
router.get('/obtenerCatalogoBrigada/:departamento/:provincia/:municipio',[validarJWT],obtenerCatalogoBrigada);
router.get('/obtenerCatalagoComunidad/:departamento/:provincia/:municipio/:codigo',[validarJWT],obtenerCatalagoComunidad);
router.get('/obtenerRespuestasFormulario/:asignacion/:correlativo',[validarJWT],obtenerRespuestasFormulario);
router.get('/infoActualizadoresBrigada/:id_depto/:id_prov/:id_mun/:tipo_area/:id_distrito/:id_brigada',[validarJWT], infoActualizadoresBrigada);
router.get('/lista_brigada/:id_depto/:id_prov/:id_mun/:tipo_area/:id_distrito/:trabajo',[validarJWT], lista_brigada);
router.get('/lista_brigada_supervicion/:id_depto/:id_prov/:id_mun/:codigo/:tipo_area/:id_distrito',[validarJWT], lista_brigada_supervicion);
router.get('/reportes/:tipo_area/:trabajo/:brigada/:sw',[validarJWT], reportes);
router.get('/columnas/:brigada',[validarJWT], columnas);
router.get('/obtenerPuntosBrigadas/:id_depto/:id_prov/:id_mun/:codigo/:tipo_area/:id_distrito/:id_brigada',[validarJWT], obtenerPuntosBrigadas);
router.get('/obtenerPuntosFormulario/:id_depto/:id_prov/:id_mun/:tipo_area/:id_distrito/:id_brigada',[validarJWT], obtenerPuntosFormulario);
router.get('/obtenerPuntosEdificacion/:id_depto/:id_prov/:id_mun',[validarJWT], obtenerPuntosEdificacion);
router.get('/lista_shapeManzanas/:id_depto/:id_prov/:id_mun/:id_ciudad/:id_distrito/:id_brigada',[validarJWT], lista_shapeManzanas);
router.get('/lista_shapeAreas/:id_depto/:id_prov/:id_mun/:id_ciudad/:id_distrito/:id_brigada',[validarJWT], lista_shapeAreas);
router.get('/lista_shapeConlindantes/:id_depto/:id_prov/:id_mun/:brigada',[validarJWT], lista_shapeConlindantes);
router.get('/lista_rios/:depto',[validarJWT], lista_rios);
router.get('/lista_caminos/:depto',[validarJWT], lista_caminos);
router.get('/lista_cerros/:depto',[validarJWT], lista_cerros);
router.get('/lista_Equipamientos/:id_depto/:id_prov/:id_mun/:id_area',[validarJWT], lista_Equipamientos);
router.get('/shapeequip_historicoa/:id_depto/:id_prov/:id_mun/:id_ciudad/:id_distrito/:sw',[validarJWT], shapeequip_historicoa);
router.get('/habilitarManzano/:id_depto/:id_prov/:id_mun/:codigo/:tipo_area/:id_distrito/:id_brigada',[validarJWT], habilitarManzano);
router.get('/listarAreas/:id_depto/:id_prov/:id_mun/:codigo/:tipo_area/:id_distrito/:brigada',[validarJWT], listarAreas);
router.get('/obtenerConteoAreas/:id_depto/:id_prov/:id_mun/:codigo/:tipo_area/:id_distrito/:brigada',[validarJWT], obtenerConteoAreas);
router.get('/obtenerObservaciones/:id_depto/:id_prov/:id_mun/:codigo/:tipo_area/:id_distrito/:brigada/:sw',[validarJWT], obtenerObservaciones);
router.get('/obtenerObservacion/:asignacion',[validarJWT], obtenerObservacion);
router.put('/updateArea',[validarJWT], updateArea);
router.post('/observarArea',[validarJWT], observarArea);
router.post('/justificarArea',[validarJWT], justificarArea);
router.post('/observarReporte',[validarJWT], observarReporte);
router.put('/observarFormulario',[validarJWT], observarFormulario);
router.post('/observarJustificacion',[validarJWT], observarJustificacion);
router.put('/updateLado/:asignacion/:correlativo',[validarJWT], updateLado);
router.get('/formularioVerificacion/:codigo',[validarJWT], formularioVerificacion);
module.exports = router;