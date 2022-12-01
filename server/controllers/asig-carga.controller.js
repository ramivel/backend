const ActiveDirectory = require('activedirectory2');
const configAD = require('../config/active-directori.config');
var ad = new ActiveDirectory(configAD);
const bcrypt = require('bcryptjs');

const { Pool } = require('pg');
const client = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
client.connect();

const brigadasGet = (req, res)=>{
    const query = {
        text: `select id_brigada,codigo_brigada,b.id_departamento,nombre,1 as sw from ope_brigada a 
        JOIN cat_departamento b ON a.id_departamento = b.id_departamento
        AND a.id_brigada NOT IN(select DISTINCT id_brigada from seg_usuario where estado='ELABORADO') 
        AND a.estado='ELABORADO'
        where case when 0=${req.params.departamento} then b.codigo ilike '%%' else b.id_departamento = ${req.params.departamento} end
        union all
        select id_brigada,codigo_brigada,b.id_departamento,nombre,2 as sw from ope_brigada a 
        JOIN cat_departamento b ON a.id_departamento = b.id_departamento
        AND a.id_brigada IN(select DISTINCT id_brigada from seg_usuario where estado='ELABORADO') 
        AND a.estado='ELABORADO'
        where case when 0=${req.params.departamento} then b.codigo ilike '%%' else b.id_departamento = ${req.params.departamento} end
        order by sw,nombre`
    }
    client.query(query, (err, result) => {
      if (err) {
        throw err;
      } else {
        let roles = result.rows;
        return res.status(200).json({
          ok:true,
          msg:'Brigadas',
          roles
        })
      }
    })
    
}

const usuarioSinBrigada = (req, res)=>{
  const text= `select su.id_usuario,login,nombre,descripcion,su.id_rol,su.id_departamento from seg_usuario su join seg_rol sr on sr.id_rol=su.id_rol 
    where su.estado!='ANULADO' and id_brigada=-1 and su.id_rol in (8,9) and id_departamento=${req.params.id} order by id_usuario`
  client.query(text, (err, result) => {
      if (err) {
        throw err;
      } else {
        return res.status(200).json(result.rows)
      }
     })
}

const usuarioBrigadaId = (req, res)=>{
  const text= `select su.id_usuario,login,nombre,descripcion from seg_usuario su join seg_rol sr on sr.id_rol=su.id_rol 
    where su.estado!='ANULADO' and id_brigada=${req.params.id} order by descripcion desc,id_usuario`
  client.query(text, (err, result) => {
      if (err) {
        throw err;
      } else {
        return res.status(200).json(result.rows)
      }
     })
}

const adicionarUsuario = (req, res)=>{
  let text;
  text= `select count(*) from seg_usuario where id_brigada=${req.params.brigada} and id_rol=8`
  client.query(text, (err, result) => {
      if (err) {
        throw err;
      } else {
        if(result.rows[0].count>0 && req.params.rol=='8'){
          return res.status(200).json('No se puede adicionar dos supervisores a la brigada')
        } else {
          text= `update seg_usuario set id_brigada=${req.params.brigada} where id_usuario=${req.params.usuario};
          INSERT INTO public.ope_asignacion(id_usuario, id_upm, estado, usucre, feccre, usumod, fecmod, gestion, mes, revisita, id_nivel, fec_inicio, fec_fin)
          select ${req.params.usuario}, oa.id_upm, oa.estado, oa.usucre, oa.feccre, oa.usumod, now(), gestion, mes, revisita, id_nivel, fec_inicio, fec_fin from ope_asignacion oa 
          join cat_upm cu on cu.id_upm=oa.id_upm and cu.estado='ELABORADO'
          where id_usuario in (select id_usuario from seg_usuario where estado!='ANULADO' and id_brigada=${req.params.brigada} order by id_usuario limit 1);` 
          client.query(text, (err, result) => {
              if (err) {
                throw err;
              } else {
                return res.status(200).json('Se asigno el usuario a la brigada')
              }
          })
        }
      }
     })
}

