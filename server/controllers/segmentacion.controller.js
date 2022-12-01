const { Pool } = require('pg');
const client = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
client.connect();


const finalizarArea = (req, res) => {
  let text;
  text = `select count(*) from enc_informante where id_upm=${req.body.codigo};` 
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      if(result.rows[0].count!=0){
        text = `select count(*) from enc_informante where id_upm=${req.body.codigo} and correlativo>0 and estado!='ANULADO' and estado not in ('CONCLUIDO','FINALIZADO');` 
        client.query(text, async (err, result) => {
          if (err) {
            throw err;
          } else {
            if(result.rows[0].count==0){
              text = `update cat_upm set estado='CONCLUIDO',usumod='${req.body.usucre}',fecmod=now() where id_upm=${req.body.codigo};
                      update ope_asignacion set exportar=0 where id_upm=${req.body.codigo};` 
              client.query(text, async (err, result) => {
                if (err) {
                  throw err;
                } else {
                  return res.status(200).json({
                    ok: true,
                    msg: 'Boleta finalizada'
                  })
                }
              })
            } else {
              return res.status(200).json({
                ok: false,
                msg: 'No se puede concluir el area de trabajo porque tiene predios inconclusos'
              });
            }
          }
        });
      } else {
        return res.status(200).json({
          ok: false,
          msg: 'No se puede concluir el area de trabajo porque no tinen ningun predio'
        });
      }  
    }  
  });  
}

const desaprobar = (req, res) => {
  const text = `update cat_upm set estado='ELABORADO',usumod='${req.body.usucre}',fecmod=now() where id_upm=${req.body.codigo};
                update ope_asignacion set exportar=1 where id_upm=${req.body.codigo};`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      let areas = result.rows;
      return res.status(200).json({
        ok: true,
        msg: 'Boleta finalizada',
        areas
      })
    }
  })
}

const finalizarJustificacion = (req, res) => {
  const query = { text: `select * from fn_finalizar_justificacion(${req.body.asignacion},${req.body.correlativo},'${req.body.usucre}')` }
  client.query(query, async (err, result) => {
    if (err) {
      throw err;
    } else {
      let areas = result.rows;
      return res.status(200).json({
        ok: true,
        msg: 'Boleta finalizada',
        areas
      })
    }
  })
}

const observarReporte = (req, res) => {
  const text = `INSERT INTO public.enc_observacion_area(id_asignacion, id_upm, observacion, usucre, estado, incidencia)
      select oa.id_asignacion,oa.id_upm,'${req.body.observacion}','${req.body.usucre}','OBSERVACION',${req.body.incidencia} from ope_asignacion oa 
      join seg_usuario su on su.id_usuario=oa.id_usuario where oa.estado='ELABORADO' and id_upm=${req.body.codigo} and id_brigada=${req.body.brigada};`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      let areas = result.rows;
      return res.status(200).json({
        ok: true,
        msg: 'Boleta finalizada',
        areas
      })
    }
  })
}

const observarFormulario = (req, res) => {
  const text = `INSERT INTO public.enc_observacion_area(id_asignacion,correlativo, id_upm, observacion, usucre, estado)
  select oa.id_asignacion,${req.body.correlativo},oa.id_upm,'${req.body.observacion}','${req.body.usucre}','OBSERVACION' from ope_asignacion oa 
  join seg_usuario su on su.id_usuario=oa.id_usuario where oa.estado='ELABORADO' and id_asignacion=${req.body.asignacion}`
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      let areas = result.rows;
      return res.status(200).json({
        ok: true,
        msg: 'Boleta finalizada',
        areas
      })
    }
  })
}


const observarArea = (req, res) => {
  const text = `INSERT INTO public.enc_observacion_area(id_asignacion, id_upm, observacion, usucre)
      select oa.id_asignacion,oa.id_upm,'${req.body.observacion}','${req.body.usucre}' from ope_asignacion oa 
      join seg_usuario su on su.id_usuario=oa.id_usuario and su.id_rol=8
      join ope_brigada ob on ob.id_brigada=su.id_brigada  and codigo_brigada not ilike '%ACEWEB%'
      where oa.estado='ELABORADO' and id_upm=${req.body.codigo};
      update cat_upm set estado='OBSERVADO' where id_upm=${req.body.codigo};`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      let areas = result.rows;
      return res.status(200).json({
        ok: true,
        msg: 'Boleta finalizada',
        areas
      })
    }
  })
}

const justificarArea = (req, res) => {
  const text = `INSERT INTO public.enc_observacion_upm(codigo, justificacion, usucre, feccre) 
    VALUES ('${req.body.codigo}', '${req.body.observacion}', '${req.body.usucre}', now());`;
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

const observarJustificacion = (req, res) => {
  const query = { text: `INSERT INTO public.enc_observacion_area(id_asignacion, id_upm, observacion, usucre)
      select oa.id_asignacion,oa.id_upm,'${req.body.observacion}','${req.body.usucre}' from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
      where oa.estado='ELABORADO' and id_upm=${req.body.codigo} and id_rol=8;
      update enc_observacion_area set estado='CONCLUIDO' where id_asignacion=${req.body.asignacion} and correlativo=${req.body.correlativo};` }
  client.query(query, async (err, result) => {
    if (err) {
      throw err;
    } else {
      let areas = result.rows;
      return res.status(200).json({
        ok: true,
        msg: 'Boleta finalizada',
        areas
      })
    }
  })
}

const finalizarFormulario = (req, res) => {
  const text = `UPDATE enc_informante SET estado = '${req.body.estado}' where id_asignacion = ${req.body.asignacion} AND correlativo = ${req.body.correlativo}`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).json({
        ok: true
      })
    }
  })
}

