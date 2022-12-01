const { Router } = require('express');
const {
    listaDep,
    listaProv,
    listaMun,
    lista_municipios,
    lista_departamento,
    listaAreas,listaAreas1,
    listaAreaCensal,
    listaZonaCensal,
    listaManzanaCensal,
    listaComunidadCensal,
    equipamientoCensal,
    listaDatos,
    listaPareto,
    listaCurva,
    listaDistrito,
    lista_provincia,
    lista_municipio,
    lista_ciudades,
    ciudadesAsignacion,
    ciudadesAsignacion1,
    lista_distrito,
    shape_distrito_seleccionado,
    shapeManzanasArea,
    shapePuntos,
    infoActualizadores,
    infoDistritos,
    InfoSupervisores,
    InfoAvaceBrigada,
    preguntas,asignaciones,
    asignacionesId,
    ingresar,
    guardar,
    eliminar,
    finalizar,
    listaPuntos,
    obtenerSectorUpm,
    listarAreas,
    tablaViviendas,
    tablaViviendasList,
    presentacionFechaId,
    tablaId,
    tablaFecha,
    tablaMunicipio,
    mapaMunicipio,municipioAvance,avanceAmanzanado,avanceUrbano,avanceDisperso,municipioTabla,detalleAvance,graficoInicial,departamentoAvance,listaMunicipioAvance
} = require('../controllers/dashboard.controller')
const { validarJWT } = require('../middlewares/validador-jwt');
const router = Router();
router.get('/listaDep/:idDep', [validarJWT], listaDep);
router.get('/listaProv/:idDep', [validarJWT], listaProv);
router.get('/listaMun/:idDep/:idProv', [validarJWT], listaMun);
router.get('/lista_municipios/:departamento', [validarJWT], lista_municipios);
router.get('/lista_departamento/:departamento/:provincia', [validarJWT], lista_departamento);
router.get('/listaAreas/:idDep/:idProv/:idMun', [validarJWT], listaAreas);
router.get('/listaAreas1/:idDep/:idProv/:idMun/:idCod', [validarJWT], listaAreas1);
router.get('/listaAreaCensal/:codigo', [validarJWT], listaAreaCensal);
router.get('/listaZonaCensal/:codigo', [validarJWT], listaZonaCensal);
router.get('/listaManzanaCensal/:depto/:prov/:mpio/:ciu/:area', [validarJWT], listaManzanaCensal);
router.get('/listaComunidadCensal/:codigo', [validarJWT], listaComunidadCensal);
router.get('/equipamientoCensal/:codigo', [validarJWT], equipamientoCensal);
router.get('/listaDistrito/:idDep/:idProv/:idMun', [validarJWT], listaDistrito);
router.get('/listaDatos/:idDep/:idProv/:idMun', [validarJWT], listaDatos);
router.get('/listaPareto/:idDep/:idProv/:idMun', [validarJWT], listaPareto);
router.get('/listaCurva/:idDep/:idProv/:idMun', [validarJWT], listaCurva);
router.get('/lista_provincia/:codigo', [validarJWT], lista_provincia);
router.get('/lista_municipio', [validarJWT], lista_municipio);
router.get('/lista_ciudades/:departamento/:area', [validarJWT], lista_ciudades);
router.get('/ciudadesAsignacion/:departamento/:area', [validarJWT], ciudadesAsignacion);
router.get('/ciudadesAsignacion1/:departamento/:area', [validarJWT], ciudadesAsignacion1);
router.get('/lista_distrito/:id_depto/:id_prov/:id_mun/:id_ci_com', [validarJWT], lista_distrito);
router.get('/shape_distrito_seleccionado/:id_depto/:id_prov/:id_mun/:id_ci_com/:id_distrito', [validarJWT], shape_distrito_seleccionado);
router.get('/shapeManzanasArea/:id/:sw/:tipo',[validarJWT], shapeManzanasArea);
router.get('/shapePuntos/:id/:sw/:tipo', [validarJWT], shapePuntos);
router.get('/infoActualizadores/:codigo/:sw/:tipo', [validarJWT], infoActualizadores);
router.get('/infoDistritos/:id_depto/:id_prov/:id_mun/:codigo/:tipo_area/:id_distrito', [validarJWT], infoDistritos);
router.get('/InfoSupervisores/:codigo/:sw/:tipo', [validarJWT], InfoSupervisores);
router.get('/InfoAvaceBrigada/:codigo/:sw/:tipo', [validarJWT], InfoAvaceBrigada);
router.get('/preguntas', [validarJWT], preguntas);
router.get('/asignaciones/:asignacion/:correlativo', [validarJWT], asignaciones);
router.get('/asignacionesId/:asignacion/:correlativo', [validarJWT], asignacionesId);
router.get('/ingresar/:login/:password', [validarJWT], ingresar);
router.post('/guardar/:sw/:asignacion/:correlativo/:usuario', [validarJWT], guardar);
router.put('/eliminar', [validarJWT], eliminar);
router.put('/finalizar', [validarJWT], finalizar);
router.get('/listaPuntos/:id', [validarJWT], listaPuntos);
router.get('/obtenerSectorUpm/:id', [validarJWT], obtenerSectorUpm);
router.get('/listarAreas/:id', [validarJWT], listarAreas);
router.get('/tablaViviendas/:id', [validarJWT], tablaViviendas);
router.get('/tablaViviendasList/:id', [validarJWT], tablaViviendasList);
router.get('/presentacionFechaId/:idDep/:idProv/:idMun', [validarJWT], presentacionFechaId);
router.get('/tablaId/:id', tablaId);
router.get('/tablaFecha', tablaFecha);
router.get('/tablaMunicipio', tablaMunicipio);
router.get('/mapaMunicipio', [validarJWT], mapaMunicipio);
router.get('/municipioAvance/:idDep', [validarJWT], municipioAvance);
router.get('/avanceAmanzanado/:idDep', [validarJWT], avanceAmanzanado);
router.get('/avanceUrbano/:idDep', [validarJWT], avanceUrbano);
router.get('/avanceDisperso/:idDep', [validarJWT], avanceDisperso);
router.get('/municipioTabla/:idDep', [validarJWT], municipioTabla);
router.get('/detalleAvance/:idDep', [validarJWT], detalleAvance);
router.get('/graficoInicial/:idDep', [validarJWT], graficoInicial);
router.get('/departamentoAvance/:idDep', [validarJWT], departamentoAvance);
router.get('/listaMunicipioAvance/:idDep', [validarJWT], listaMunicipioAvance);
module.exports = router;