const eliminarBrigadaId = (req, res)=>{
  let text;
  text= `select count(*) from ope_asignacion where id_usuario in (select id_usuario from seg_usuario where id_brigada=${req.params.id})`
  client.query(text, (err, result) => {
    if (err) {
      throw err;
    } else {
      if(result.rows[0].count!=0){
        return res.status(200).json('No se pudo eliminar la brigada porque ya tiene areas de trabajo asignado')
      } else {
        text= `update ope_brigada set estado='ANULADO' where id_brigada=${req.params.id};
        update seg_usuario set estado='ANULADO' where id_brigada=${req.params.id}`
        client.query(text, (err, result) => {
            if (err) {
              throw err;
            } else {
              return res.status(200).json('Se anulo la brigada correctamente')
            }
        })
      }
    }
   })
}

const brigadasConsolidadas = (req, res)=>{
  const text = `select distinct ob.id_brigada,ob.codigo_brigada,cd.nombre from ope_asignacion oa 
      join seg_usuario su on su.id_usuario=oa.id_usuario
      join ope_brigada ob on ob.id_brigada=su.id_brigada
      join cat_departamento cd on cd.id_departamento=ob.id_departamento
      where oa.estado='ELABORADO' and su.estado='ELABORADO' 
      and case when 0=${req.params.departamento} then cd.codigo ilike '%%' else cd.id_departamento=${req.params.departamento} end order by nombre,codigo_brigada`;
  client.query(text, (err, result) => {
      if (err) {
        throw err;
      } else {
        return res.status(200).json(result.rows)
      }
     })
}

const areasAsignadas = (req, res)=>{
  /* Ramiro */
  const i = 0;
  const text = `select distinct ob.codigo_brigada,oa.id_upm,oa.fec_inicio,oa.fec_fin,cu.codigo,cd.nombre as departamento,cu.provincia,cu.municipio,id_distrito,
    ciudad_comunidad,cu.tipo_area,ab.zona,ab.sector,su1.nombre as creacion,su2.nombre as modificacion from ope_asignacion oa
      join seg_usuario su on su.id_usuario=oa.id_usuario and oa.estado!='ANULADO' and su.estado!='ANULADO'
      join seg_usuario su1 on su1.id_usuario::text=oa.usucre 
	    left join seg_usuario su2 on su2.id_usuario::text=oa.usumod
      join ope_brigada ob on ob.id_brigada=su.id_brigada and ob.estado!='ANULADO'
      join cat_upm cu on cu.id_upm=oa.id_upm
      join ace.bolivia_manzano ab on ab.id_upm=cu.id_upm
      join cat_departamento cd on cd.id_departamento=cu.id_departamento
      where case when ${req.params.id_brigada}=0 then su.id_brigada::text ilike '%%' else su.id_brigada=${req.params.id_brigada} end
      and case when 0=${req.params.departamento} then cd.codigo ilike '%%' else cd.id_departamento = ${req.params.departamento} end
      and case when 0=${req.params.codigo} then codigo_brigada ilike '%%' else codigo_brigada='${req.params.codigo}' end
      order by departamento,provincia,municipio,ciudad_comunidad,id_distrito,codigo_brigada`;
  client.query(text, (err, result) => {
      if (err) {
        throw err;
      } else {
        return res.status(200).json(result.rows)
      }
     })
}

const usuariosActualizador=(req, res)=>{
  const text = `Select a.id_usuario, a.login, a.nombre nombre_persona, b.nombre, a.id_departamento, a.id_rol, c.descripcion 
    from seg_usuario a INNER JOIN cat_departamento b ON a.id_departamento = b.id_departamento INNER JOIN seg_rol c 
    ON a.id_rol = c.id_rol
    AND a.id_brigada = -1 
    AND a.id_rol in (8,9)
    AND case when 0=${req.params.departamento} then a.id_departamento::text ilike '%%' else a.id_departamento = ${req.params.departamento} end
    ORDER BY a.feccre DESC, a.id_usuario ASC;`;
  client.query(text, (err, result) => {
    if (err) {
      throw err;
    } else {

      let actualizadores = result.rows;
      return res.status(200).json({
        ok:true,
        msg:'Actualizadores',
        actualizadores
     })
    }
   })  
}