const boletasDatos = (req, res) => {
  let text;
  if (req.params.tipo=='AMANZANADO'){
    text = `select *,split_part(replace(((fecha_fin - fecha_inicio))::text, 'day'::text, 'dia'::text), ':'::text, 1) || ' hrs. '::text
    || split_part(replace(((fecha_fin - fecha_inicio))::text, 'day'::text, 'dia'::text), ':'::text, 2) || ' min. '::text 
    || split_part(replace(((fecha_fin - fecha_inicio))::text, 'day'::text, 'dia'::text), ':'::text, 3) || ' seg.'::text AS tiempo from 
    (select split_part(id_,'|',1)||'|'||split_part(id_,'|',2) as id,
    split_part(id_,'|',3) as area_trabajo,
    case when split_part(id_,'|',4)='ELABORADO' then 'ASIGNADO' else split_part(id_,'|',4) end estado_area,
    case when split_part(id_,'|',5)='ELABORADO' then 'PENDIENTE'
          when split_part(id_,'|',5)='PRECONCLUIDO' then 'CONCLUIDO'
          else 'CERRADO' end as estado,
    split_part(id_,'|',6) as login,
    split_part(id_,'|',7) as usuario,
    split_part(id_,'|',8) as brigada,
    split_part(id_,'|',9) as id_distrito,
    split_part(id_,'|',10) as sector,
    split_part(id_,'|',11) as zona,
    split_part(id_,'|',12) as tipo_area,
    split_part(id_,'|',13) as fecha,
    case when split_part(id_,'|',2)::int<0 then 'F4A' else 'F4' end as tipo_formulario
    ,coordenada ,coalesce(ciudad,' ','')||', '||coalesce(comunidad,' ','') as ciudad, manzana, suprimida, union_manzana, lado_manzana, via, orden_predio, tipo_vivienda, edificio, 
    case when formulario ilike '%2%' then 'NO' else 'SI' end as formulario, 
    planta, edificacion, uso_vivienda, aforo, actividad, establecimiento, hombres, mujeres, jefe_hogar, cuidador, resultado_registro, observacion, 
    nuevo_registro, mismo_lado, misma_manzana
    ,(SELECT min(enc_encuesta.feccre) FROM enc_encuesta WHERE id_asignacion=split_part(id_,'|',1)::int and correlativo=split_part(id_,'|',2)::int) as fecha_inicio
	,(SELECT max(enc_encuesta.feccre) FROM enc_encuesta WHERE id_asignacion=split_part(id_,'|',1)::int and correlativo=split_part(id_,'|',2)::int) as fecha_fin from crosstab(
    'SELECT ei.id_asignacion||''|''||ei.correlativo||''|''||cu.codigo||''|''||cu.estado||''|''||ei.estado||''|''||su.login||''|''||su.nombre||''|''||codigo_brigada
    ||''|''||cu.id_distrito||''|''||cu.sector||''|''||cu.zona||''|''||cu.tipo_area||''|''||ei.feccre::date,cd.codigo_pregunta,ee.respuesta 
    FROM (select * from cat_upm where estado!=''ANULADO'' and case when 0=${req.params.sw} then id_departamento::text||id_provincia||id_municipio||id_distrito||id_ciudad_comunidad=''${req.params.id}''
    else codigo=''${req.params.id}'' end 
    and tipo_area=''AMANZANADO'') cu
    JOIN (select * from ope_asignacion where id_upm in (select id_upm from cat_upm 
      where estado!=''ANULADO'' and case when 0=${req.params.sw} then id_departamento::text||id_provincia||id_municipio||id_distrito||id_ciudad_comunidad=''${req.params.id}''
    else codigo=''${req.params.id}'' end 
    and tipo_area=''AMANZANADO'')) as oa on oa.id_upm=cu.id_upm 
    JOIN (select * from enc_informante where estado!=''ANULADO'' and id_upm in (select id_upm from cat_upm 
      where estado!=''ANULADO'' and case when 0=${req.params.sw} then id_departamento::text||id_provincia||id_municipio||id_distrito||id_ciudad_comunidad=''${req.params.id}''
    else codigo=''${req.params.id}'' end 
    and tipo_area=''AMANZANADO'')) as ei on ei.id_asignacion=oa.id_asignacion and ei.id_upm=cu.id_upm
    JOIN seg_usuario su on su.id_usuario=oa.id_usuario
    JOIN ope_brigada ob on ob.id_brigada=su.id_brigada
    join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.visible=true and ee.id_pregunta in 
    (36870,36872,36873,36875,36876,36877,36878,36879,36880,36886,36887,36892,36895,37207,37208,37209,37227,37210,37216,37240,37241,37243,37249,37251,37281,37282,37283)
    join enc_pregunta cd on cd.id_pregunta=ee.id_pregunta order by 1,2',' 
    select codigo_pregunta from enc_pregunta where 
    id_pregunta in (36870,36872,36873,36875,36876,36877,36878,36879,36880,36886,36887,36892,36895,37207,37208,37209,37227,37210,37216,37240,37241,37243,37249,37251,37281,37282,37283)
    and codigo_pregunta ilike ''f4%''
    order by codigo_pregunta') as (id_ text, coordenada TEXT, ciudad TEXT ,comunidad TEXT,manzana TEXT ,suprimida TEXT ,union_manzana TEXT ,lado_manzana TEXT ,via TEXT ,orden_predio TEXT ,tipo_vivienda TEXT ,
    edificio TEXT ,formulario TEXT ,planta TEXT ,edificacion TEXT ,uso_vivienda TEXT ,aforo TEXT ,actividad TEXT ,
    establecimiento TEXT ,hombres TEXT ,mujeres TEXT ,jefe_hogar TEXT ,cuidador TEXT ,resultado_registro TEXT ,
    observacion TEXT ,nuevo_registro TEXT ,mismo_lado TEXT ,misma_manzana TEXT)) as a`;
  } else {
    text = `select *,split_part(replace(((fecha_fin - fecha_inicio))::text, 'day'::text, 'dia'::text), ':'::text, 1) || ' hrs. '::text
    || split_part(replace(((fecha_fin - fecha_inicio))::text, 'day'::text, 'dia'::text), ':'::text, 2) || ' min. '::text 
    || split_part(replace(((fecha_fin - fecha_inicio))::text, 'day'::text, 'dia'::text), ':'::text, 3) || ' seg.'::text AS tiempo from 
    (select split_part(id_,'|',1)||'|'||split_part(id_,'|',2) as id,
    split_part(id_,'|',3) as area_trabajo,
    case when split_part(id_,'|',4)='ELABORADO' then 'ASIGNADO' else split_part(id_,'|',4) end estado_area,
    case when split_part(id_,'|',5)='ELABORADO' then 'PENDIENTE'
          when split_part(id_,'|',5)='PRECONCLUIDO' then 'CONCLUIDO'
          else 'CERRADO' end as estado,
    split_part(id_,'|',6) as login,
    split_part(id_,'|',7) as usuario,
    split_part(id_,'|',8) as brigada,
    split_part(id_,'|',9) as id_distrito,
    split_part(id_,'|',10) as sector,
    split_part(id_,'|',11) as zona,
    split_part(id_,'|',12) as tipo_area,
    split_part(id_,'|',13) as fecha,
    'F3' as tipo_formulario
    ,coordenada ,coalesce(comunidad,' ','')||', '||coalesce(nombre,' ','') as ciudad, '' as manzana, '' as suprimida, '' as union_manzana, '' as lado_manzana, via, orden_predio, tipo_vivienda, '' as edificio, 
    '' as formulario, 
    planta, edificacion, uso_vivienda, aforo, actividad, establecimiento, hombres, mujeres, jefe_hogar, cuidador, resultado_registro, observacion, 
    nuevo_registro, '' as mismo_lado, '' as misma_manzana
    ,(SELECT min(enc_encuesta.feccre) FROM enc_encuesta WHERE id_asignacion=split_part(id_,'|',1)::int and correlativo=split_part(id_,'|',2)::int) as fecha_inicio
	,(SELECT max(enc_encuesta.feccre) FROM enc_encuesta WHERE id_asignacion=split_part(id_,'|',1)::int and correlativo=split_part(id_,'|',2)::int) as fecha_fin from crosstab(
    'SELECT ei.id_asignacion||''|''||ei.correlativo||''|''||cu.codigo||''|''||cu.estado||''|''||ei.estado||''|''||su.login||''|''||su.nombre||''|''||codigo_brigada
    ||''|''||cu.id_distrito||''|''||cu.sector||''|''||cu.zona||''|''||cu.tipo_area||''|''||ei.feccre::date,cd.codigo_pregunta,ee.respuesta
    FROM (select * from cat_upm where estado!=''ANULADO'' 
    and case when 0=${req.params.sw} then id_departamento::text||id_provincia||id_municipio||id_distrito||id_ciudad_comunidad=''${req.params.id}''
    else codigo=''${req.params.id}'' end
    and tipo_area=''DISPERSO'') cu
    JOIN (select * from ope_asignacion where id_upm in (select id_upm from cat_upm
      where estado!=''ANULADO'' and case when 0=${req.params.sw} then id_departamento::text||id_provincia||id_municipio||id_distrito||id_ciudad_comunidad=''${req.params.id}''
    else codigo=''${req.params.id}'' end
    and tipo_area=''DISPERSO'')) as oa on oa.id_upm=cu.id_upm
    JOIN (select * from enc_informante where estado!=''ANULADO'' and id_upm in (select id_upm from cat_upm
      where estado!=''ANULADO'' and case when 0=${req.params.sw} then id_departamento::text||id_provincia||id_municipio||id_distrito||id_ciudad_comunidad=''${req.params.id}''
    else codigo=''${req.params.id}'' end
    and tipo_area=''DISPERSO'')) as ei on ei.id_asignacion=oa.id_asignacion and ei.id_upm=cu.id_upm
    JOIN seg_usuario su on su.id_usuario=oa.id_usuario
    JOIN ope_brigada ob on ob.id_brigada=su.id_brigada
    join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.visible=true and ee.id_pregunta in
    (36846,36847,36848,36849,36850,36851,36854,36856,36860,36861,36862,36866,36869,37214,37215,37232,37233,37250,37286)
    join enc_pregunta cd on cd.id_pregunta=ee.id_pregunta order by 1,2','
    select codigo_pregunta from enc_pregunta where id_pregunta in (36846,36847,36848,36849,36850,36851,36854,36856,36860,36861,36862,36866,36869,37214,37215,37232,37233,37250,37286)
    and codigo_pregunta ilike ''f3%''
    order by codigo_pregunta') as (id_ text, coordenada TEXT, comunidad TEXT ,nombre TEXT ,via TEXT ,orden_predio TEXT ,
								   tipo_vivienda TEXT ,planta TEXT ,edificacion TEXT ,uso_vivienda TEXT ,
    aforo TEXT ,actividad TEXT ,establecimiento TEXT ,hombres TEXT ,mujeres TEXT ,jefe_hogar TEXT ,cuidador TEXT ,
    resultado_registro TEXT ,observacion TEXT ,nuevo_registro TEXT )) as a`;
  }  
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      let BoletasPuntos = result.rows;
      return res.status(200).json({
        ok: true,
        msg: 'Boletas puntos con segmentos observados',
        BoletasPuntos
      })
    }
  })
}

