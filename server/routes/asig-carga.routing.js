  
const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { 
    brigadasGet,
    brigadasConsolidadas,
    usuariosActualizador,
    modificarUsuarioBrigadaPut,
    agregarBrigadaUsurioPut,
    obtenerBrigadasCreadas,
    asignarTrabajoPost,
    obtenerManzanos,
    obtenerDistritos,
    obtenerAreasAsignadasAmanzanado,
    obtenerSector,
    brigadasPost,
    listarBrigadasUpm,
    quitarBrigada,adicionarBrigada,
    areasAsignadas,
    usuarioBrigadaId,
    usuarioSinBrigada,
    eliminarBrigadaId,
    adicionarUsuario,
    cambiarFecha,
    updatePlan,
    brigadaUltimoGet 
} = require('../controllers/asig-carga.controller');
const { validaUsuario } = require('../middlewares/valida-usuario.middlewares');
const { validarJWT } = require('../middlewares/validador-jwt');   
const router = Router();
router.get('/brigada-ultima/:id_depto/:des_siglas',[validarJWT], brigadaUltimoGet);
router.post('/brigada-guardar',[validarJWT], brigadasPost);
router.get('/brigada/:departamento',[validarJWT], brigadasGet);
router.get('/brigadasConsolidadas/:departamento',[validarJWT], brigadasConsolidadas);
router.get('/areasAsignadas/:id_brigada/:departamento/:codigo',[validarJWT],areasAsignadas);
router.get('/usuariosActualizador/:departamento',[validarJWT], usuariosActualizador);
router.get('/obtenerBrigadasCreadas/:departamento',[validarJWT], obtenerBrigadasCreadas);
router.put('/usuario-actualizar/:id',[validarJWT], modificarUsuarioBrigadaPut);
router.put('/brigada-usuario/:id_brigada',[validarJWT],agregarBrigadaUsurioPut);
router.post('/asignartrabajo',[validarJWT],asignarTrabajoPost);
router.get('/obtenerSector/:id_depto/:id_prov/:id_mun/:ciu_com/:id_distrito',[validarJWT],obtenerSector);
router.get('/obtenerManzanos/:id_depto/:id_prov/:id_mun/:ciu_com/:id_distrito',[validarJWT],obtenerManzanos);
router.get('/obtenerAreasAsignadasAmanzanado/:id',[validarJWT], obtenerAreasAsignadasAmanzanado);
router.get('/obtenerDistritos/:id_depto/:id_prov/:id_mun/:cod',[validarJWT],obtenerDistritos);
router.put('/quitarBrigada',[validarJWT],quitarBrigada);
router.post('/adicionarBrigada',[validarJWT],adicionarBrigada);
router.get('/listarBrigadasUpm/:id',[validarJWT],listarBrigadasUpm);
router.get('/usuarioBrigadaId/:id',[validarJWT],usuarioBrigadaId);
router.get('/usuarioSinBrigada/:id',[validarJWT],usuarioSinBrigada);
router.get('/eliminarBrigadaId/:id',[validarJWT],eliminarBrigadaId);
router.get('/adicionarUsuario/:usuario/:brigada/:rol',[validarJWT],adicionarUsuario);
router.put('/cambiarFecha',[validarJWT],cambiarFecha);
router.put('/updatePlan',[validarJWT],updatePlan);
module.exports = router;