const modificarUsuarioBrigadaPut = async(req, res) => {
  const id = req.params;
  const query = {
    text: `UPDATE seg_usuario SET id_rol=$1 WHERE id_usuario = ${id.id}`,
    values: [req.body.id_rol],
 }
 await client.query(query, async(err, result) => {
  if (err) {
    throw err;
  } else {
    
    let usuario = await obtieneUsuario(id, err);
    return res.status(200).json({
      ok:true,
      msg:'Usuario actualizado',
      usuario
   })
  }
 })
}
async function obtieneUsuario(id, err){
  const query = {
    text: `Select a.id_usuario, a.login, a.nombre nombre_persona, b.nombre, a.id_departamento, a.id_rol, c.descripcion 
    From seg_usuario a, cat_departamento b, seg_rol c 
    Where a.id_departamento = b.id_departamento 
    AND a.id_rol = c.id_rol 
    AND a.id_usuario = ${id.id}`
 }
   let usuario = await client.query(query);
 return usuario.rows;
}
const agregarBrigadaUsurioPut = async(req, res) =>{
  let datos = req.body;
  let id_brg =req.params.id_brigada;
  let dato_nue = datos.map((e)=>{return `(${id_brg}, ${e})`});
  const query = {
    text: `UPDATE seg_usuario a SET id_brigada = s.id_brigada FROM (VALUES ${dato_nue.join()}) s (id_brigada,id_usuario) WHERE a.id_usuario = s.id_usuario`
}
await client.query(query, async(err, result) => {
  if (err) {
    throw err;
  } else {
    return res.status(200).json({
      ok:true,
      msg:'Usuarios asignados a Brigada.',
      result
   })
  }
 })
}

const asignarTrabajoPost = async(req, res) =>{
  let datos = req.body;
  let valores = [];
  let usuarios = []
  for (const element of datos.trabajo) {
    valores.push(element.id);
  }
  for (const element of datos.usuarios) {
    usuarios.push(element.user);
  }
  let id_manz = bcrypt.hashSync('manz', 2)
  let usucre = req.body.usucre;
  await client.query(`select count(*) as total from (select distinct cod_depto,cod_mpio,mpio,distrito,cod_cd_com,ciu_com,zona,sector
  from ace.bolivia_manzano where id in (SELECT unnest(ARRAY[${valores}]))) as a`, async(err, result) => {
    if (err) {
      throw err;
    } else {
      if((result.rows[0].total)==1){
        await client.query(`INSERT INTO cat_upm(id_departamento, fecinicio,id_proyecto, usucre,semana, urbano_rural,url_pdf,id_provincia, provincia, id_municipio, municipio, id_distrito, codigo_area,tipo_area, id_manzanas, id_ciudad_comunidad, ciudad_comunidad, codigo,zona,sector)
        select distinct cod_depto::integer,'${datos.trabajo[0].fec_inicio.substr(0,10)}'::date,9,'${usucre}',1,case when tipo_area ilike '%A%' then 1 else 2 end,cu.url,cod_prov,prov,cod_mpio,mpio,distrito,case when tipo_area ilike '%A%' then 1 else 2 end,
        case when tipo_area ilike '%A%' then 'AMANZANADO' else 'DISPERSO' end,'${id_manz}',cod_cd_com,ciu_com,'',zona,'${req.body.trabajo[0].sector}'
        from ace.bolivia_manzano 
        join cat_url cu on cu.departamento=cod_depto::integer
        where id in (SELECT unnest(ARRAY[${valores}]))`, async(err, result1) => {
            if (err) {
              throw err;
            } else {
              await client.query(`update cat_upm set codigo=id_departamento||right('0000'||id_upm::text,5) where id_manzanas = '${id_manz}'`, async(err, result2) => {
                  if (err) {
                    throw err;
                  } else {
                    let datoGen = new Date();
                    let gestion = datoGen.getFullYear()
                    let mes =datoGen.getMonth();
                    await client.query(`INSERT INTO ope_asignacion(id_usuario, id_upm, usucre, gestion, mes, fec_inicio, fec_fin) 
                    select id_usuario,(select id_upm from cat_upm where id_manzanas='${id_manz}'),'${usucre}',${gestion},${mes+1},'${datos.trabajo[0].fec_inicio.substr(0,10)+' '+'00:00:00'}','${datos.trabajo[0].fec_fin.substr(0,10)+' '+'00:00:00'}' from seg_usuario where id_usuario in (SELECT unnest(ARRAY[${usuarios}]))`, async(err, result2) => {
                      if (err) {
                        throw err;
                      } else {
                        await client.query(`update ace.bolivia_manzano set id_upm=(select id_upm from cat_upm where id_manzanas='${id_manz}') , estado='ASIGNADO' where id in (SELECT unnest(ARRAY[${valores}]))`, async(err, result2) => {
                          if (err) {
                            throw err;
                          } else {
                            return res.status(200).json({
                              ok:true,
                              msg:'Cargas de trabajo asignadas a brigada',
                            })
                          }
                        });
                      }
                    });
                  }
                });
            }
          });
      } else {
        return res.status(200).json({
          ok: false,
          msg:'No se puede asignar dos sectores en una misma area de Trabajo'
        })
      }  
    }
  }); 
}