const obtenerCatalogoBrigada = (req, res) => {
  const text = `select distinct codigo_brigada from enc_comunidad ec
  join seg_usuario su on su.id_usuario=ec.id_usuario
  join ope_brigada ob on ob.id_brigada=su.id_brigada
  where ec.estado!='ANULADO' and ec.codigo ilike '${req.params.departamento+req.params.provincia+req.params.municipio}%' order by codigo_brigada`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).send(result.rows);
    }
  })
}

const obtenerCatalagoComunidad = (req, res) => {
  const text = `select ec.nombre,ec.estado,ec.verificado,ec.ejecutado,ec.observacion from enc_comunidad ec
  join seg_usuario su on su.id_usuario=ec.id_usuario
  join ope_brigada ob on ob.id_brigada=su.id_brigada
  where ec.estado!='ANULADO' and ec.codigo ilike '${req.params.departamento+req.params.provincia+req.params.municipio}%' 
  and ob.codigo_brigada='${req.params.codigo}' order by nombre`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).send(result.rows);
    }
  })
}

const formularioVerificacion = (req, res) => {
  const text = `select f2,
  case when f1 is null then '' else f1 end f1,
  case when tenencia is null then '' else tenencia end tenencia,
  case when personalidad is null then '' else personalidad end personalidad,
  case when f3 is null then '' else f3 end f3,
  case when c.registros is null then 0 else c.registros end regf3,
  case when f4 is null then '' else f4 end f4,
  case when d.registros is null then 0 else d.registros end regf4,
  codigo_brigada,
  case when verificado=1 then 'SI' else 'NO' end verificado,
  case when ejecutado=1 then 'SI' else 'NO' end ejecutado from 
  (select metaphone(f2,10),f2,verificado,ejecutado,observacion,codigo_brigada from 
  (select row_number()over(partition by f2 order by f2,verificado desc,ejecutado desc,observacion desc,codigo_brigada),* from 
  (select trim(replace(ec.nombre,'(F1) ','')) as f2,verificado,ejecutado,observacion,codigo_brigada from enc_comunidad ec
   join seg_usuario su on su.id_usuario=ec.usucre::int
   join ope_brigada ob on ob.id_brigada=su.id_brigada where codigo ilike '${req.params.codigo}%'
  order by trim(replace(ec.nombre,'(F1) ',''))) as a
  order by f2,verificado desc,ejecutado desc,observacion desc,codigo_brigada) as a
  where row_number=1) as a
  left join (select metaphone(md.ciudad,10),md.ciudad as f1,tenencia,personalidad from municipio.registro mr 
  join municipio.detalle md on mr.id_registro=md.id_registro where mr.usucre ilike '%${req.params.codigo}'
  order by md.ciudad) as b on a.metaphone=b.metaphone
  left join (select metaphone(f3,10),string_agg(distinct f3,', ') as f3, sum(count) registros from 
  (select trim(replace(case when ee2.respuesta is null then ee1.respuesta else ee2.respuesta end,'(F1) ','')) as f3,count(*) from 
  (select * from cat_upm where '0'||id_departamento||id_provincia||id_municipio='${req.params.codigo}' and estado!='ANULADO') cu
  join ope_asignacion oa on oa.id_upm=cu.id_upm
  join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.id_upm=oa.id_upm
  join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta=36846 and ee.visible=true
  join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta=37214 and ee1.visible=true
  left join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta=36856 and ee2.visible=true
  group by ee1.respuesta,ee2.respuesta) as a
  group by metaphone(f3,10)) as c on a.metaphone=c.metaphone
  left join (select metaphone(f4,10),string_agg(distinct f4,', ') as f4, sum(count) registros from 
  (select trim(replace(case when ee2.respuesta is null then ee1.respuesta else ee2.respuesta end,'(F1) ','')) as f4,count(*) from 
  (select * from cat_upm where '0'||id_departamento||id_provincia||id_municipio='${req.params.codigo}' and estado!='ANULADO') cu
  join ope_asignacion oa on oa.id_upm=cu.id_upm
  join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.id_upm=oa.id_upm
  join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta=36870 and ee.visible=true
  join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta=37209 and ee1.visible=true
  left join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta=37227 and ee2.visible=true
  group by ee1.respuesta,ee2.respuesta) as a
  group by metaphone(f4,10)) as d on a.metaphone=d.metaphone`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).send(result.rows);
    }
  })
}


const obtenerBoletasFormulario = (req, res) => {
  const text = `select ei.id_asignacion,cu.codigo,ei.correlativo,ob.codigo_brigada,ei.estado,ee1.respuesta as comunidad,ee2.respuesta as nombre,
  (select observacion from enc_observacion_area where estado='OBSERVACION' 
  and id_asignacion=ei.id_asignacion and correlativo=ei.correlativo and incidencia is null order by feccre desc limit 1),
  (select justificacion from enc_observacion_area where estado='OBSERVACION' 
  and id_asignacion=ei.id_asignacion and correlativo=ei.correlativo and incidencia is null order by feccre desc limit 1),
  ei.feccre::date as fecha
  from (select id_upm,codigo from cat_upm where id_departamento=${req.params.departamento} 
  and id_provincia::integer=${req.params.provincia} 
  and id_municipio::integer=${req.params.municipio}
  and estado!='ANULADO') cu
    join ope_asignacion oa on oa.id_upm=cu.id_upm
  join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.id_upm=cu.id_upm and ei.estado!='ANULADO'
    join seg_usuario su on su.id_usuario=oa.id_usuario
    join ope_brigada ob on ob.id_brigada=su.id_brigada
    join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta=36947 and ee.visible=true
    left join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta=36948 and ee1.visible=true
  left join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta=37301 and ee2.visible=true
    order by 1,2`
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      let BoletasPuntos = result.rows;
      return res.status(200).json({
        ok: true,
        msg: 'Boletas puntos con segmentos observados',
        BoletasPuntos
      })
    }
  })
}

const obtenerRespuestasFormulario = (req, res) => {
  const text = `select ee.id_pregunta,pregunta,ee.respuesta from enc_encuesta ee 
  join enc_pregunta ep on ee.id_pregunta=ep.id_pregunta
  where id_asignacion=${req.params.asignacion}  
  and correlativo=${req.params.correlativo}  
  and ee.visible=true and ep.id_pregunta not in (36947,37195)
  order by codigo_pregunta`
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).json(result.rows)
    }
  })
}

const obtenerDatosGrafico = (req, res) => {
  const text = `select * from avance_usuario(${req.params.id}, ${req.params.tipo}, ${req.params.id_depto}, '${req.params.id_distrito}', '${req.params.id_provincia}', '${req.params.id_municipio}', ${req.params.id_brigada})`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).send(result.rows);
    }
  })
}

const realizarConsistencia = (req, res) => {
  const text = `select * from fn_ac_consistencia(${req.params.upm}, ${req.params.tipo})`
  client.query(text, async (err, result1) => {
    if (err) {
      throw err;
    } else {
      const text = `select * from fn_ac_criterios(${req.params.upm})`
      client.query(text, async (err, result2) => {
        if (err) {
          throw err;
        } else {
          return res.status(200).send(result2.rows);
        }
      })
    }
  })
}

