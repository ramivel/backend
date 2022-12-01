const { Pool } = require('pg');
const client = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
client.connect();

const manzanas = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT sector,id_manz,orden_manz) As l
    )) As properties
    FROM (select sector,id_manz,orden_manz,geom from ace.bolivia_manzano 
    where cod_depto::int=${req.params.depto}
    and cod_prov::int=${req.params.prov} 
    and cod_mpio::int=${req.params.mun}
    and cod_cd_com='${req.params.ciucom}' 
    and distrito='${req.params.distrito}') As lg ) As f )  As fc`
    client.query(text, async (err, result) => {
        if (err) { throw err; } else { return res.status(200).json(result.rows); }
    })
}

const getlista = async (req, res) => {
    const text = `select distinct codigo_brigada,cu.codigo,cu.sector,cu.estado,cu.fecmod,e1.codigo_respuesta,e1.respuesta,e2.respuesta from 
    (select distinct id_upm from ace.bolivia_manzano 
        where cod_depto::int=${req.params.depto}
        and cod_prov::int=${req.params.prov} 
        and cod_mpio::int=${req.params.mun}
        and cod_cd_com='${req.params.ciucom}' 
        and distrito='${req.params.distrito}') as a
    join cat_upm cu on cu.id_upm=a.id_upm
    join enc_informante ei on ei.id_upm=a.id_upm
    join seg_usuario su on su.id_usuario=ei.id_usuario
    join ope_brigada ob on ob.id_brigada=su.id_brigada
    join enc_encuesta e1 on e1.id_asignacion=ei.id_asignacion and e1.correlativo=ei.correlativo and e1.id_pregunta=37207
    join enc_encuesta e2 on e2.id_asignacion=ei.id_asignacion and e2.correlativo=ei.correlativo and e2.id_pregunta=37208
    where ei.estado!='ANULADO' 
    order by 2,3,4`
    client.query(text, async (err, result) => {
        if (err) { throw err; } else { return res.status(200).json(result.rows); }
    })
}

module.exports = {
    manzanas,
    getlista,
}