const obtenerBrigadasCreadas = async(req, res)=>{
  const text = `select a.id_brigada, b.login, a.codigo_brigada, b.nombre nombre_usuario, b.id_usuario, c.nombre nombre_departamento, c.id_departamento, d.descripcion
    from ope_brigada a, seg_usuario b, cat_departamento c, seg_rol d 
    where a.id_brigada = b.id_brigada 
    AND a.id_departamento = c.id_departamento
    AND b.id_rol = d.id_rol
    AND b.id_rol in (8,9)
    AND a.id_departamento = ${req.params.departamento} ORDER BY a.id_departamento, a.feccre;`
await client.query(text, async(err, result) => {
  if (err) {
    throw err;
  } else {

    let brigadas = result.rows;
    brigadasAsignadas=[];
    let usuarios=[];
    brigadas.forEach((item)=>{
      if(!brigadasAsignadas.hasOwnProperty(item.id_brigada, item.codigo_brigada)){
        brigadasAsignadas[item.id_brigada] = {
          codigo_brigada: item.codigo_brigada,
          id_departamento: item.id_departamento,
          nombre: item.nombre_departamento,
          id_brigada: item.id_brigada,
          usuarios: []
         }
      }
      brigadasAsignadas[item.id_brigada].usuarios.push({
        login:item.login,
        descripcion: item.descripcion,
        nombre: item.nombre_usuario,
        nombre_departamento: item.nombre_departamento,
        id_brigada: item.id_brigada,
        id_usuario: item.id_usuario,
        id_departamento: item.id_departamento
      })
    })

    return res.status(200).json({
      ok:true,
      msg:'Brigadas asignadas',
      brigadasAsignadas
   })
  }
 })
}

const obtenerSector = async(req, res)=>{
  const valor = "'"+req.params.ciu_com.replace(/,/gi, "','")+"'";
  const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
   FROM (SELECT 'Feature' As type
   , ST_AsGeoJSON((geom),15,0)::json As geometry
   , row_to_json((SELECT l FROM (SELECT sector) As l
   )) As properties
   FROM ace.a_sector As lg 
   where cod_depto::integer=${req.params.id_depto}
   and cod_prov::integer=${req.params.id_prov}
   and cod_mpio::integer=${req.params.id_mun}
   and case when '-1'='${req.params.id_distrito}' then 1=1 else cod_ci_com in (SELECT unnest(ARRAY[${valor}])) end
   and case when '-1'='${req.params.id_distrito}' then area_cpv='00' else area_cpv = '${req.params.id_distrito}' end) As f`;
   await client.query(text, async(err, result) => {
     if (err) {
     throw err;
     } else {
       let areas =  result.rows;
     return res.status(200).json({
       ok:true,
       msg:'Areas de trabajo amanzanados',
       areas
     })
     }
     })
}

const obtenerManzanos = async(req, res)=>{
   const valor = "'"+req.params.ciu_com.replace(/,/gi, "','")+"'";
   const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM (SELECT 'Feature' As type
    , ST_AsGeoJSON((geom),15,0)::json As geometry
    , row_to_json((SELECT l FROM (SELECT id, id_upm, depto, cod_depto, tipo_area, prov, cod_prov, mpio, cod_mpio, ciu_com, cod_cd_com, cod_loc, distrito, id_manz,
      orden_manz, cod_ac, zona, sector,
      case when t_viv_ocu is null then 0 else t_viv_ocu end t_viv_ocu,
      case when t_viv_des is null then 0 else t_viv_des end t_viv_des,
      case when total_viv is null then 0 else total_viv end total_viv,
      case when total_pob is null then 0 else total_pob end total_pob, estado, ST_X(ST_CENTROID(geom)) AS latitud, ST_Y(ST_CENTROID(geom)) AS longitud) As l
    )) As properties
    FROM ace.bolivia_manzano As lg 
    where id_upm is null
    and cod_depto::integer=${req.params.id_depto}
    and cod_prov::integer=${req.params.id_prov}
    and cod_mpio::integer=${req.params.id_mun}
    and case when '-1' = '${req.params.id_distrito}' then cod_cd_com='00000' else cod_cd_com in (SELECT unnest(ARRAY[${valor}])) end
    and case when '-1' = '${req.params.id_distrito}' then distrito ilike '%%' else distrito='${req.params.id_distrito}' end 
    and case when '-1' = '${req.params.id_distrito}' then tipo_area='D' else tipo_area='A' end 	
    and estado ='ELABORADO' ORDER BY orden_manz) As f`;
    await client.query(text, async(err, result) => {
      if (err) {
      throw err;
      } else {
        let areas =  result.rows;
      return res.status(200).json({
        ok:true,
        msg:'Areas de trabajo amanzanados',
        areas
      })
      }
      })
}

