const { Pool } = require('pg');
const client = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
client.connect();

const shapeMunicipio = async(req, res)=>{
    await client.query(`SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT 0) As l
    )) As properties
    FROM (select geom from ace.lim_municipio where cod_depto||cod_prov||cod_mpio='${req.params.codigo}') As lg ) As f )  As fc;`, (err, result) =>{
            if(err){
                return res.status(400).json({ 
                    ok: false,
                    message: err.message,
                })
            }
            return res.status(200).send(result.rows)
        })
}

const puntosFormulario = async(req,res)=>{
    const  text = `select b.dato::json from 
    (select '{"type": "FeatureCollection","features": ['||string_agg(dato,',')||']}' as dato from 
    (select '{"type": "Feature","geometry": {"type": "Point","coordinates":['||split_part(ee.respuesta,',',2)||','||split_part(ee.respuesta,',',1)||']},
	"properties":'||(select row_to_json(_) from (select ei.id_asignacion,ei.correlativo,
        ee1.respuesta as comunidad,ee2.respuesta as nombre,cc.tipo) as _)||'}' as dato
from (select id_upm from cat_upm where id_departamento=${req.params.departamento} 
and id_provincia::integer=${req.params.provincia} 
and id_municipio::integer=${req.params.municipio}
and estado!='ANULADO') cu
join ope_asignacion oa on oa.id_upm=cu.id_upm
join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.id_upm=cu.id_upm
join color cc on cc.estado=ei.estado
join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta=36947 and ee.visible=true
left join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta=36948 and ee1.visible=true
left join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta=37301 and ee2.visible=true) as a) as b`; 
    client.query(text, (err, result) =>{
        if(err){
            return res.status(400).json({ 
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows);
    })
}

const getUpm = async(req, res)=>{
    const text = `select * from cat_upm where id_departamento=${req.params.departamento}
    and id_provincia::integer=${req.params.provincia}
    and id_municipio::integer=${req.params.municipio}
    and case when -1=${req.params.distrito} then id_ciudad_comunidad='00000' else id_ciudad_comunidad::integer=${req.params.area} end
    and case when -1=${req.params.distrito} then id_distrito ilike '%%' else id_distrito::integer=${req.params.distrito} end
	and case when -1=${req.params.distrito} then tipo_area='DISPERSO' else tipo_area='AMANZANADO' end
    and estado!='ANULADO'
    order by id_upm`;
    client.query(text, (err, result) =>{
        if(err){
            return res.status(400).json({ 
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
}

const totalCriterios = async(req, res)=>{
    const query = `select id_upm,count(*) from enc_informante where id_upm=${req.params.id} and estado not in ('ANULADO','ELABORADO') group by id_upm`;
    client.query(query, (err, result) =>{
        if(err){
            return res.status(400).json({ 
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
}

const criterios = async(req, res)=>{
    const query = `select 'O36' as id,'C36-A_00_03: Error en registro de división de manzanas' as criterio,login,su.nombre,codigo_brigada,count(*) from enc_informante ei 
    join seg_usuario su on su.id_usuario=ei.id_usuario join ope_brigada ob on ob.id_brigada=su.id_brigada
    where id_upm=${req.params.id} and consistencia!='' and consistencia ilike '%O36%' group by id_upm,login,nombre,codigo_brigada
    union all
    select 'O37','C37-A_00_03: Error en registro de Unión de manzanas',login,su.nombre,codigo_brigada,count(*) from enc_informante ei 
    join seg_usuario su on su.id_usuario=ei.id_usuario join ope_brigada ob on ob.id_brigada=su.id_brigada
    where id_upm=${req.params.id} and consistencia!='' and consistencia ilike '%O37%' group by id_upm,login,nombre,codigo_brigada
    union all
    select 'O38','C38-A_00_03: Error en registro de Manzanas nuevas',login,su.nombre,codigo_brigada,count(*) from enc_informante ei 
    join seg_usuario su on su.id_usuario=ei.id_usuario join ope_brigada ob on ob.id_brigada=su.id_brigada
    where id_upm=${req.params.id} and consistencia!='' and consistencia ilike '%O38%' group by id_upm,login,nombre,codigo_brigada
    union all
    select 'O39','C39-A_00_03: Error en registro de Supresión de manzanas',login,su.nombre,codigo_brigada,count(*) from enc_informante ei 
    join seg_usuario su on su.id_usuario=ei.id_usuario join ope_brigada ob on ob.id_brigada=su.id_brigada
    where id_upm=${req.params.id} and consistencia!='' and consistencia ilike '%O39%' group by id_upm,login,nombre,codigo_brigada
    union all
    select 'O42','C42-F4 predio: Área con predio duplicado, reporte por actualizador, brigadas',login,su.nombre,codigo_brigada,count(*) from enc_informante ei 
    join seg_usuario su on su.id_usuario=ei.id_usuario join ope_brigada ob on ob.id_brigada=su.id_brigada
    where id_upm=${req.params.id} and consistencia!='' and consistencia ilike '%O42%' group by id_upm,login,nombre,codigo_brigada
    union all
    select 'O43','C43- F4 vivienda: Área con vivienda duplicada, reporte por actualizador, brigadas',login,su.nombre,codigo_brigada,count(*) from enc_informante ei 
    join seg_usuario su on su.id_usuario=ei.id_usuario join ope_brigada ob on ob.id_brigada=su.id_brigada
    where id_upm=${req.params.id} and consistencia!='' and consistencia ilike '%O43%' group by id_upm,login,nombre,codigo_brigada
    union all
    select 'O44','C44- Duplicado: Duplicidad de registros, reporte por actualizador, brigadas',login,su.nombre,codigo_brigada,count(*) from enc_informante ei 
    join seg_usuario su on su.id_usuario=ei.id_usuario join ope_brigada ob on ob.id_brigada=su.id_brigada
    where id_upm=${req.params.id} and consistencia!='' and consistencia ilike '%O44%' group by id_upm,login,nombre,codigo_brigada
    order by id,login`;
    client.query(query, (err, result) =>{
        if(err){
            return res.status(400).json({ 
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
}

const criteriosFinal = async(req, res)=>{
    const query = `select codigo,(select titulo from cat_criterio where id=1),(select observacion from cat_criterio where id=1) from cat_upm where id_upm=${req.params.id} and nombre ilike '%CR1%' union all
    select codigo,(select titulo from cat_criterio where id=2),(select observacion from cat_criterio where id=2) from cat_upm where id_upm=${req.params.id} and nombre ilike '%CR2%' union all
    select codigo,(select titulo from cat_criterio where id=3),(select observacion from cat_criterio where id=3) from cat_upm where id_upm=${req.params.id} and nombre ilike '%CR3%' union all
    select codigo,(select titulo from cat_criterio where id=4),(select observacion from cat_criterio where id=4) from cat_upm where id_upm=${req.params.id} and nombre ilike '%CR4%' union all
    select codigo,(select titulo from cat_criterio where id=5),(select observacion from cat_criterio where id=5) from cat_upm where id_upm=${req.params.id} and nombre ilike '%CR5%'`;
    client.query(query, (err, result) =>{
        if(err){
            return res.status(400).json({ 
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
}

const listaCriterios = async(req, res)=>{
    const query = `select vivienda_cnpv,ocupada_cnpv,desocupada_cnpv,colectiva_cnpv,personas_cnpv,
    vivienda_ac,ocupada_ac,desocupada_ac,colectiva_ac,establecimiento_ac,construccion_ac,personas_ac,justificacion,(select feccre::date from cat_upm where id_upm=b.id_upm) from 
    (select id_upm,sum(t_viv_ocu)+sum(t_viv_des)+sum(t_viv_col) as vivienda_cnpv,
    sum(t_viv_ocu) as ocupada_cnpv,
    sum(t_viv_des) as desocupada_cnpv,
    sum(t_viv_col) as colectiva_cnpv,
    sum(t_hombres)+sum(t_mujeres) as personas_cnpv
     from ace.bolivia_manzano where id_upm=${req.params.id} group by id_upm) as a
    join (select ${req.params.id} as id_upm, 
        count(uso) filter (where uso in ('1. VIVIENDA OCUPADA','2. VIVIENDA DE TEMPORADA','3. VIVIENDA DESOCUPADA')) as vivienda_ac,
        count(uso) filter (where uso='1. VIVIENDA OCUPADA') as ocupada_ac,
        count(uso) filter (where uso='3. VIVIENDA DESOCUPADA') as desocupada_ac,
        count(uso) filter (where uso='4. VIVIENDA COLECTIVA') as colectiva_ac,
        count(uso) filter (where uso='5. ESTABLECIMIENTO ECONÓMICO (PRIVADO Ó PÚBLICO)') as establecimiento_ac,
        count(uso) filter (where uso='6. EN CONSTRUCCION') as construccion_ac,
    sum(hombres)+sum(mujeres) as personas_ac
    from crosstab('select ei.id_asignacion||''|''||ei.correlativo,codigo_pregunta,ee.respuesta from enc_informante ei
    join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36886,36887,36877) and ee.visible=true
    join enc_pregunta ep on ep.id_pregunta=ee.id_pregunta
    where id_upm=${req.params.id} order by 1,2','select codigo_pregunta from enc_pregunta where id_pregunta in (36886,36887,36877) order by codigo_pregunta')
    as (id text, uso text, hombres int, mujeres int)) as b on a.id_upm=b.id_upm
    left join (select codigo::int,justificacion from enc_observacion_upm where codigo='${req.params.id}' order by feccre desc limit 1) as c on a.id_upm=c.codigo`;
    client.query(query, (err, result) =>{
        if(err){
            return res.status(400).json({ 
                ok: false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
}

const justificarCriterio = (req, res) => {
    const text = `INSERT INTO public.enc_observacion_upm(codigo, justificacion, usucre, feccre, estado) 
    VALUES ('${req.body.codigo}', '${req.body.observacion}', '${req.body.usucre}', now(), 'CRITERIO');`;
    client.query(text, async (err, result) => {
      if (err) {
        throw err;
      } else {
        let areas = result.rows;
        return res.status(200).json({
          ok: true,
          msg: 'Justificacion correcta',
          areas
        })
      }
    })
  }


module.exports = {
    shapeMunicipio,
    puntosFormulario,
    getUpm,
    totalCriterios,
    criterios,
    criteriosFinal,
    listaCriterios,
    justificarCriterio
 }