const habilitarManzano = async (req, res) => {
  let text;
  if (req.params.id_distrito=='00'){
    text = `select distinct respuesta as manzano,su.id_usuario,su.nombre,respuesta as codigo,oa.id_asignacion from cat_upm cu
    join cat_manzana ct on ct.respuesta=cu.codigo
    join ope_asignacion oa on oa.id_asignacion=ct.id_asignacion
    join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado='CONCLUIDO'
    join seg_usuario su on su.id_usuario=oa.id_usuario
    where cu.id_departamento::integer=${req.params.id_depto}
    and cu.id_provincia::integer=${req.params.id_prov}
    and cu.id_municipio::integer=${req.params.id_mun}
    and case when '00'='${req.params.id_distrito}' then cu.id_ciudad_comunidad='00000' else cu.id_ciudad_comunidad='${req.params.codigo}' end
    and cu.id_distrito='${req.params.id_distrito}'
    
    and ct.estado='CONCLUIDO'`;
  } else {
    text = `select distinct a.titulo as manzano,a.id_usuario,a.nombre,a.codigo,a.id_asignacion from 
    (select distinct case when ee1.respuesta='NO APLICA' then ee.respuesta else ee.respuesta||'-'||ee1.respuesta end as titulo,
    oa.id_usuario,su.login,su.nombre,cu.codigo,oa.id_asignacion from enc_informante oa 
    join enc_encuesta ee on ee.id_asignacion=oa.id_asignacion and ee.correlativo=oa.correlativo and ee.id_pregunta in (37207) and ee.visible=true and oa.estado in ('CONCLUIDO','FINALIZADO')
    join enc_encuesta ee1 on ee1.id_asignacion=oa.id_asignacion and ee1.correlativo=oa.correlativo and ee1.id_pregunta in (37208) and ee1.visible=true
    join cat_upm cu on cu.id_upm=oa.id_upm and cu.estado not in ('ANULADO','CONCLUIDO') and case when 1=1 then tipo_area='AMANZANADO' else tipo_area='DISPERSO' end
    join seg_usuario su on su.id_usuario=oa.id_usuario
    and cu.id_departamento::integer=${req.params.id_depto}
    and cu.id_provincia::integer=${req.params.id_prov}
    and cu.id_municipio::integer=${req.params.id_mun}
    and cu.id_ciudad_comunidad='${req.params.codigo}'
    and cu.id_distrito='${req.params.id_distrito}'
    ) as a,cat_manzana cm 
    where cm.cod_manzana=a.titulo and cm.id_usuario=a.id_usuario
    and cm.estado='CONCLUIDO'`;
  }
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const updateManzano = async (req, res) => {
  let text;
  text = `select * from updateManzano(${req.body.area},${req.body.usuario},${req.body.asignacion},'${req.body.manzano}','${req.body.upm}')`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } 
    else { 
      return res.status(200).json(result.rows); 
    }
  })
}