const obtenerAreasAsignadasAmanzanado = async(req, res)=>{
  const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
   FROM (SELECT 'Feature' As type
   , ST_AsGeoJSON((geom),15,0)::json As geometry
   , row_to_json((SELECT l FROM (SELECT id, id_upm, depto, cod_depto, prov, cod_prov, mpio, cod_mpio, ciu_com, cod_cd_com, cod_loc, distrito, id_manz,
     orden_manz, cod_ac, zona, sector,
     case when t_viv_ocu is null then 0 else t_viv_ocu end t_viv_ocu,
     case when t_viv_des is null then 0 else t_viv_des end t_viv_des,
     case when total_viv is null then 0 else total_viv end total_viv,
     case when total_pob is null then 0 else total_pob end total_pob, 
     estado, ST_X(ST_CENTROID(geom)) AS latitud, ST_Y(ST_CENTROID(geom)) AS longitud) As l
   )) As properties
   FROM ace.bolivia_manzano As lg
   where id_upm=${req.params.id} and estado ='ASIGNADO' ORDER BY orden_manz) As f`;
   await client.query(text, async(err, result) => {
     if (err) {
     throw err;
     } else {
       let areas =  result.rows;
     return res.status(200).json({
       ok:true,
       msg:'Areas de trabajo amanzanados',
       areas
     })
     }
     })
}

const obtenerDistritos = async(req, res)=>{
  const text =`SELECT depto, cod_depto, prov, cod_prov, mpio, cod_mpio, UPPER(rtrim(ciu_com)) as ciu_com, cod_ci_com, area_cpv as distrito, 
  ST_X(ST_CENTROID(geom)) AS latitud, ST_Y(ST_CENTROID(geom)) AS longitud
    FROM ace.a_area_censal WHERE cod_depto::integer=${req.params.id_depto}
	and cod_prov::integer=${req.params.id_prov}
	and cod_mpio::integer=${req.params.id_mun}  
  and cod_ci_com='${req.params.cod}'
	ORDER BY distrito`;
    await client.query(text, async(err, result) => {
      if (err) {
        throw err;
      } else {
        let areas =  result.rows;
      return res.status(200).json({
        ok:true,
        msg:'Areas de trabajo disperso',
        areas
      })
      }
      })
}

const brigadaUltimoGet = async(req, res)=>{
  const query = `SELECT MAX(nro_brigada_depto) AS ultimo
                    FROM ope_brigada ob
                    WHERE id_departamento = ${req.params.id_depto}
                    AND codigo_brigada LIKE '${req.params.des_siglas}%'`
  await client.query(query, async(err, result) => {
    if (!err) {
      return res.status(200).json({
        ok:true,
        msg:'Brigada obtenida',
        resp: result.rows
      })
    } else {
      return res.status(500).json({
        ok:false,
        msg:'Error Interno intente de nuevo'
     })
    }
  })
}
const brigadasPost = async(req, res)=>{
  let datos = req.body.data;
  let dataSave= [];
  datos.forEach(element => {
    dataSave.push(`(${req.body.ciudad_id}, 9,'${element.cod_brigada}',${req.body.usucre},NOW(), ${element.nro_brigada})`);
  });
  let data = dataSave;
  const query = `INSERT INTO ope_brigada(id_departamento, id_proyecto, codigo_brigada, usucre, feccre, nro_brigada_depto) VALUES ${data.join()}`
  await client.query(query, async(err, result) => {
    if (!err) {
      return res.status(200).json({
        ok:true,
        msg:'Brigadas Guardadas, Correctamente.'
      })
    } else {
      return res.status(500).json({
        ok:false,
        msg:'Error Interno intente de nuevo'
     })
    }
  })
}

const listarBrigadasUpm = (req, res) => {
  const query = {
    text: `select distinct ob.*,cd.nombre from cat_upm cu
    join cat_departamento cd on cd.id_departamento=cu.id_departamento
    join ope_asignacion oa on oa.id_upm=cu.id_upm and oa.estado!='ANULADO'
    join seg_usuario su on su.id_usuario=oa.id_usuario
    join ope_brigada ob on ob.id_brigada=su.id_brigada
    where cu.id_upm=${req.params.id}`
  }
  client.query(query, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).send(result.rows);
    }
  })
}

const quitarBrigada = (req, res) => {
  const query = {
    text: `update ope_asignacion set estado='ANULADO' where id_asignacion in
    (select oa.id_asignacion from ope_asignacion oa
    join cat_upm cu on cu.id_upm=oa.id_upm
    join seg_usuario su on su.id_usuario=oa.id_usuario
    where cu.id_upm=${req.body.id_upm} and su.id_brigada=${req.body.id_brigada})`
  }
  client.query(query, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).send(result.rows);
    }
  })
}

const adicionarBrigada = (req, res) => {
  const text = `INSERT INTO public.ope_asignacion(id_usuario, id_upm, usucre, gestion, mes, exportar, revisita, fec_inicio, fec_fin)		  
    select id_usuario,split_part(datos,'|',1)::int,'${req.body.usucre}',split_part(datos,'|',3)::int,split_part(datos,'|',4)::int,
    split_part(datos,'|',5)::int,split_part(datos,'|',6)::int,split_part(datos,'|',7)::timestamp without time zone,split_part(datos,'|',8)::timestamp without time zone from 
    (select id_usuario,(select id_upm||'|'||usucre||'|'||gestion||'|'||mes||'|'||exportar||'|'||revisita||'|'||fec_inicio||'|'||fec_fin from ope_asignacion oa 
    where id_upm=${req.body.id_upm} and exportar>0 order by id_asignacion limit 1) as datos
    from seg_usuario where id_brigada=${req.body.id_brigada}) as a`;
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).send(result.rows);
    }
  })
}

const cambiarFecha = (req, res) => {
  const text = `update ope_asignacion set fec_inicio='${req.body.fec_inicio}'::timestamp without time zone,fec_fin='${req.body.fec_fin}'::timestamp without time zone where id_upm=${req.body.id_upm}`
  console.log(text)
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).json('Fecha Actualizada correctamente');
    }
  })
}

const updatePlan = (req, res) => {
  let text ='';
  const valor = req.body.plan;
  valor.forEach((element)=>{
    text = text + `update ace.bolivia_manzano set estado_plan='ELABORADO',color='${req.body.color}' where id=${element.ids};`
  })
  client.query(text, async (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).json('Datos Actualizados');
    }
  })
}

module.exports = {
    brigadasGet,
    usuariosActualizador,
    modificarUsuarioBrigadaPut,
    agregarBrigadaUsurioPut,
    obtenerBrigadasCreadas,
    asignarTrabajoPost,
    obtenerSector,
    obtenerManzanos,
    obtenerDistritos,
    obtenerAreasAsignadasAmanzanado,
    brigadaUltimoGet,
    brigadasPost,
    listarBrigadasUpm,
    quitarBrigada,
    adicionarBrigada,
    brigadasConsolidadas,
    areasAsignadas,
    usuarioBrigadaId,
    usuarioSinBrigada,
    eliminarBrigadaId,
    adicionarUsuario,
    cambiarFecha,
    updatePlan
  }