const infoActualizadoresBrigada = async (req, res) => {
  const text =`select split_part(a.id,'|',4) as id_usuario,split_part(a.id,'|',2) as codigo_brigada,split_part(a.id,'|',3) as login, split_part(a.id,'|',5) as nombre, a.concluido from 
    (select ob.id_brigada||'|'||codigo_brigada||'|'||login||'|'||su.id_usuario||'|'||su.nombre as id,count(*) as concluido from ope_asignacion oa
      join cat_upm cu on cu.id_upm=oa.id_upm and oa.estado!='ANULADO'
      join seg_usuario su on su.id_usuario=oa.id_usuario and su.id_rol!=8
      join ope_brigada ob on ob.id_brigada=su.id_brigada
      join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.id_upm=oa.id_upm
      and cu.id_departamento=${req.params.id_depto}
      and cu.id_provincia::integer=${req.params.id_prov}
      and cu.id_municipio::integer=${req.params.id_mun}
      and ob.id_brigada = ${req.params.id_brigada}
      and case when ${req.params.tipo_area} = 1 then cu.id_distrito ='${req.params.id_distrito}' else cu.id_distrito='00' end
      and case when ${req.params.tipo_area} = 1 then tipo_area ='AMANZANADO' else tipo_area ='DISPERSO' end
      group by ob.id_brigada||'|'||codigo_brigada||'|'||login||'|'||su.id_usuario||'|'||su.nombre order by 1,2) as a`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

/*  FRANZ */
const lista_brigada = async (req, res) => {
  const text = `select distinct ob.id_brigada,ob.codigo_brigada from cat_upm cu
    join ope_asignacion oa on oa.id_upm=cu.id_upm
    join seg_usuario su on su.id_usuario=oa.id_usuario
    join ope_brigada ob on ob.id_brigada=su.id_brigada
    where cu.id_upm=${req.params.trabajo}
    and ob.estado!='ANULADO'
    and ob.codigo_brigada not ilike '%ACEWEB%' and ob.codigo_brigada not ilike '%CARTO%'`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const lista_brigada_supervicion = async (req, res) => {
  const text = `select distinct  p.id_departamento , p.id_provincia, p.provincia, p.id_municipio, rtrim(p.municipio) as municipio, p.id_ciudad_comunidad, p.id_distrito, upper(p.ciudad_comunidad) as ciudad_comunidad,
  p.tipo_area, ob.id_brigada, ob.codigo_brigada, ob.estado from cat_upm p 
    join ope_asignacion op on op.id_upm=p.id_upm
    join enc_informante ei on ei.id_asignacion=op.id_asignacion and ei.id_upm=p.id_upm
    join seg_usuario su on su.id_usuario=op.id_usuario
    join ope_brigada ob on ob.id_brigada=su.id_brigada and codigo_brigada not ilike '%ACEWEB%'
    where p.id_departamento=${req.params.id_depto}
    and p.id_provincia::integer=${req.params.id_prov}
    and p.id_municipio::integer=${req.params.id_mun}
    and case when 1 = ${req.params.tipo_area}  then p.id_ciudad_comunidad ='${req.params.codigo}' else p.id_ciudad_comunidad='00000' end
    and case when 1 = ${req.params.tipo_area}  then p.id_distrito ='${req.params.id_distrito}' else p.id_distrito='00' end
    and case when 1 = ${req.params.tipo_area} then tipo_area ='AMANZANADO' else tipo_area ='DISPERSO' end
    and ob.estado!='ANULADO'`;
  console.log(text)
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const columnas = async (req, res) => {
  text= `select login,nombre from seg_usuario where estado='ELABORADO' and id_brigada=${req.params.brigada} and id_rol!=8 order by login`
  client.query(text, async (err, result) => {
    if (err) { 
      throw err; 
    } else { 
      return res.status(200).json(result.rows); 
    }
  })
}

const reportes = async (req, res) => {
  client.query(`select string_agg(login,',') from (select login||' text' as login from seg_usuario 
                where estado='ELABORADO' and id_brigada=${req.params.brigada} and id_rol!=8 order by login) as a`, async (err, result) => {
    if (err) { 
      throw err; 
    } else { 
      let text = '';
      if (req.params.sw==1){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,respuesta,count(*) from (select oa.id_upm,ee.codigo_respuesta,ee.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (37233,37240) and ee.visible=true
          and ei.id_usuario::text ilike '%%') as a
          group by id_upm,respuesta) as a
          join (select * from crosstab('select respuesta,login,count(*) from (select su.login,ee.codigo_respuesta,ee.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (37233,37240) and ee.visible=true) as a
          group by login,respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=1) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`
      }
      if (req.params.sw==2){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,respuesta,count(*) from (select oa.id_upm,ee.codigo_respuesta,ee.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.visible=true
          and ei.id_usuario::text ilike '%%') as a
          group by id_upm,respuesta) as a
          join (select * from crosstab('select respuesta,login,count(*) from (select su.login,ee.codigo_respuesta,ee.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.visible=true) as a
          group by login,respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=2) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`
      }
      if (req.params.sw==3){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,codigo_respuesta as respuesta,count(*) from (select oa.id_upm,ee1.codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta='1' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36886,36860) and ee1.visible=true
          and ei.id_usuario::text ilike '%%') as a
          group by id_upm,codigo_respuesta) as a
          join (select * from crosstab('select codigo_respuesta,login,count(*) from (select su.login,ee1.codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta=''1'' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36886,36860) and ee1.visible=true) as a
          group by login,codigo_respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=3) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`
      }
      if (req.params.sw==4){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,codigo_respuesta as respuesta,count(*) from (select oa.id_upm,ee1.codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta='1' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36887,36861) and ee1.visible=true
          and ei.id_usuario::text ilike '%%') as a
          group by id_upm,codigo_respuesta) as a
          join (select * from crosstab('select codigo_respuesta,login,count(*) from (select su.login,ee1.codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta=''1'' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36887,36861) and ee1.visible=true ) as a
          group by login,codigo_respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=4) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`
      }
      if (req.params.sw==5){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,codigo_respuesta as respuesta,count(*) from (select oa.id_upm,ee1.codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta='4' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36887,36861) and ee1.visible=true
          and ei.id_usuario::text ilike '%%') as a
          group by id_upm,codigo_respuesta) as a
          join (select * from crosstab('select codigo_respuesta,login,count(*) from (select su.login,ee1.codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta=''4'' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36887,36861) and ee1.visible=true) as a
          group by login,codigo_respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=5) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`
      }
      if (req.params.sw==6){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,codigo_respuesta as respuesta,count(*) from (select oa.id_upm,case when ee1.codigo_respuesta::int<998 then 'CON NOMBRE' else ee1.codigo_respuesta end as codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta='1' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36851,36878) and ee1.visible=true 
          and ei.id_usuario::text ilike '%%') as a
          group by id_upm,codigo_respuesta) as a
          join (select * from crosstab('select codigo_respuesta,login,count(*) from (select su.login,case when ee1.codigo_respuesta::int<998 then ''CON NOMBRE'' else ee1.codigo_respuesta end as codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta=''1'' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36851,36878) and ee1.visible=true) as a
          group by login,codigo_respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=6) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`
      }
      if (req.params.sw==7){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,codigo_respuesta as respuesta,count(*) from (select oa.id_upm,case when ee1.codigo_respuesta::int<998 then 'CON NOMBRE' else ee1.codigo_respuesta end as codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta='1' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36883,36857) and ee1.visible=true
          and ei.id_usuario::text ilike '%%') as a
          group by id_upm,codigo_respuesta) as a
          join (select * from crosstab('select codigo_respuesta,login,count(*) from (select su.login,case when ee1.codigo_respuesta::int<998 then ''CON NOMBRE'' else ee1.codigo_respuesta end as codigo_respuesta,ee1.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta=''1'' and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36883,36857) and ee1.visible=true) as a
          group by login,codigo_respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=7) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`
      }
      if (req.params.sw==8){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,respuesta,count(*) from (select oa.id_upm,ee.codigo_respuesta,ee.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (37215,37216) and ee.visible=true 
          left join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (37233,37240) and ee1.visible=true
			    where ee1.codigo_respuesta not in ('5','6')) as a
          group by id_upm,respuesta) as a
          join (select * from crosstab('select respuesta,login,count(*) from (select su.login,ee.codigo_respuesta,ee.respuesta from ope_asignacion oa 
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (37215,37216) and ee.visible=true
          left join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (37233,37240) and ee1.visible=true
			    where ee1.codigo_respuesta not in (''5'',''6'')) as a
          group by login,respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=8) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`
      }
      if (req.params.sw==9){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,respuesta,count(*) from (select oa.id_upm,ee1.codigo_respuesta,ee1.respuesta||'<br><h6><b>'||ee2.respuesta||'</b></h6>' as respuesta from ope_asignacion oa
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta in ('4') and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36854,36880) and ee1.visible=true
          join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta in (36862,37243) and ee2.visible=true 
          and ei.id_usuario::text ilike '%%') as a
          group by id_upm,respuesta) as a
          join (select * from crosstab('select respuesta,login,count(*) from 
          (select su.login,ee1.codigo_respuesta,ee1.respuesta||''<br><h6><b>''||ee2.respuesta||''</b></h6>'' as respuesta from ope_asignacion oa
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta in (''4'') and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36854,36880) and ee1.visible=true
          join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta in (36862,37243) and ee2.visible=true) as a
          group by login,respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=9) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`;
      }
      if (req.params.sw==10){
          text= `select b.*,a.count,c.observacion,c.justificacion from 
          (select id_upm,respuesta,count(*) from (select oa.id_upm,ee1.codigo_respuesta,ee1.respuesta||'<br><h6><b>'||ee2.respuesta||'</b></h6>' as respuesta from ope_asignacion oa
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado='ELABORADO' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN ('ANULADO','ELABORADO')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta in ('5') and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36854,36880) and ee1.visible=true
          join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta in (36862,37243) and ee2.visible=true 
          and ei.id_usuario::text ilike '%%') as a
          group by id_upm,respuesta) as a
          join (select * from crosstab('select respuesta,login,count(*) from 
          (select su.login,ee1.codigo_respuesta,ee1.respuesta||''<br><h6><b>''||ee2.respuesta||''</b></h6>'' as respuesta from ope_asignacion oa
          join seg_usuario su on su.id_usuario=oa.id_usuario and id_brigada=${req.params.brigada} and oa.estado=''ELABORADO'' and oa.id_upm=${req.params.trabajo}
          join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado NOT IN (''ANULADO'',''ELABORADO'')
          join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36877,36850) and ee.codigo_respuesta in (''5'') and ee.visible=true
          join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36854,36880) and ee1.visible=true
          join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta in (36862,37243) and ee2.visible=true) as a
          group by login,respuesta order by 1,2',
          'select login from seg_usuario where estado=''ELABORADO'' and id_brigada=${req.params.brigada} and id_rol!=8 order by login')
          as (respuesta text,${result.rows[0].string_agg})) as b on a.respuesta=b.respuesta
          left join (select * from enc_observacion_area where estado='OBSERVACION' and id_upm=${req.params.trabajo} and incidencia=10) as c
          on c.id_asignacion =(select oa.id_asignacion from ope_asignacion oa join seg_usuario su on su.id_usuario=oa.id_usuario 
            where oa.id_upm=a.id_upm and su.id_rol=8 and su.id_brigada=${req.params.brigada})
          and a.respuesta = split_part(c.observacion,'<br>',1)
          order by a.respuesta`
      }
      client.query(text, async (err, result1) => {
        if (err) { throw err; } else { return res.status(200).json(result1.rows); }
      })
    }
  })
}

const obtenerPuntosBrigadas = async (req, res) => {
  const text = `SELECT row_to_json(fc)
  FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
  FROM (
  SELECT 'Feature' As type
  , ST_AsGeoJSON((lg.geom),5,0)::json As geometry
  , row_to_json((SELECT l FROM (SELECT id,color,usuario,orden_predio,lado) As l
  )) As properties
  FROM ( select min(id) id,codigo_respuesta,geom,color,usuario,string_agg(distinct orden_predio,'-') orden_predio,string_agg(distinct lado,'-') lado from
(select ei.id_asignacion||'-'||ei.correlativo as id,ee2.codigo_respuesta,
 st_setsrid(st_point((split_part(ei.codigo::text, ','::text, 2)::numeric)::double precision, (split_part(ei.codigo::text, ','::text, 1)::numeric)::double precision), 4326) AS geom,
case 
when ei.estado='PRECONCLUIDO' then '#fffb00'
when ei.estado='ELABORADO' then '#278CF8'
when ei.estado = 'CONCLUIDO' then '#0E8C06' end color,su.login as usuario,ee1.respuesta as orden_predio,ee3.respuesta as lado from cat_upm cu
join enc_informante ei on ei.id_upm=cu.id_upm and ei.estado!='ANULADO' and ei.id_asignacion_padre is null
join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta in (36870,36846)
join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta in (36848,36873)
left join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta in (36879) and ee2.visible=true
left join enc_encuesta ee3 on ee3.id_asignacion=ei.id_asignacion and ee3.correlativo=ei.correlativo and ee3.id_pregunta in (36872) and ee3.visible=true
join seg_usuario su on su.id_usuario=ei.id_usuario
where cu.id_departamento=${req.params.id_depto}
and id_provincia::integer=${req.params.id_prov}
and id_municipio::integer=${req.params.id_mun}
and case when 1 = ${req.params.tipo_area}  then id_ciudad_comunidad ='${req.params.codigo}' else id_ciudad_comunidad='00000' end
and case when 1 = ${req.params.tipo_area}  then id_distrito ='${req.params.id_distrito}' else id_distrito='00' end
and case when 1 = ${req.params.tipo_area}  then tipo_area ='AMANZANADO' else tipo_area ='DISPERSO' end
and case when 0 =${req.params.id_brigada} then su.id_brigada::text ilike '%%' else id_brigada=${req.params.id_brigada} end) as a
where (a.codigo_respuesta is null or a.codigo_respuesta::int=1)
group by codigo_respuesta,geom,color,usuario) As lg) As f )  As fc`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const obtenerPuntosFormulario = async (req, res) => {
  const text = `SELECT row_to_json(fc)
  FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
  FROM ( SELECT 'Feature' As type
  , ST_AsGeoJSON((lg.geom),5,0)::json As geometry
  , row_to_json((SELECT l FROM (SELECT id,tipo_vivienda,orden_predio,lado_manzana,edificio,estado,usuario,color) As l
  )) As properties
  FROM (select ei.id_asignacion || '|'|| ei.correlativo AS id,
  tv.respuesta AS tipo_vivienda,
  CASE WHEN (ee.id_pregunta = 36947) THEN nc.respuesta ELSE op.respuesta END AS orden_predio,
  ei.estado,
  su.nombre AS usuario,
  lm.respuesta AS lado_manzana,
  ee1.respuesta as edificio,
  case when ei.estado = 'CONCLUIDO' then '#278CF8'
  when ei.estado='PRECONCLUIDO' then '#278CF8'
  when ei.estado='FINALIZADO' then '#0E8C06' end color,
  st_setsrid(st_point(((split_part(COALESCE(ee.respuesta, (ei.codigo)::text), ','::text, 2))::numeric)::double precision, 
  ((split_part(COALESCE(ee.respuesta, (ei.codigo)::text), ','::text, 1))::numeric)::double precision), 4326) AS geom 
  from (select * from cat_upm cu where cu.id_departamento=${req.params.id_depto}
  and cu.id_provincia::integer=${req.params.id_prov}
  and cu.id_municipio::integer=${req.params.id_mun} 
  and case when 1 = ${req.params.tipo_area}  then cu.id_distrito ='${req.params.id_distrito}' else cu.id_distrito='00' end 
  and case when 1 = ${req.params.tipo_area}  then cu.tipo_area ='AMANZANADO' else cu.tipo_area ='DISPERSO' end) as cu
  join ope_asignacion oa on oa.id_upm=cu.id_upm
  join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.id_upm=cu.id_upm and ei.estado!='ANULADO'
  LEFT JOIN enc_encuesta ee ON ei.id_asignacion = ee.id_asignacion AND ei.correlativo = ee.correlativo AND ee.id_pregunta in (36947, 36846, 36870) AND ee.visible = true
  LEFT JOIN enc_encuesta tv ON ei.id_asignacion = tv.id_asignacion AND ei.correlativo = tv.correlativo AND tv.id_pregunta in (37233, 37240) AND tv.visible = true
  LEFT JOIN enc_encuesta op ON ei.id_asignacion = op.id_asignacion AND ei.correlativo = op.correlativo AND op.id_pregunta in (36848, 36873) AND op.visible = true
  LEFT JOIN enc_encuesta nc ON ei.id_asignacion = nc.id_asignacion AND ei.correlativo = nc.correlativo AND nc.id_pregunta = 36948 AND nc.visible = true
  LEFT JOIN enc_encuesta lm ON ei.id_asignacion = lm.id_asignacion AND ei.correlativo = lm.correlativo AND lm.id_pregunta = 36872 AND lm.visible = true
  LEFT JOIN enc_encuesta ee2 on ei.id_asignacion = ee2.id_asignacion AND ei.correlativo = ee2.correlativo and ee2.id_pregunta=36879 and ee2.visible=true
  LEFT JOIN enc_encuesta ee1 on ei.id_asignacion = ee1.id_asignacion AND ei.correlativo = ee1.correlativo and ee1.id_pregunta=37241 and ee1.visible=true
  JOIN seg_usuario su ON su.id_usuario = ei.id_usuario 
  where case when 0 = ${req.params.id_brigada} then su.id_brigada::text ilike '%%' else su.id_brigada=${req.params.id_brigada} end
  and ee2.codigo_respuesta is not null and ee2.codigo_respuesta='2') As lg) As f )  As fc`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const obtenerPuntosEdificacion = async (req, res) => {
  const text = `SELECT row_to_json(fc)
  FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
  FROM (
  SELECT 'Feature' As type
  , ST_AsGeoJSON((lg.geom),5,0)::json As geometry
  , row_to_json((SELECT l FROM (SELECT id, tipo, ciu_com) As l
  )) As properties
  FROM (SELECT id, geom::geometry, tipo, ciu_com
  FROM ace.ad_bol_com_edif 
  where cod_depto = ${req.params.id_depto} 
  and cod_prov = ${req.params.id_prov} 
  and cod_mpio = ${req.params.id_mun} ) As lg) As f )  As fc`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const lista_shapeManzanas = async (req, res) => {
  const text =`SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM (SELECT 'Feature' As type
       , ST_AsGeoJSON((geom),15,0)::json As geometry
       , row_to_json((SELECT l FROM (SELECT depto, cod_depto, prov, cod_prov, mpio, cod_mpio, ciu_com, cod_cd_com, cod_loc, distrito, id_manz, orden_manz, cod_ac, t_viv_ocu, t_viv_des, total_viv, total_pob,area_trabajo,color) As l
         )) As properties
      FROM (SELECT distinct bm.id, cu.codigo as area_trabajo, bm.depto, bm.cod_depto, bm.prov, bm.cod_prov, bm.mpio, bm.cod_mpio, bm.ciu_com, bm.cod_cd_com, bm.cod_loc, bm.distrito, bm.id_manz, bm.orden_manz, bm.cod_ac,bm.estado,
  case when bm.estado = 'ASIGNADO' then '#FFFFFF' end color,bm.t_viv_ocu, bm.t_viv_des, bm.total_viv, bm.total_pob,su.id_brigada,ST_X(ST_CENTROID(bm.geom)) AS latitud, ST_Y(ST_CENTROID(bm.geom)) AS longitud,bm.geom
  FROM ace.bolivia_manzano bm
  JOIN cat_upm cu on cu.id_upm=bm.id_upm 
  JOIN ope_asignacion AS oa ON oa.id_upm = bm.id_upm and oa.estado!='ANULADO'
  JOIN seg_usuario AS su ON su.id_usuario = oa.id_usuario
  where bm.cod_depto::integer=${req.params.id_depto}
  and bm.cod_prov::integer=${req.params.id_prov}
  and bm.cod_mpio::integer=${req.params.id_mun}
  and case when '00'='${req.params.id_distrito}' then bm.cod_cd_com='00000' else bm.cod_cd_com='${req.params.id_ciudad}' end
  and bm.distrito='${req.params.id_distrito}'
  and su.id_brigada='${req.params.id_brigada}') As lg) As f`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const lista_shapeAreas = async (req, res) => {
  const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM (SELECT 'Feature' As type, ST_AsGeoJSON((geom),15,0)::json As geometry, row_to_json((SELECT l FROM (SELECT sector,zona,codigo,color) As l)) As properties
    FROM (select a.*,concat('#03', left(lpad(to_hex((random() * 10000000)::bigint), 4, '0'), 6)) as color from 
    (SELECT string_agg(distinct ee.sector,'-') as sector,ee.zona,cu.codigo,geom FROM ace.a_sector as ee
    JOIN cat_upm cu
    on ee.cod_depto::integer=cu.id_departamento
    and ee.cod_prov=cu.id_provincia
    and ee.cod_mpio=cu.id_municipio
    and case when '00'='${req.params.id_distrito}' then ee.cod_ci_com='00000' else ee.cod_ci_com='${req.params.id_ciudad}' end
    and ee.area_cpv = cu.id_distrito
    and ee.zona=cu.zona
    and case when cu.sector ilike '%-%' then ee.sector::int BETWEEN split_part(cu.sector,'-',1)::int AND split_part(cu.sector,'-',2)::int else cu.sector=ee.sector end
    JOIN ope_asignacion AS oa ON oa.id_upm = cu.id_upm and oa.estado!='ANULADO'
    JOIN seg_usuario AS su ON su.id_usuario = oa.id_usuario
    where ee.cod_depto::integer=${req.params.id_depto} and cu.estado!='ANULADO'
    and ee.cod_prov::integer=${req.params.id_prov}
    and ee.cod_mpio::integer=${req.params.id_mun}
    and su.id_brigada='${req.params.id_brigada}'
    and cu.codigo is not null
    and case when '00' != '${req.params.id_distrito}'  then cu.id_ciudad_comunidad ='${req.params.id_ciudad}' else cu.id_ciudad_comunidad='00000' end
    and case when '00' != '${req.params.id_distrito}'  then cu.id_distrito ='${req.params.id_distrito}' else cu.id_distrito='00' end
    and case when '00' != '${req.params.id_distrito}'  then cu.tipo_area ='AMANZANADO' else cu.tipo_area ='DISPERSO' end
    group by ee.zona,cu.codigo,geom) as a) As lg) As f`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const lista_shapeConlindantes = async (req, res) => {
  const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
  FROM (SELECT 'Feature' As type, ST_AsGeoJSON((geom),15,0)::json As geometry, row_to_json((SELECT l FROM (SELECT sector,color) As l)) As properties
  FROM (SELECT sector,geom,'#ADADAD' as color FROM ace.a_sector as ee
where ee.cod_depto::integer=${req.params.id_depto} 
and ee.cod_prov::integer=${req.params.id_prov}
and ee.cod_mpio::integer=${req.params.id_mun} and tipo_area='D' and zona||sector not in 
(select distinct zona||sector from cat_upm cu 
join ope_asignacion oa on oa.id_upm=cu.id_upm
join seg_usuario su on su.id_usuario=oa.id_usuario and su.id_brigada=${req.params.brigada}
where cu.tipo_area='DISPERSO' 
and cu.id_departamento::int=${req.params.id_depto} 
and cu.id_provincia::int=${req.params.id_prov} 
and cu.id_municipio::int=${req.params.id_mun})) As lg) As f`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const lista_rios = async (req, res) => {
  const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
  FROM (SELECT 'Feature' As type, ST_AsGeoJSON((geom),15,0)::json As geometry, row_to_json((SELECT l FROM (SELECT nombre) As l)) As properties
  FROM (select geom,nombre from ace.cb_d_hidrografia 
  where cod_mpio='${req.params.depto}') As lg) As f`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const lista_caminos = async (req, res) => {
  const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
  FROM (SELECT 'Feature' As type, ST_AsGeoJSON((geom),15,0)::json As geometry, row_to_json((SELECT l FROM (SELECT nombre) As l)) As properties
  FROM (select geom,nombre from ace.cb_d_vias_bolivia
  where cod_mpio='${req.params.depto}') As lg) As f`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const lista_cerros = async (req, res) => {
  const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
  FROM (SELECT 'Feature' As type, ST_AsGeoJSON((geom),15,0)::json As geometry, row_to_json((SELECT l FROM (SELECT nombre) As l)) As properties
  FROM (select geom,nombre from ace.cb_d_hipsografia
  where cod_mpio ilike '${req.params.depto}%') As lg) As f`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const updateLado = async (req, res) => {
  const text = `update enc_encuesta set respuesta='${req.body.lado}'
  from enc_informante ei where enc_encuesta.id_asignacion=ei.id_asignacion and enc_encuesta.correlativo=ei.correlativo
  and enc_encuesta.id_pregunta=36872 and ei.codigo in (select codigo from enc_informante 
  where id_asignacion=${req.params.asignacion} and correlativo=${req.params.correlativo})`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const lista_Equipamientos = async (req, res) => {
  const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM (
    SELECT 'Feature' As type
    , ST_AsGeoJSON((lg.geom),5,0)::json As geometry
    , row_to_json((SELECT l FROM (SELECT id_equipamiento,nombre_equipamiento,nombre,estado,usuario) As l
    )) As properties
    FROM ( select right('000'||id_equipamiento::text,3) as id_equipamiento,nombre_equipamiento,eq.nombre,eq.estado,eq.usucre as usuario,
      st_setsrid(st_point(((split_part((eq.codigo)::text, ','::text, 2))::numeric)::double precision, ((split_part((eq.codigo)::text, ','::text, 1))::numeric)::double precision), 4326) AS geom from enc_equipamiento eq
    join ope_asignacion oa on oa.id_asignacion=eq.id_asignacion
    join cat_upm cu on cu.id_upm=oa.id_upm
    where cu.id_departamento=${req.params.id_depto}
    and cu.id_provincia::integer=${req.params.id_prov}
    and cu.id_municipio::integer=${req.params.id_mun} 
    and cu.codigo_area::integer=${req.params.id_area}) As lg) As f )  As fc`;
    client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const shapeequip_historicoa = async (req, res) => {
  let text;
  if (req.params.sw==1){
    text = `SELECT row_to_json(fc)
        FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
        FROM ( SELECT 'Feature' As type
        , ST_AsGeoJSON((lg.geom),5,0)::json As geometry
        , row_to_json((SELECT l FROM (SELECT tipo_equip,nomb_equip,cod_tipo) As l)) As properties
        FROM (SELECT tipo_equip,nomb_equip,cod_tipo,geom
      FROM ace.cb_a_equipamiento As lg
      where substring(con_dist,1,2)::integer=${req.params.id_depto}
      and substring(con_dist,3,2)::integer=${req.params.id_prov}
      and substring(con_dist,5,2)::integer=${req.params.id_mun}
      and substring(con_dist,7,5)='${req.params.id_ciudad}'
      and substring(con_dist,12,2)='${req.params.id_distrito}'
      and cod_tipo in (select codigo from cat_catalogo where catalogo='cat_simbologia' and estado='ELABORADO')
      and gid not in (select gid from enc_equipamiento eq
      join ope_asignacion oa on oa.id_asignacion=eq.id_asignacion and eq.estado in ('ACTUALIZADO','ANULADO')
      join cat_upm cu on cu.id_upm=oa.id_upm
      where cu.id_departamento=${req.params.id_depto} 
      and cu.id_provincia::integer=${req.params.id_prov}
      and cu.id_municipio::integer=${req.params.id_mun}
      and cu.codigo_area::integer=1)) As lg) As f )  As fc`;
  } else {
    text = `SELECT row_to_json(fc)
        FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
        FROM ( SELECT 'Feature' As type
        , ST_AsGeoJSON((lg.geom),5,0)::json As geometry
        , row_to_json((SELECT l FROM (SELECT tipo_equip,nomb_equip,cod_tipo) As l)) As properties
        FROM (SELECT tipo_equip,nomb_equip,cod_tipo,geom
      FROM ace.cb_a_equipamiento As lg
      where substring(con_dist,1,2)::integer=${req.params.id_depto}
      and substring(con_dist,3,2)::integer=${req.params.id_prov}
      and substring(con_dist,5,2)::integer=${req.params.id_mun}
      and substring(con_dist,7,2)='${req.params.id_distrito}'
      and cod_tipo in (select codigo from cat_catalogo where catalogo='cat_simbologia' and estado='ELABORADO')
      and gid not in (select gid from enc_equipamiento eq
      join ope_asignacion oa on oa.id_asignacion=eq.id_asignacion and eq.estado in ('ACTUALIZADO','ANULADO')
      join cat_upm cu on cu.id_upm=oa.id_upm
      where cu.id_departamento=${req.params.id_depto} 
      and cu.id_provincia::integer=${req.params.id_prov}
      and cu.id_municipio::integer=${req.params.id_mun}
      and cu.codigo_area::integer=1)) As lg) As f )  As fc`;
  }
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

/* *************************************************** FRANZ **********************************************************************************/
const obtenerConteoAreas = (req, res) => {
  const text = `select case when a.estado='ELABORADO' then 'ASIGNADO' else a.estado end estado, a.color, case when b.total is null then 0 else b.total end as total from
    (select * from municipio.estado where estado in ('ELABORADO','CONCLUIDO','OBSERVADO') order by id) as a left join
    (select cu.estado,count(distinct cu.id_upm) as total from cat_upm cu 
        join ope_asignacion oa on cu.id_upm=oa.id_upm and oa.estado!='ANULADO'
        join seg_usuario su on su.id_usuario=oa.id_usuario
        join ope_brigada ob on ob.id_brigada=su.id_brigada
        where cu.id_departamento=${req.params.id_depto}
        and cu.id_provincia::integer=${req.params.id_prov} 
        and cu.id_municipio::integer=${req.params.id_mun} 
        and cu.codigo is not null
        and codigo_brigada='${req.params.brigada}'
        and cu.estado!='ANULADO'
        and case when ${req.params.tipo_area} = 1  then cu.id_ciudad_comunidad ='${req.params.codigo}' else cu.id_ciudad_comunidad='00000' end
        and case when ${req.params.tipo_area} = 1  then cu.id_distrito ='${req.params.id_distrito}' else cu.id_distrito='00' end
        and case when ${req.params.tipo_area} = 1  then cu.tipo_area ='AMANZANADO' else cu.tipo_area ='DISPERSO' end
        group by cu.estado) as b
      on a.estado=b.estado`;

  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      let brigadas = result.rows;
      return res.status(200).json({
        ok: true,
        msg: 'Brigadas',
        brigadas
      })
    }
  })
}

const obtenerObservaciones = (req, res) => {
  const text = `select distinct aa.id_asignacion,aa.correlativo,su.login,ob.codigo_brigada,aa.id_upm,cu.codigo,cu.tipo_area,cu.id_distrito,observacion,justificacion,
        case when aa.estado='CONCLUIDO' then 'APROBADO' else 'OBSERVADO' end as estado from cat_upm cu 
        join ope_asignacion oa on cu.id_upm=oa.id_upm and oa.estado!='ANULADO'
        join seg_usuario su on su.id_usuario=oa.id_usuario
        join ope_brigada ob on ob.id_brigada=su.id_brigada
        join enc_observacion_area aa on aa.id_upm=cu.id_upm
        where cu.id_departamento=${req.params.id_depto}
        and cu.id_provincia::integer=${req.params.id_prov} 
        and cu.id_municipio::integer=${req.params.id_mun} 
        and cu.codigo is not null
        and codigo_brigada='${req.params.brigada}'
        and cu.estado!='ANULADO'
        and case when ${req.params.tipo_area} = 1  then cu.id_ciudad_comunidad ='${req.params.codigo}' else cu.id_ciudad_comunidad='00000' end
        and case when ${req.params.tipo_area} = 1  then cu.id_distrito ='${req.params.id_distrito}' else cu.id_distrito='00' end
        and case when ${req.params.tipo_area} = 1  then cu.tipo_area ='AMANZANADO' else cu.tipo_area ='DISPERSO' end
        and aa.estado!='OBSERVACION' 
        and case when 0=${req.params.sw} then aa.estado='ELABORADO' else aa.estado ilike '%%' end
        and aa.id_asignacion=oa.id_asignacion
        order by id_upm,correlativo`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).json(result.rows)
    }
  })
}

const obtenerObservacion = (req, res) => {
  const text = `select cu.codigo,su.login as monitor,su1.login as supervisor,observacion,justificacion,ea.feccre from enc_observacion_area ea
  join cat_upm cu on cu.id_upm=ea.id_upm and ea.estado='OBSERVACION'
  join seg_usuario su on su.id_usuario=ea.usucre::int
  join ope_asignacion oa on oa.id_asignacion=ea.id_asignacion
  join seg_usuario su1 on su1.id_usuario=oa.id_usuario
  where ea.id_asignacion=${req.params.asignacion} and ea.incidencia is null order by ea.feccre desc`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).json(result.rows)
    }
  })
}

const listarAreas = async (req, res) => {
  const text = `select cu.id_upm,cu.codigo,ob.codigo_brigada,cu.tipo_area,cu.id_distrito,
	case when cu.estado='ELABORADO' then 'ASIGNADO' else cu.estado end estado,
    case when cu.estado='CONCLUIDO' then 'APROBADO' else 'NO APROBADO' end opcion,
	count(*) filter (where ei.estado in ('ELABORADO')) as elaborado,
	count(*) filter (where ei.estado in ('PRECONCLUIDO')) as preconcluido,
	count(*) filter (where ei.estado in ('CONCLUIDO','FINALIZADO')) as concluido,
	oa.fec_inicio,oa.fec_fin,cu.fecmod from cat_upm cu 
	join ope_asignacion oa on oa.id_upm=cu.id_upm and oa.estado!='ANULADO' and cu.estado!='ANULADO'
	join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.id_upm=cu.id_upm and ei.estado!='ANULADO'
	join seg_usuario su on su.id_usuario=oa.id_usuario
  join ope_brigada ob on ob.id_brigada=su.id_brigada
	where cu.id_departamento=${req.params.id_depto}
  and cu.id_provincia::integer=${req.params.id_prov} 
  and cu.id_municipio::integer=${req.params.id_mun} 
  and cu.codigo is not null
  and codigo_brigada='${req.params.brigada}'
  and cu.estado!='ANULADO'
  and cu.id_ciudad_comunidad ='${req.params.codigo}'
  and case when ${req.params.tipo_area} = 1  then cu.id_distrito ='${req.params.id_distrito}' else cu.id_distrito='00' end
  and case when ${req.params.tipo_area} = 1  then cu.tipo_area ='AMANZANADO' else cu.tipo_area ='DISPERSO' end
	group by cu.id_upm,cu.codigo,ob.codigo_brigada,cu.tipo_area,cu.id_distrito,oa.fec_inicio,oa.fec_fin,cu.fecmod`;
  client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
  })
}

const updateArea = async (req, res) => {
  let query;
  if(req.body.tipo==-1){
    query = {  text: `update ace.bolivia_manzano set id_upm=${req.body.id_upm},estado='ASIGNADO' where id=${req.body.id};
                      update ope_asignacion set usumod='${req.body.usucre}',fecmod=now() where id_upm=${req.body.id_upm};` 
            }
  } else {
    query = {  text: `update ace.bolivia_manzano set id_upm=null,estado='ELABORADO' where id=${req.body.id};
                      update ope_asignacion set usumod='${req.body.usucre}',fecmod=now() where id_upm=${req.body.id_upm};` }
  }
  client.query(query, async (err, result) => {
    if (err) { 
      throw err; 
    } else {
      client.query(`select count(*) from ace.bolivia_manzano where id_upm=${req.body.id_upm}`, async (err, result1) => {
        if (err) { 
          throw err; 
        } else { 
          if(result1.rows[0].count>0){
            return res.status(200).json(result.rows);       
          } else {
            client.query(`update cat_upm set estado='ANULADO' where id_upm=${req.body.id_upm};
                          update ope_asignacion set exportar=0,usumod='${req.body.usucre}',fecmod=now() where id_upm=${req.body.id_upm};`, async (err, result1) => {
              if (err) { 
                throw err; 
              } else { 
                return res.status(200).json(result.rows);       
              }
            })
          }
        }
      }) 
    }
  })
}

module.exports = {
  finalizarArea,
  finalizarJustificacion,
  finalizarFormulario,
  boletasDatos,
  obtenerBoletasFormulario,
  obtenerCatalogoBrigada,
  obtenerCatalagoComunidad,
  obtenerConteoAreas,
  obtenerObservaciones,
  obtenerObservacion,
  obtenerDatosGrafico,
  realizarConsistencia,
  infoActualizadoresBrigada,
  lista_brigada,
  lista_brigada_supervicion,
  obtenerPuntosBrigadas,
  obtenerPuntosFormulario,
  obtenerPuntosEdificacion,
  lista_shapeManzanas,
  lista_shapeAreas,
  lista_shapeConlindantes,
  lista_rios,
  lista_caminos,
  lista_cerros,
  lista_Equipamientos,
  shapeequip_historicoa,
  habilitarManzano,
  updateManzano,
  listarAreas,
  reportes,
  columnas,
  updateArea,
  observarArea,
  justificarArea,
  observarReporte,
  observarFormulario,
  observarJustificacion,
  obtenerRespuestasFormulario,
  updateLado,
  desaprobar,
  formularioVerificacion
}
