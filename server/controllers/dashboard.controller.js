const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { Pool } = require('pg');
const client = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
client.connect();

const listaDep = async (req, res) => {
    const text = `select distinct cod_depto as codigo,depto as descripcion from ace.a_sector
    where case when '00'='${req.params.idDep}' then cod_depto ilike '%%' else cod_depto='${req.params.idDep}' end
    order by cod_depto`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const listaProv = async (req, res) => {
    const text = `select distinct cod_prov as codigo,prov as descripcion from ace.a_sector where cod_depto='${req.params.idDep}' order by cod_prov`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const listaMun = async (req, res) => {
    const text = `select distinct cod_mpio as codigo,mpio as descripcion from ace.a_sector where cod_depto='${req.params.idDep}' and cod_prov='${req.params.idProv}' order by cod_mpio`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const lista_municipios = async (req, res) => {
    const text = `select distinct cod_depto,cod_prov||cod_mpio as cod_mpio,mpio from ace.bolivia_manzano where 
     case when 0=${req.params.departamento} then cod_depto ilike '%%' else cod_depto::int=${req.params.departamento} end 
    order by cod_depto,cod_mpio`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const graficoInicial = async (req, res) => {
    const text = `WITH cte as (select count(distinct aa.*) filter (where estado='CONCLUIDO') as concluido,
    count(distinct aa.*) filter (where estado!='CONCLUIDO') as proceso from ace.a_sector aa
    join (select * from cat_upm where estado!='ANULADO' and id_departamento::text ilike '%%') bb
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area=substring(bb.tipo_area,1,1)
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad)
    select 'concluido' as estado,concluido as total,'#23B141' as color from cte union all
    select 'proceso',proceso,'#D6B857' from cte union all
    select 'pendiente',sum(sectores_ace)-(select concluido+proceso from cte),'#005FE0' from cartografia.t_municipio_proyeccion`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const departamentoAvance = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT codigo) As l
    )) As properties
    FROM (select codigo,geom from cartografia.car_departamento) As lg ) As f )  As fc;`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const municipioAvance = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT codigo,municipio,total,planificado,concluido,proceso) As l
    )) As properties
    FROM (select a.codigo,a.municipio,a.geom,case when b.codigo is null then -1 else (a.sectores_ace-b.concluido) end as total,
    case when a.sectores_ace is null then 0 else a.sectores_ace end as planificado,
    case when b.concluido is null then 0 else b.concluido end concluido,
    case when b.proceso is null then 0 else b.proceso end proceso from 
    (select cm.codigo,municipio,geom,case when sectores_ace is null then 0 else sectores_ace end sectores_ace from cartografia.car_municipio cm
    left join cartografia.t_municipio_proyeccion cp on cm.codigo=cp.codigo) as a left join 
    (select cod_depto||cod_prov||cod_mpio as codigo,
    count(*) filter (where estado='CONCLUIDO') as concluido,
    count(*) filter (where estado!='CONCLUIDO') as proceso from ace.a_sector aa
    join (select * from cat_upm where estado!='ANULADO' and id_departamento::text ilike '%%') bb
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area=substring(bb.tipo_area,1,1)
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad
    group by cod_depto,cod_prov,cod_mpio) as b on a.codigo=b.codigo) As lg ) As f )  As fc;`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const listaMunicipioAvance = async (req, res) => {
    const text = `select a.codigo,a.municipio,
    case when a.sectores_ace is null then 0 else a.sectores_ace end as planificado,
    case when b.proceso is null then 0 else b.proceso end proceso,
	round(case when a.sectores_ace is null then 0 else (case when b.proceso is null then 0 else b.proceso end*100)/a.sectores_ace end,2) as porcentaje
	from 
    (select cm.codigo,municipio,sectores_ace from cartografia.car_municipio cm
    left join cartografia.t_municipio_proyeccion cp on cm.codigo=cp.codigo
	where cm.codigo ilike '${req.params.idDep}%'
	) as a left join 
    (select cod_depto||cod_prov||cod_mpio as codigo,count(*)filter(where estado='CONCLUIDO') proceso from ace.a_sector aa
    join (select * from cat_upm where estado!='ANULADO') bb
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area=substring(bb.tipo_area,1,1)
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad
    group by cod_depto,cod_prov,cod_mpio) as b on a.codigo=b.codigo
	order by porcentaje desc`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const municipioTabla = async (req, res) => {
    const text = `select a.codigo,nombre,total,inicial,concluido,proceso,latitud,longitud from 
    (select substring(codigo,1,2) codigo,count(*) total,count(*) filter (where total=-1) inicial,
    count(*) filter (where total=0) concluido,count(*) filter (where total>0) proceso from 
    (select a.codigo,case when b.codigo is null then -1 else (a.sectores_ace-b.concluido) end as total from 
    (select cm.codigo,sectores_ace from cartografia.car_municipio cm
    left join cartografia.t_municipio_proyeccion cp on cm.codigo=cp.codigo) as a left join 
    (select cod_depto||cod_prov||cod_mpio as codigo,count(*) filter (where estado='CONCLUIDO') as concluido from ace.a_sector aa
    join (select * from cat_upm where estado!='ANULADO' and id_departamento::text ilike '%%') bb
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area=substring(bb.tipo_area,1,1)
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad
    group by cod_depto,cod_prov,cod_mpio) as b on a.codigo=b.codigo) as a
    group by substring(codigo,1,2)) as a
    join cat_departamento cd on cd.codigo=a.codigo`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const detalleAvance = async (req, res) => {
    const text = `select nombre,planificado,case when disperso is null then 0 else disperso end disperso,case when centro is null then 0 else centro end centro,
    ciudad,avance from 
    (select substring(codigo,1,2) as codigo,
    sum(total)filter(where tipo_area='D') as disperso,
    sum(total)filter(where tipo_area='A' and codigo not in ('010101' ,'020101' ,'020105' ,'030101' ,'040101' ,'050101' ,'060101' ,'070101' ,'080101' ,'090101')) as centro,
    sum(total)filter(where tipo_area='A' and codigo in ('010101' ,'020101' ,'020105' ,'030101' ,'040101' ,'050101' ,'060101' ,'070101' ,'080101' ,'090101')) as ciudad,
    sum(total)filter(where estado='CONCLUIDO') as avance from 
    (select cod_depto||cod_prov||cod_mpio as codigo,aa.tipo_area,estado, count(distinct aa.*) total  from ace.a_sector aa
    join (select * from cat_upm where estado!='ANULADO' and id_departamento::text ilike '%%') bb
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area=substring(bb.tipo_area,1,1)
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad
    group by cod_depto,cod_prov,cod_mpio,aa.tipo_area,estado) as a
    group by substring(codigo,1,2)) as a,
    (select cd.codigo,cd.nombre,sum(sectores_ace) planificado from cat_departamento cd 
    join cartografia.t_municipio_proyeccion ct on ct.i02_depto=cd.codigo
    group by cd.codigo,cd.nombre order by codigo) as b
    where a.codigo=b.codigo`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const avanceAmanzanado = async (req, res) => {
    const text = `select a.codigo,municipio,planificado,concluido from 
    (select distinct cod_depto||cod_prov||cod_mpio as codigo,count(distinct aa.*) concluido from ace.a_sector aa
    join (select id_departamento,id_provincia,id_municipio,id_distrito,zona,sector,id_ciudad_comunidad,estado from cat_upm where estado!='ANULADO' and tipo_area='AMANZANADO') bb
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area='A'
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad
     where cod_prov='01' and (cod_depto!='02' and cod_mpio='01') or (cod_depto='02' and cod_mpio in ('01','05'))
    group by cod_depto,cod_prov,cod_mpio) as a,
    (select codigo,sectores_ace as planificado,upper(mun) as municipio from cartografia.t_municipio_proyeccion 
    where codigo in ('010101' ,'020101' ,'020105' ,'030101' ,'040101' ,'050101' ,'060101' ,'070101' ,'080101' ,'090101')) as b
    where a.codigo=b.codigo`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const avanceUrbano = async (req, res) => {
    const text = `select (select nombre from cat_departamento where codigo=aa.cod_depto),count(distinct aa.*) as planificado
    ,count(distinct aa.*) concluido from ace.a_sector aa
    join (select * from cat_upm where estado!='ANULADO' and tipo_area='AMANZANADO' 
          and municipio not in ('SUCRE','NUESTRA SEÑORA DE LA PAZ','EL ALTO','COCHABAMBA','ORURO','POTOSI','TARIJA','SANTA CRUZ','TRINIDAD','COBIJA')) bb
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area='A'
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad
    group by cod_depto`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const avanceDisperso = async (req, res) => {
    const text = `select (select nombre from cat_departamento where codigo=aa.cod_depto),count(distinct aa.*) as planificado
    ,count(distinct aa.*) concluido from ace.a_sector aa
    join (select * from cat_upm where estado!='ANULADO' and tipo_area='DISPERSO') bb
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area='D'
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad
    group by cod_depto`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const lista_departamento = async (req, res) => {
    let text;
    if(req.params.departamento=='00'){
        text = `SELECT row_to_json(fc)
            FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
            FROM ( SELECT 'Feature' As type
            , ST_AsGeoJSON(lg.geom)::json As geometry
            , row_to_json((SELECT l FROM (SELECT depto,elaborado,concluido,observado) As l
            )) As properties
            FROM (select depto,elaborado,concluido,observado,geom from (select distinct cod_depto,
            count(*) filter (where estado='ELABORADO') as elaborado,
            count(*) filter (where estado='CONCLUIDO') as concluido,
            count(*) filter (where estado='OBSERVADO') as observado from ace.a_sector aa
            join (select * from cat_upm where estado!='ANULADO' and id_departamento::text ilike '%%') bb
            on aa.cod_depto::int=bb.id_departamento
            and aa.cod_prov=bb.id_provincia
            and aa.cod_mpio=bb.id_municipio
            and aa.area_cpv=bb.id_distrito
            and aa.zona=bb.zona
            and aa.tipo_area=substring(bb.tipo_area,1,1)
            and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
            and aa.cod_ci_com=bb.id_ciudad_comunidad
            group by cod_depto) as a
            join (select * from ace.lim_departamento where cod_depto is not null
            and case when '00'='${req.params.departamento}' then cod_depto ilike '%%' else 'cod_depto'='${req.params.departamento}' end) ld on ld.cod_depto=a.cod_depto) As lg ) As f )  As fc;`;
    } else {
        if (req.params.departamento!='00' && req.params.provincia=='00'){
            text = `SELECT row_to_json(fc)
                FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
                FROM ( SELECT 'Feature' As type
                , ST_AsGeoJSON(lg.geom)::json As geometry
                , row_to_json((SELECT l FROM (SELECT depto,elaborado,concluido,observado) As l
                )) As properties
                FROM (select upper(provincia) as depto,
                case when elaborado is null then 0 else elaborado end elaborado,
                case when concluido is null then 0 else concluido end concluido,
                case when observado is null then 0 else observado end observado,geom from 
                (select * from cartografia.car_provincia where codigo_departamento::int=${req.params.departamento}) cc
                left join (select distinct cod_depto,cod_prov,
                count(*) filter (where estado='ELABORADO') as elaborado,
                count(*) filter (where estado='CONCLUIDO') as concluido,
                count(*) filter (where estado='OBSERVADO') as observado from ace.a_sector aa
                    join (select * from cat_upm where estado!='ANULADO' and id_departamento=${req.params.departamento}) bb
                    on aa.cod_depto::int=bb.id_departamento
                    and aa.cod_prov=bb.id_provincia
                    and aa.cod_mpio=bb.id_municipio
                    and aa.area_cpv=bb.id_distrito
                    and aa.zona=bb.zona
                    and aa.tipo_area=substring(bb.tipo_area,1,1)
                    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
                    and aa.cod_ci_com=bb.id_ciudad_comunidad
                group by cod_depto,cod_prov) as a
                on a.cod_depto=cc.codigo_departamento and a.cod_prov=cc.codigo_provincia) As lg ) As f )  As fc;`;
        } else {
            text = `SELECT row_to_json(fc)
                FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
                FROM ( SELECT 'Feature' As type
                , ST_AsGeoJSON(lg.geom)::json As geometry
                , row_to_json((SELECT l FROM (SELECT depto,elaborado,concluido,observado) As l
                )) As properties
                FROM (select upper(municipio) as depto,
                case when elaborado is null then 0 else elaborado end elaborado,
                case when concluido is null then 0 else concluido end concluido,
                case when observado is null then 0 else observado end observado,geom from 
                (select * from cartografia.car_municipio where codigo_departamento='${req.params.departamento}' and codigo_provincia='${req.params.provincia}') cc
                left join (select distinct cod_depto,cod_prov,cod_mpio,
                 count(*) filter (where estado='ELABORADO') as elaborado,
                 count(*) filter (where estado='CONCLUIDO') as concluido,
                 count(*) filter (where estado='OBSERVADO') as observado from ace.a_sector aa
                    join (select * from cat_upm where estado!='ANULADO' and id_departamento='${req.params.departamento}' and id_provincia='${req.params.provincia}') bb
                    on aa.cod_depto::int=bb.id_departamento
                    and aa.cod_prov=bb.id_provincia
                    and aa.cod_mpio=bb.id_municipio
                    and aa.area_cpv=bb.id_distrito
                    and aa.zona=bb.zona
                    and aa.tipo_area=substring(bb.tipo_area,1,1)
                    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
                    and aa.cod_ci_com=bb.id_ciudad_comunidad
                group by cod_depto,cod_prov,cod_mpio) as a
                on a.cod_depto=cc.codigo_departamento and a.cod_prov=cc.codigo_provincia and a.cod_mpio=cc.codigo_municipio) As lg ) As f )  As fc;`;
        }        
    }
    
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const listaDistrito = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT depto,prov,mpio,ciu_com) As l
    )) As properties
    FROM (select * from ace.lim_a_distrito where cod_depto='${req.params.idDep}' 
    and cod_prov='${req.params.idProv}'
    and cod_mpio='${req.params.idMun}') As lg ) As f )  As fc;`
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const listaAreaCensal = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT codigo) As l
    )) As properties
    FROM (select area_cpv as codigo,geom from ace.a_area_censal where cod_depto||cod_prov||cod_mpio||cod_ci_com='${req.params.codigo}' 
    order by area_cpv) As lg ) As f )  As fc;`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const listaZonaCensal = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT codigo,area_cpv) As l
    )) As properties
    FROM (select zona as codigo,area_cpv,geom from ace.a_zona_censal where cod_depto||cod_prov||cod_mpio||cod_ci_com='${req.params.codigo}' order by zona) As lg ) As f )  As fc;`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const listaManzanaCensal = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT id,depto,prov,mpio,ciu_com,distrito,zona,sector,id_manz,orden_manz,t_viv_ocu,t_viv_des,t_viv_col,total_viv,total_pob,estado,color) As l
    )) As properties
    FROM (select id,depto,prov,mpio,ciu_com,distrito,zona,sector,id_manz,orden_manz,
        case when t_viv_ocu is null then 0 else t_viv_ocu end t_viv_ocu,
        case when t_viv_des is null then 0 else t_viv_des end t_viv_des,
        case when t_viv_col is null then 0 else t_viv_col end t_viv_col,
        case when total_viv is null then 0 else total_viv end total_viv,
        case when total_pob is null then 0 else total_pob end total_pob,
        case when estado_plan is not null then 1 else 0 end estado,color,geom 
        from ace.bolivia_manzano where 
        cod_depto='${req.params.depto}' and cod_prov='${req.params.prov}' and cod_mpio='${req.params.mpio}' and cod_cd_com='${req.params.ciu}' 
        and tipo_area='${req.params.area}') As lg ) As f )  As fc;`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const listaComunidadCensal = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT ciu_com,localidad) As l
    )) As properties
    FROM (select ciu_com,localidad,geom from municipio.comunidades where cod_depto||cod_prov||cod_mpio='${req.params.codigo}') As lg ) As f )  As fc;`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const equipamientoCensal = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT cod_tipo,nomb_equip) As l
    )) As properties
    FROM (	select cod_tipo,nomb_equip,geom from ace.cb_a_equipamiento where con_dist ilike '${req.params.codigo}%'
    and cod_tipo in (select codigo from cat_catalogo where catalogo='cat_simbologia' and estado='ELABORADO')) As lg ) As f )  As fc;`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}


const listaAreas = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT ciudad,estado,zona,sector,color) As l
    )) As properties
    FROM (select case when aa.ciu_com is null then 'DISPERSO' else aa.ciu_com end ciudad,
        aa.geom,aa.zona,aa.sector,case when string_agg(distinct cu.estado,',') is null then 'SIN ASIGNAR'
    when string_agg(distinct cu.estado,',')='ELABORADO' then 'EN PROCESO' else string_agg(distinct cu.estado,',') end estado,
    case when string_agg(distinct cu.estado,',') is null then '#3D70B1'	when string_agg(distinct cu.estado,',')='ELABORADO' then '#D6B857' 
    when string_agg(distinct cu.estado,',')='OBSERVADO' then '#EB4C4C' else '#23B141' end color from ace.a_sector aa 
    join ace.bolivia_manzano bb 
    on aa.cod_depto=bb.cod_depto 
    and aa.cod_prov=bb.cod_prov 
    and aa.cod_mpio=bb.cod_mpio 
    and aa.area_cpv=bb.distrito 
    and aa.zona=bb.zona 
    and aa.tipo_area=bb.tipo_area
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.cod_cd_com
    left join cat_upm cu on cu.id_upm=bb.id_upm
    where bb.cod_depto='${req.params.idDep}' and bb.cod_prov='${req.params.idProv}' and bb.cod_mpio='${req.params.idMun}'
    group by aa.ciu_com,aa.geom,aa.zona,aa.sector) As lg ) As f )  As fc;`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const listaAreas1 = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM ( SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom)::json As geometry
    , row_to_json((SELECT l FROM (SELECT sector) As l
    )) As properties
    FROM (select geom,sector from ace.a_sector bb 
        where bb.cod_depto='${req.params.idDep}' and bb.cod_prov='${req.params.idProv}' 
        and bb.cod_mpio='${req.params.idMun}' and bb.cod_ci_com='${req.params.idCod}') As lg ) As f )  As fc;`;
        
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const listaDatos = async (req, res) => {
    const text = `WITH table_1 AS
    (select case when estado='ELABORADO' then 'EN PROCESO' when estado='CONCLUIDO' then 'APROBADO' else estado end estado, count(distinct aa.*) AS total,
    case when estado='ELABORADO' then '#D6B857' when estado='OBSERVADO' then '#EB4C4C' else '#23B141' end color from ace.a_sector aa
    join (select * from cat_upm where estado!='ANULADO'
        and case when '00'='${req.params.idDep}' then id_departamento::text ilike '%%' else id_departamento='${parseInt(req.params.idDep)}' end
        and case when '00'='${req.params.idProv}' then id_provincia::text ilike '%%' else id_provincia='${req.params.idProv}' end
        and case when '00'='${req.params.idMun}' then id_municipio::text ilike '%%' else id_municipio='${req.params.idMun}' end) bb
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area=substring(bb.tipo_area,1,1)
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad
    group by estado)
    select * from table_1 union all
    select 'SIN ASIGNAR',sum(sectores_ace)-(select sum(total) from table_1) AS total,'#3D70B1' as color from cartografia.t_municipio_proyeccion where
    case when '00'='${req.params.idDep}' then codigo ilike '%%' 
         when '00'!='${req.params.idDep}' and '00'='${req.params.idProv}' then codigo ilike '${req.params.idDep}%' 
         when '00'!='${req.params.idDep}' and '00'!='${req.params.idProv}' and '00'='${req.params.idMun}' then codigo ilike '${req.params.idDep}${req.params.idProv}%' 
         else codigo ilike '${req.params.idDep}${req.params.idProv}${req.params.idMun}' end`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}


const listaPareto = async (req, res) => {
    let text;
    if (req.params.idDep=='00' && req.params.idProv=='00' && req.params.idMun=='00') {
        text = `select nombre as depto,sum as total,case when count is null then 0 else count end as avanzado from
        (select cd.codigo,nombre,sum(case when sectores_ace is null then total_gral else sectores_ace end) from cartografia.t_municipio_proyeccion tm 
        join cat_departamento cd on cd.codigo=tm.i02_depto group by cd.codigo,nombre)  as a
        left join (select cod_depto,depto,count(distinct aa.*) from ace.a_sector aa
        join (select * from cat_upm where estado NOT IN ('ELABORADO','ANULADO','OBSERVADO')) bb
        on aa.cod_depto::int=bb.id_departamento
        and aa.cod_prov=bb.id_provincia
        and aa.cod_mpio=bb.id_municipio
        and aa.area_cpv=bb.id_distrito
        and aa.zona=bb.zona
        and aa.tipo_area=substring(bb.tipo_area,1,1)
        and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
        and aa.cod_ci_com=bb.id_ciudad_comunidad
        group by cod_depto,depto) as b
        on a.codigo=b.cod_depto order by codigo`;
    } else {
        if(req.params.idDep!='00' && req.params.idProv=='00' && req.params.idMun=='00'){
            text = `select prov as depto,count(distinct aa.*) as total,count(distinct aa.*) filter(where estado='CONCLUIDO') as avanzado from ace.a_sector aa
            left join (select * from cat_upm where estado NOT IN ('ELABORADO','ANULADO','OBSERVADO')
            and case when '00'='${req.params.idDep}' then id_departamento::text ilike '%%' else id_departamento='${parseInt(req.params.idDep)}' end
            and case when '00'='${req.params.idProv}' then id_provincia::text ilike '%%' else id_provincia='${req.params.idProv}' end
            and case when '00'='${req.params.idMun}' then id_municipio::text ilike '%%' else id_municipio='${req.params.idMun}' end) bb
            on aa.cod_depto::int=bb.id_departamento
            and aa.cod_prov=bb.id_provincia
            and aa.cod_mpio=bb.id_municipio
            and aa.area_cpv=bb.id_distrito
            and aa.zona=bb.zona
            and aa.tipo_area=substring(bb.tipo_area,1,1)
            and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
            and aa.cod_ci_com=bb.id_ciudad_comunidad
            where case when '00'='${req.params.idDep}' then cod_depto ilike '%%' else cod_depto='${req.params.idDep}' end
			and case when '00'='${req.params.idProv}' then cod_prov ilike '%%' else cod_prov='${req.params.idProv}' end
			and case when '00'='${req.params.idMun}' then cod_mpio ilike '%%' else cod_mpio='${req.params.idMun}' end  
            group by prov`;
        } else {
            if(req.params.idDep!='00' && req.params.idProv!='00' && req.params.idMun=='00'){
                text = `select mpio as depto,count(distinct aa.*) as total,count(distinct aa.*) filter(where estado='CONCLUIDO') as avanzado from ace.a_sector aa
                left join (select * from cat_upm where estado NOT IN ('ELABORADO','ANULADO','OBSERVADO')
                and case when '00'='${req.params.idDep}' then id_departamento::text ilike '%%' else id_departamento='${parseInt(req.params.idDep)}' end
                and case when '00'='${req.params.idProv}' then id_provincia::text ilike '%%' else id_provincia='${req.params.idProv}' end
                and case when '00'='${req.params.idMun}' then id_municipio::text ilike '%%' else id_municipio='${req.params.idMun}' end) bb
                on aa.cod_depto::int=bb.id_departamento
                and aa.cod_prov=bb.id_provincia
                and aa.cod_mpio=bb.id_municipio
                and aa.area_cpv=bb.id_distrito
                and aa.zona=bb.zona
                and aa.tipo_area=substring(bb.tipo_area,1,1)
                and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
                and aa.cod_ci_com=bb.id_ciudad_comunidad
                where case when '00'='${req.params.idDep}' then cod_depto ilike '%%' else cod_depto='${req.params.idDep}' end
                and case when '00'='${req.params.idProv}' then cod_prov ilike '%%' else cod_prov='${req.params.idProv}' end
                and case when '00'='${req.params.idMun}' then cod_mpio ilike '%%' else cod_mpio='${req.params.idMun}' end  
                group by mpio`;
            }
            else {
                text = `select 'AREA DISPERSA\nDEL MUNICIPIO' as depto,count(distinct aa.*) as total,count(distinct aa.*) filter(where estado='CONCLUIDO') as avanzado from ace.a_sector aa
                left join (select * from cat_upm where estado NOT IN ('ELABORADO','ANULADO','OBSERVADO')
                and case when '00'='${req.params.idDep}' then id_departamento::text ilike '%%' 
                else id_departamento||id_provincia||id_municipio='${parseInt(req.params.idDep)+req.params.idProv+req.params.idMun}' end) bb
                on aa.cod_depto::int=bb.id_departamento
                and aa.cod_prov=bb.id_provincia
                and aa.cod_mpio=bb.id_municipio
                and aa.area_cpv=bb.id_distrito
                and aa.zona=bb.zona
                and aa.tipo_area=substring(bb.tipo_area,1,1)
                and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
                and aa.cod_ci_com=bb.id_ciudad_comunidad
                where aa.tipo_area='D' and case when '00'='${req.params.idDep}' then cod_depto ilike '%%' else cod_depto||cod_prov||cod_mpio='${req.params.idDep+req.params.idProv+req.params.idMun}' end 
                union all
                select ciu_com as depto,count(*) as total,count(*) filter(where estado='CONCLUIDO') as avanzado from ace.a_sector aa
                left join (select * from cat_upm where estado NOT IN ('ELABORADO','ANULADO','OBSERVADO')
                and case when '00'='${req.params.idDep}' then id_departamento::text ilike '%%' 
                else id_departamento||id_provincia||id_municipio='${parseInt(req.params.idDep)+req.params.idProv+req.params.idMun}' end and tipo_area!='DISPERSO') bb
                on aa.cod_depto::int=bb.id_departamento
                and aa.cod_prov=bb.id_provincia
                and aa.cod_mpio=bb.id_municipio
                and aa.area_cpv=bb.id_distrito
                and aa.zona=bb.zona
                and aa.tipo_area=substring(bb.tipo_area,1,1)
                and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
                and aa.cod_ci_com=bb.id_ciudad_comunidad
                where aa.tipo_area!='D' and case when '00'='${req.params.idDep}' then cod_depto ilike '%%' else cod_depto||cod_prov||cod_mpio='${req.params.idDep+req.params.idProv+req.params.idMun}' end 
                group by ciu_com`;
            }    
        }    
    }  
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const presentacionFechaId = async (req, res) => {
    const text = `select extract(week from ei.feccre::date) as date,min(ei.feccre::date)||' al '||max(ei.feccre::date) as intervalo,count(*) as value from ope_asignacion oa
    join enc_informante ei on ei.id_asignacion=oa.id_asignacion and oa.estado!='ANULADO' and ei.estado!='ANULADO'
    join cat_upm cu on cu.id_upm=oa.id_upm and cu.estado!='ANULADO'
    where case when '00'='${req.params.idDep}' then cu.id_departamento::text ilike '%%' else cu.id_departamento='${parseInt(req.params.idDep)}' end
    and case when '00'='${req.params.idProv}' then cu.id_provincia::text ilike '%%' else cu.id_provincia='${req.params.idProv}' end
    and case when '00'='${req.params.idMun}' then cu.id_municipio::text ilike '%%' else cu.id_municipio='${req.params.idMun}' end
    group by  extract(week from ei.feccre::date) order by 1`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const listaCurva = async (req, res) => {
    const text = `select fecmod as fecha,intervalo,sum(count) OVER (ORDER BY fecmod) as total from 
    (select extract(week from bb.fecmod::date) as fecmod, min(fecmod::date)||' al '||max(fecmod::date) as intervalo,count(*) from ace.a_sector aa
    join (select * from cat_upm where estado NOT IN ('ELABORADO','ANULADO','OBSERVADO')
        and case when '00'='${req.params.idDep}' then id_departamento::text ilike '%%' else id_departamento='${parseInt(req.params.idDep)}' end
        and case when '00'='${req.params.idProv}' then id_provincia::text ilike '%%' else id_provincia='${req.params.idProv}' end
        and case when '00'='${req.params.idMun}' then id_municipio::text ilike '%%' else id_municipio='${req.params.idMun}' end) bb 
    on aa.cod_depto::int=bb.id_departamento
    and aa.cod_prov=bb.id_provincia
    and aa.cod_mpio=bb.id_municipio
    and aa.area_cpv=bb.id_distrito
    and aa.zona=bb.zona
    and aa.tipo_area=substring(bb.tipo_area,1,1)
    and case when bb.sector ilike '%-%' then aa.sector::int BETWEEN split_part(bb.sector,'-',1)::int AND split_part(bb.sector,'-',2)::int else aa.sector=bb.sector end
    and aa.cod_ci_com=bb.id_ciudad_comunidad
    group by extract(week from bb.fecmod::date) order by fecmod asc) as a
	where fecmod is not null
    group by fecmod,intervalo,count`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { 
            return res.status(200).json(result.rows); 
        }
    })
}

const lista_provincia = async (req, res) => {
    const text = `select distinct depto,cod_depto,prov,cod_prov,mpio,cod_mpio,depto||' - '||prov||' - '||mpio as descripcion from ace.bolivia_manzano
    where  case when 0=${req.params.codigo} then cod_depto ilike '%%' else cod_depto::int=${req.params.codigo} end and id_upm is not null
    group by depto,cod_depto,prov,cod_prov,mpio,cod_mpio,ciu_com,cod_cd_com
    order by depto||' - '||prov||' - '||mpio`
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const lista_municipio = async (req, res) => {
    const text = `select distinct depto||' - '||prov||' - '||mpio as descripcion,cod_depto,cod_prov,cod_mpio from ace.lim_municipio where cod_depto is not null
    order by depto||' - '||prov||' - '||mpio`
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const lista_ciudades = async (req, res) => {
    let text 
    if(req.params.area==1){
        text = `select distinct '0'||cu.id_departamento::text as cod_depto,id_provincia as cod_prov,id_municipio as cod_mpio,
		string_agg(distinct id_ciudad_comunidad,',') as cod_ci_com,
		cd.nombre||' - '||provincia||' - '||municipio||' - '||ciudad_comunidad as descripcion from cat_upm cu 
		join cat_departamento cd on cu.id_departamento=cd.id_departamento
		where case when 0=${req.params.departamento} then cu.id_departamento::text ilike '%%' else cu.id_departamento::int=${req.params.departamento} end 
        and case when 1=${req.params.area} then tipo_area='AMANZANADO' else tipo_area='DISPERSO' end
		group by cd.nombre,cu.id_departamento,provincia,id_provincia,municipio,id_municipio,ciudad_comunidad,id_ciudad_comunidad
        order by cd.nombre||' - '||provincia||' - '||municipio||' - '||ciudad_comunidad`;
        
    } else {
        text = `select distinct '0'||cu.id_departamento::text as cod_depto,id_provincia as cod_prov,id_municipio as cod_mpio,
		string_agg(distinct id_ciudad_comunidad,',') as cod_ci_com,
		cd.nombre||' - '||provincia||' - '||municipio as descripcion from cat_upm cu 
		join cat_departamento cd on cu.id_departamento=cd.id_departamento
		where case when 0=${req.params.departamento} then cu.id_departamento::text ilike '%%' else cu.id_departamento::int=${req.params.departamento} end 
        and case when 1=${req.params.area} then tipo_area='AMANZANADO' else tipo_area='DISPERSO' end
		group by cd.nombre,cu.id_departamento,provincia,id_provincia,municipio,id_municipio
		order by cd.nombre||' - '||provincia||' - '||municipio`;
    }
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const ciudadesAsignacion = async (req, res) => {
    let text;
    text = `select distinct depto,cod_depto,prov,cod_prov,mpio,cod_mpio, 
        depto||' - '||mpio as cod_DeptoCiudad,depto||' - '||prov||' - '||mpio as descripcion from ace.a_sector
        where case when 0=${req.params.departamento} then cod_depto ilike '%%' else cod_depto::int=${req.params.departamento} end 
        order by depto||' - '||prov||' - '||mpio`;
    /*if(req.params.area==1){
        text = `select distinct depto,cod_depto,prov,cod_prov,mpio,cod_mpio,cod_ci_com as cod_ci_com, 
        depto||' - '||mpio as cod_DeptoCiudad,depto||' - '||prov||' - '||mpio||' - '||ciu_com as descripcion from ace.a_sector
        where case when 0=${req.params.departamento} then cod_depto ilike '%%' else cod_depto::int=${req.params.departamento} end 
        and tipo_area='A' order by depto||' - '||prov||' - '||mpio||' - '||ciu_com`;
    } else {
        text = `select distinct depto,cod_depto,prov,cod_prov,mpio,cod_mpio,cod_ci_com as cod_ci_com, 
        depto||' - '||mpio as cod_DeptoCiudad,depto||' - '||prov||' - '||mpio as descripcion from ace.a_sector
        where case when 0=${req.params.departamento} then cod_depto ilike '%%' else cod_depto::int=${req.params.departamento} end 
        and tipo_area='D' order by depto||' - '||prov||' - '||mpio`;
    }*/
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const ciudadesAsignacion1 = async (req, res) => {
    let text;
    if(req.params.area==1){
        text = `select distinct depto,cod_depto,prov,cod_prov,mpio,cod_mpio,cod_ci_com as cod_ci_com, 
        depto||' - '||mpio as cod_DeptoCiudad,depto||' - '||prov||' - '||mpio||' - '||ciu_com as descripcion from ace.a_sector
        where case when 0=${req.params.departamento} then cod_depto ilike '%%' else cod_depto::int=${req.params.departamento} end 
        and tipo_area='A' order by depto||' - '||prov||' - '||mpio||' - '||ciu_com`;
    } else {
        text = `select distinct depto,cod_depto,prov,cod_prov,mpio,cod_mpio,cod_ci_com as cod_ci_com, 
        depto||' - '||mpio as cod_DeptoCiudad,depto||' - '||prov||' - '||mpio as descripcion from ace.a_sector
        where case when 0=${req.params.departamento} then cod_depto ilike '%%' else cod_depto::int=${req.params.departamento} end 
        and tipo_area='D' order by depto||' - '||prov||' - '||mpio`;
    }
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}


const lista_distrito = async (req, res) => {
    const text = `SELECT id, depto, cod_depto, prov, cod_prov, mpio, cod_mpio, ciu_com, UPPER(rtrim(cod_ci_com)) as cod_ci_com, distrito,ST_X(ST_CENTROID(geom)) AS latitud, ST_Y(ST_CENTROID(geom)) AS longitud
        FROM ace.lim_a_distrito
        where cod_depto::integer=${req.params.id_depto}
        and cod_prov::integer=${req.params.id_prov}
        and cod_mpio::integer=${req.params.id_mun}
        and cod_ci_com='${req.params.id_ci_com}'
        order by distrito`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}
const shape_distrito_seleccionado = async (req, res) => {
    const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
        FROM (SELECT 'Feature' As type
        , ST_AsGeoJSON((geom),15,0)::json As geometry
        , row_to_json((SELECT l FROM (SELECT id, depto, cod_depto, prov, cod_prov, mpio, cod_mpio, ciu_com, UPPER(rtrim(cod_ci_com)) as cod_ci_com, distrito,ST_X(ST_CENTROID(geom)) AS latitud, ST_Y(ST_CENTROID(geom)) AS longitud) As l)) As properties
        FROM ace.lim_a_distrito As lg 
        where cod_depto::integer=${req.params.id_depto}
        and cod_prov::integer=${req.params.id_prov}
        and cod_mpio::integer=${req.params.id_mun}
        and case when '-1'='${req.params.id_distrito}' then cod_ci_com='00000' else cod_ci_com='${req.params.id_ci_com}' end 
        and case when '-1'='${req.params.id_distrito}' then distrito='00' else distrito = '${req.params.id_distrito}' end
        ) As f`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const shapeManzanasArea = async (req, res) => {
    let tipo;
    if (req.params.tipo==1){
    tipo='A';
    } else {
    tipo='D';
    }
const text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
FROM (SELECT 'Feature' As type
, ST_AsGeoJSON((geom),15,0)::json As geometry
, row_to_json((SELECT l FROM (SELECT depto, cod_depto, prov, cod_prov, mpio, cod_mpio, ciu_com, cod_cd_com, cod_loc, distrito, 
        orden_manz as id_manz, cod_ac, t_viv_ocu, t_viv_des, total_viv, total_pob, estado) As l
)) As properties
FROM (select geom,depto, cod_depto, prov, cod_prov, mpio, cod_mpio, ciu_com, cod_cd_com, cod_loc, distrito, 
        id_manz, orden_manz, cod_ac, t_viv_ocu, t_viv_des, total_viv, total_pob, estado from ace.bolivia_manzano 
        where case when 0=${req.params.sw} then cod_depto||cod_prov||cod_mpio||distrito||cod_cd_com='${req.params.id}' else id_upm=${req.params.id} end
        and tipo_area='${tipo}') As lg) As f`;
client.query(text, async (err, result) => {
    if (err) { throw err; } else { return res.status(200).json(result.rows); }
})
}  

const shapePuntos = async (req, res) => {
    let text;
    let tipo;
      if (req.params.tipo==1){
        tipo='AMANZANADO';
      } else {
        tipo='DISPERSO';
      }
    if (req.params.sw==0){
        text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
            FROM (SELECT 'Feature' As type
            , ST_AsGeoJSON((punto),15,0)::json As geometry
            , row_to_json((SELECT l FROM (SELECT id, tipo_formulario, orden_predio, estado,  usuario, lado_manzana,
            case when tipo_formulario='F2' then '#FF0000'
            when formulario='1' and estado='CONCLUIDO' then '#0E8C06'
            when formulario='1' and estado='PRECONCLUIDO' then '#fffb00'
            when formulario='1' and estado='ELABORADO' then '#278CF8'
            when formulario='2' and estado='FINALIZADO' then '#0E8C06'
            when formulario='2' and estado in ('CONCLUIDO','PRECONCLUIDO') then '#278CF8' end color,
            case when formulario='2' then 'E' else '' end as letra , punto) As l
            )) As properties
            FROM (select ei.id_asignacion||'|'||ei.correlativo as id,su.nombre as usuario,ee.respuesta as orden_predio,ee1.respuesta as lado_manzana,
            CASE WHEN (ee2.codigo_respuesta ~~* '%2%'::text) THEN 2 ELSE 1 END AS formulario,ei.estado,
            CASE WHEN (ei.correlativo <= 0) THEN 'F4A'::text
            WHEN (ee.id_pregunta = 36870) THEN 'F4'::text
            WHEN (ee.id_pregunta = 36947) THEN 'F2'::text
            WHEN (ee.id_pregunta = 36848) THEN 'F3'::text ELSE NULL::text END AS tipo_formulario,
            st_setsrid(st_point(split_part(ei.codigo::text,',', 2)::double precision, split_part(ei.codigo::text,',', 1)::double precision), 4326) AS punto 
            from enc_informante ei 
            join cat_upm cu on cu.id_upm=ei.id_upm
            join seg_usuario su on su.id_usuario=ei.id_usuario
            join enc_encuesta ee ON ei.id_asignacion = ee.id_asignacion AND ei.correlativo = ee.correlativo AND ee.id_pregunta in (36848, 36873) AND ee.visible = true
            left join enc_encuesta ee1 ON ei.id_asignacion = ee1.id_asignacion AND ei.correlativo = ee1.correlativo AND ee1.id_pregunta in (36872) AND ee1.visible = true
            left join enc_encuesta ee2 ON ei.id_asignacion = ee2.id_asignacion AND ei.correlativo = ee2.correlativo AND ee2.id_pregunta in (36879) AND ee2.visible = true
            left join enc_encuesta ee3 ON ei.id_asignacion = ee3.id_asignacion AND ei.correlativo = ee3.correlativo AND ee3.id_pregunta in (36947, 36846, 36870) AND ee3.visible = true
            where ei.estado!='ANULADO' and cu.estado!='ANULADO' and cu.tipo_area='${tipo}'
            and case when 0=${req.params.sw} then cu.id_departamento::text||cu.id_provincia||cu.id_municipio||cu.id_distrito||cu.id_ciudad_comunidad='${req.params.id}'
            else cu.id_upm=${req.params.id} end) As lg) As f`;
    } else {
        text = `SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
            FROM (SELECT 'Feature' As type
            , ST_AsGeoJSON((punto),15,0)::json As geometry
            , row_to_json((SELECT l FROM (SELECT id, tipo_formulario, orden_predio, estado,  usuario, lado_manzana,
            case when tipo_formulario='F2' then '#FF0000'
            when formulario='1' and estado='CONCLUIDO' then '#0E8C06'
            when formulario='1' and estado='PRECONCLUIDO' then '#fffb00'
            when formulario='1' and estado='ELABORADO' then '#278CF8'
            when formulario='2' and estado='FINALIZADO' then '#0E8C06'
            when formulario='2' and estado in ('CONCLUIDO','PRECONCLUIDO') then '#278CF8' end color,
            case when formulario='2' then 'E' else '' end as letra , punto) As l
            )) As properties
            FROM (select ei.id_asignacion||'|'||ei.correlativo as id,(select nombre from seg_usuario where id_usuario=ei.id_usuario) as usuario,
            ee.respuesta as orden_predio,ee1.respuesta as lado_manzana,
           CASE WHEN (ee2.codigo_respuesta ~~* '%2%'::text) THEN 2 ELSE 1 END AS formulario,ei.estado,
           CASE WHEN (ei.correlativo <= 0) THEN 'F4A'::text
           WHEN (ee.id_pregunta = 36870) THEN 'F4'::text
           WHEN (ee.id_pregunta = 36947) THEN 'F2'::text
           WHEN (ee.id_pregunta = 36848) THEN 'F3'::text ELSE NULL::text END AS tipo_formulario,
       st_setsrid(st_point(split_part(ei.codigo::text,',', 2)::double precision, split_part(ei.codigo::text,',', 1)::double precision), 4326) AS punto
       from (select * from enc_informante where id_upm=${req.params.id} and estado!='ANULADO') as ei
       join enc_encuesta ee ON ee.id_asignacion=ei.id_asignacion AND ee.correlativo=ei.correlativo AND ee.id_pregunta in (36848, 36873) AND ee.visible = true
       left join enc_encuesta ee1 ON ee1.id_asignacion=ei.id_asignacion AND ee1.correlativo=ei.correlativo AND ee1.id_pregunta in (36872) AND ee1.visible = true
       left join enc_encuesta ee2 ON ee2.id_asignacion=ei.id_asignacion AND ee2.correlativo=ei.correlativo AND ee2.id_pregunta in (36879) AND ee2.visible = true
       left join enc_encuesta ee3 ON ee3.id_asignacion=ei.id_asignacion AND ee3.correlativo=ei.correlativo AND ee3.id_pregunta in (36947, 36846, 36870) AND ee3.visible = true) As lg) As f`;
    }        
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const infoDistritos = async (req, res) => {
    const text = `SELECT distinct id_upm,codigo from cat_upm 
    where id_departamento=${req.params.id_depto}
    and id_provincia::integer=${req.params.id_prov}
    and id_municipio::integer=${req.params.id_mun}
    and case when 1 = ${req.params.tipo_area}  then id_ciudad_comunidad ='${req.params.codigo}' else id_ciudad_comunidad='00000' end
    and case when 1 = ${req.params.tipo_area}  then id_distrito ='${req.params.id_distrito}' else id_distrito='00' end
    and case when 1 = ${req.params.tipo_area}  then tipo_area ='AMANZANADO' else tipo_area ='DISPERSO' end
    order by codigo`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const tablaViviendas = async (req, res) => {
    const text = `select b.id_upm,a.codigo,b.depto, b.prov,b.mpio,b.area_cpv,b.cod_ci_com,b.zona,b.sector,distrito as area,total_viv,total,fecha from 
    (select ei.id_upm,cu.codigo,cu.fecmod as fecha,count(*) as total from cat_upm cu
    join enc_informante ei on cu.id_upm=ei.id_upm and cu.id_departamento!=3
    join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.visible=true and ee.id_pregunta in (36877,36850)
    where cu.estado='CONCLUIDO' and ei.estado!='ANULADO' group by ei.id_upm,cu.codigo,cu.fecmod) as a,
    (select id_upm,aa.depto, aa.prov,aa.mpio,aa.area_cpv,aa.cod_ci_com,aa.zona,aa.sector,bb.distrito,sum(t_viv_ocu) as t_viv_ocu,sum(t_viv_des) as t_viv_des,sum(total_viv) as total_viv from ace.a_sector aa 
    join ace.bolivia_manzano bb on aa.cod_depto=bb.cod_depto and bb.id_upm is not null
    and aa.cod_prov=bb.cod_prov 
    and aa.cod_mpio=bb.cod_mpio 
    and aa.area_cpv=bb.distrito 
    and aa.cod_ci_com=bb.cod_cd_com
    and aa.zona=bb.zona 
    and aa.tipo_area=bb.tipo_area
    and aa.sector in (select unnest(('{'||replace(bb.sector,'-',',')||'}')::text[]))
    where case when 0=${req.params.id} then aa.cod_depto ilike '%%' else aa.cod_depto::integer=${req.params.id} end
    group by id_upm,aa.depto, aa.prov,aa.mpio,aa.area_cpv,aa.cod_ci_com,aa.zona,aa.sector,bb.distrito) as b
    where a.id_upm=b.id_upm
    order by 2,3,4,zona,sector`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const tablaViviendasList = async (req, res) => {
    const text = `select b.id_upm,a.codigo,b.depto, b.prov,b.mpio,b.area_cpv,b.ciu_com,b.cod_ci_com,b.zona,b.sector,distrito as area,t_viv_ocu,t_viv_des,t_viv_col,total_viv,
    viv_ocu,viv_tem,viv_des,viv_col,viv_est,viv_cons,total_uso,total_viviendas,fecha,eo.justificacion from 
    (select ei.id_upm,cu.codigo,cu.fecmod as fecha,
    count(case when ee.codigo_respuesta::int = 1 then ee.codigo_respuesta end) viv_ocu,
    count(case when ee.codigo_respuesta::int = 2 then ee.codigo_respuesta end) viv_tem,
    count(case when ee.codigo_respuesta::int = 3 then ee.codigo_respuesta end) viv_des,
    count(case when ee.codigo_respuesta::int = 4 then ee.codigo_respuesta end) viv_col,
    count(case when ee.codigo_respuesta::int = 5 then ee.codigo_respuesta end) viv_est,
    count(case when ee.codigo_respuesta::int = 6 then ee.codigo_respuesta end) viv_cons,
    count(*) as total_uso,
    count(case when ee.codigo_respuesta::int in (1,2,3,4) then ee.codigo_respuesta end) as total_viviendas
    from cat_upm cu
    join ope_asignacion oa on oa.id_upm=cu.id_upm
    join enc_informante ei on ei.id_asignacion=oa.id_asignacion and cu.id_upm=ei.id_upm 
    join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.visible=true and ee.id_pregunta in (36877,36850)
    where cu.estado='CONCLUIDO' and ei.estado!='ANULADO'
    group by ei.id_upm,cu.codigo,cu.fecmod order by 1) as a
    join (select id_upm,aa.cod_depto||'.'||aa.depto as depto, aa.cod_prov||'.'||aa.prov as prov,aa.mpio
        ,aa.area_cpv,aa.ciu_com,aa.cod_ci_com,aa.zona,aa.sector,bb.distrito,sum(t_viv_ocu) as t_viv_ocu,sum(t_viv_des) as t_viv_des,sum(t_viv_col) as t_viv_col,
        sum(total_viv) as total_viv from ace.a_sector aa
    join ace.bolivia_manzano bb on aa.cod_depto=bb.cod_depto and bb.id_upm is not null
    and aa.cod_prov=bb.cod_prov
    and aa.cod_mpio=bb.cod_mpio
    and aa.area_cpv=bb.distrito
    and aa.cod_ci_com=bb.cod_cd_com
    and aa.zona=bb.zona
    and aa.tipo_area=bb.tipo_area
    and aa.sector in (select unnest(('{'||replace(bb.sector,'-',',')||'}')::text[]))
    where case when 0=${req.params.id} then aa.cod_depto ilike '%%' else aa.cod_depto::integer=${req.params.id} end
    group by id_upm,aa.cod_depto,aa.depto,aa.cod_prov,aa.prov,aa.cod_mpio,aa.mpio,aa.area_cpv,aa.ciu_com,aa.cod_ci_com,aa.zona,aa.sector,bb.distrito) as b
    on a.id_upm=b.id_upm
    left join enc_observacion_upm eo on eo.codigo=a.codigo
    order by 2,3,4,zona,sector`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const InfoSupervisores = async (req, res) => {
    let tipo;
      if (req.params.tipo==1){
        tipo='AMANZANADO';
      } else {
        tipo='DISPERSO';
      }
    const text = `select op.id_brigada,codigo_brigada as brigada,(select nombre from seg_usuario where id_brigada=op.id_brigada and id_rol=8 and estado='ELABORADO'),count(*)::int as total from cat_upm cu
    join enc_informante ei on cu.id_upm=ei.id_upm
    join ope_asignacion oa on cu.id_upm=oa.id_upm and oa.id_asignacion=ei.id_asignacion and oa.estado!='ANULADO'
    join seg_usuario su on su.id_usuario = ei.id_usuario and id_rol=9
    join ope_brigada op on op.id_brigada = su.id_brigada
    where cu.estado!='ANULADO' and ei.estado!='ANULADO' 
    and cu.tipo_area='${tipo}' and ei.correlativo>0
    and case when 0=${req.params.sw} then cu.id_departamento::text||cu.id_provincia||cu.id_municipio||cu.id_distrito||cu.id_ciudad_comunidad='${req.params.codigo}'
    else cu.id_upm::text='${req.params.codigo}' end
    group by op.id_brigada,codigo_brigada`;
    client.query(text, async (err, result) => {
        if (err) { throw err; } else { return res.status(200).json(result.rows); }
    })
}

const infoActualizadores = async (req, res) => {
    let tipo;
      if (req.params.tipo==1){
        tipo='AMANZANADO';
      } else {
        tipo='DISPERSO';
      }
    const text = `select codigo_brigada as brigada,login,su.nombre as usuario,count(*)::int as total from cat_upm cu
    join enc_informante ei on cu.id_upm=ei.id_upm
    join ope_asignacion oa on cu.id_upm=oa.id_upm and oa.id_asignacion=ei.id_asignacion and oa.estado!='ANULADO'
    join seg_usuario su on su.id_usuario = ei.id_usuario and id_rol=9
    join ope_brigada op on op.id_brigada = su.id_brigada
    where cu.estado!='ANULADO' and ei.estado!='ANULADO' 
    and cu.tipo_area='${tipo}' and ei.correlativo>0
    and case when 0=${req.params.sw} then cu.id_departamento::text||cu.id_provincia||cu.id_municipio||cu.id_distrito||cu.id_ciudad_comunidad='${req.params.codigo}'
    else cu.id_upm::text='${req.params.codigo}' end
    group by codigo_brigada,login,su.nombre`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}


const InfoAvaceBrigada = async (req, res) => {
    let tipo;
      if (req.params.tipo==1){
        tipo='AMANZANADO';
      } else {
        tipo='DISPERSO';
      }
    const text = `select split_part(a.codigo_brigada,'|',2) as codigo_brigada, su.nombre ,su.login,a.concluido as "cerrado",a.preconcluido as "concluido",a.elaborado as "pendiente", su.id_usuario from 
    (SELECT * FROM crosstab ('select ob.id_brigada||''|''||codigo_brigada,ei.estado,count(*) from ope_asignacion oa
    join cat_upm cu on cu.id_upm=oa.id_upm and oa.estado=''ELABORADO''
    join seg_usuario su on su.id_usuario=oa.id_usuario
    join ope_brigada ob on ob.id_brigada=su.id_brigada
    join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado in (''CONCLUIDO'',''ELABORADO'',''PRECONCLUIDO'') and ei.id_upm=cu.id_upm
    where case when 0=${req.params.sw} then cu.id_departamento::text||cu.id_provincia||cu.id_municipio||cu.id_distrito||cu.id_ciudad_comunidad=''${req.params.codigo}''
    else cu.id_upm::text=''${req.params.codigo}'' end
    group by ob.id_brigada||''|''||codigo_brigada,ei.estado order by 1,2','select estado from municipio.estado where estado in (''CONCLUIDO'',''ELABORADO'',''PRECONCLUIDO'') order by estado') AS ct (codigo_brigada text, concluido int, preconcluido int, elaborado int)
    order by codigo_brigada) as a
    join seg_usuario su on su.id_brigada=split_part(a.codigo_brigada,'|',1)::integer and su.id_rol=8`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const preguntas = async (req, res) => {
    const query = {text: `SELECT id_pregunta,pregunta,'' codigo_respuesta,'' respuesta, case when id_pregunta=36876 then true else false end estado,omision,true as sw FROM ENC_PREGUNTA 
    WHERE CODIGO_PREGUNTA in ('F4_B_06','F4_B_07','F4_B_09','F4_B_11','F4_B_12','F4_C_01','F4_C_02','F4_C_03','F4_C_04') and estado='ELABORADO'
    order by codigo_pregunta`}
    client.query(query, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const listarAreas = async (req, res) => {
    const text = `select id_asignacion,oa.id_upm,cu.codigo,oa.estado from ope_asignacion oa
    join cat_upm cu on cu.id_upm=oa.id_upm where oa.estado!='ANULADO' and oa.id_usuario=${req.params.id}`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const listaPuntos = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM (
    SELECT 'Feature' As type
    , ST_AsGeoJSON((lg.geom),5,0)::json As geometry
    , row_to_json((SELECT l FROM (SELECT id_asignacion,correlativo,manzana,predio,nombre,color) As l
    )) As properties
    FROM (select ei.estado,ei.id_asignacion,ei.correlativo,ee1.respuesta as manzana,ee2.respuesta as predio,ee3.respuesta as nombre,
        case when ei.estado='FINALIZADO' then '#009502' else '#0095C4' end color,
        ST_MakePoint(split_part(ei.codigo,',',2)::numeric,split_part(ei.codigo,',',1)::numeric) as geom from ope_asignacion oa 
		join enc_informante ei on ei.id_asignacion=oa.id_asignacion and ei.estado in ('PRECONCLUIDO','CONCLUIDO','FINALIZADO')
		join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo and ee.id_pregunta=36879 and ee.codigo_respuesta='2'
		join enc_encuesta ee1 on ee1.id_asignacion=ei.id_asignacion and ee1.correlativo=ei.correlativo and ee1.id_pregunta=37207
        join enc_encuesta ee2 on ee2.id_asignacion=ei.id_asignacion and ee2.correlativo=ei.correlativo and ee2.id_pregunta=36873
        join enc_encuesta ee3 on ee3.id_asignacion=ei.id_asignacion and ee3.correlativo=ei.correlativo and ee3.id_pregunta=37241
		where oa.id_upm=${req.params.id}) As lg) As f )  As fc`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const obtenerSectorUpm = async (req, res) => {
    const text = `SELECT row_to_json(fc)
    FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
    FROM (SELECT 'Feature' As type, ST_AsGeoJSON((lg.geom),5,0)::json As geometry, row_to_json((SELECT l FROM (SELECT color,zona,sector) As l)) As properties
    FROM (select distinct '#195EB6' as color,aa.zona,aa.sector,aa.geom from ace.a_sector aa
    join ace.bolivia_manzano bb on aa.cod_depto=bb.cod_depto 
    and aa.cod_prov=bb.cod_prov 
    and aa.cod_mpio=bb.cod_mpio 
    and aa.area_cpv=bb.distrito 
    and aa.cod_ci_com=bb.cod_cd_com
    and aa.zona=bb.zona and aa.sector=bb.sector
    join cat_upm cu on cu.id_upm=bb.id_upm
    where cu.id_upm=${req.params.id}
    union 
    select distinct '#BB0404' as color,aa.zona,aa.sector,bb.geom from ace.a_sector aa
    join ace.bolivia_manzano bb on aa.cod_depto=bb.cod_depto 
    and aa.cod_prov=bb.cod_prov 
    and aa.cod_mpio=bb.cod_mpio 
    and aa.area_cpv=bb.distrito 
    and aa.cod_ci_com=bb.cod_cd_com
    and aa.zona=bb.zona and aa.sector=bb.sector
    join cat_upm cu on cu.id_upm=bb.id_upm
    where cu.id_upm=${req.params.id}) As lg) As f )  As fc`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const asignaciones = async (req, res) => {
    const query = {text: `select id_asignacion,correlativo,('['||string_agg(row_to_json(row)::text,',')||']')::json
    from (select ee.id_asignacion,ee.correlativo, ep.omision,ee.id_pregunta,ee.codigo_respuesta,ee.respuesta,ee.respuesta,ee.visible as estado, ep.pregunta from enc_informante ei
    join enc_encuesta ee on ee.id_asignacion=ei.id_asignacion and ee.correlativo=ei.correlativo
    join enc_pregunta ep on ep.id_pregunta=ee.id_pregunta and ep.id_pregunta in (37242,36876,37196,36877,36880,37243,36886,36887,36878)
    where id_asignacion_padre=${req.params.asignacion} and correlativo_padre=${req.params.correlativo} 
    order by id_asignacion,correlativo,codigo_pregunta) row
    group by id_asignacion,correlativo`}
    client.query(query, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const asignacionesId = async (req, res) => {
    const query = {text: `select a.id_pregunta,codigo_respuesta,
    case when a.id_pregunta=37300 and ee.respuesta is null then (select ee1.respuesta ||'-'|| ee2.respuesta ||'-'|| ee3.respuesta from enc_encuesta ee1
    JOIN enc_encuesta ee2 on ee1.id_asignacion = ee2.id_asignacion and ee1.correlativo = ee2.correlativo and ee1.id_pregunta = 37248 and ee2.id_pregunta = 37249
    JOIN enc_encuesta ee3 on ee2.id_asignacion = ee3.id_asignacion and ee2.correlativo = ee3.correlativo and ee3.id_pregunta = 36874
    where ee1.id_asignacion=${req.params.asignacion} and ee1.correlativo=${req.params.correlativo}) else ee.respuesta end respuesta from 	
    (select * from enc_pregunta ep where ep.id_pregunta in (37207,36873,37241,37300,37242)) as a
    left JOIN enc_encuesta ee on ee.id_pregunta=a.id_pregunta and id_asignacion=${req.params.asignacion} and correlativo=${req.params.correlativo}`}
    client.query(query, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const ingresar = async (req, res) => {
    if (!req.params.login || !req.params.password) {
        res.status(400).json({ msg: 'Porfavor introduzca el Usuario y Contrase�a' })
    } else {
        client.query(`select su.* from seg_usuario su join ope_brigada ob on ob.id_brigada=su.id_brigada where 
            login='${req.params.login}' and su.estado='ELABORADO' and codigo_brigada ilike '%ACEWEB%'`, (err, result) => {
            if (err) throw err
            if (result.rowCount == 0) return res.status(400).json({ msg: 'Usuario no valido' })
            if (!bcrypt.compareSync(req.params.password, result.rows[0].password)) {
                return res.status(400).json({ msg: 'Contrase�a no valido' })
            }
	        let generador=result.rows[0];
            delete generador.password;
            let token = jwt.sign({
                id_usuario: generador
            }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });

            return res.status(200).json({
                usuario: generador,
                token,
                menu: generador.menu
            })
        })

    }
}

const guardar = async (req, res) => {
    const text = `select * from fn_consolidar_transcripcion(${req.params.sw},${req.params.asignacion}, ${req.params.correlativo}, '${req.params.usuario}', '${JSON.stringify(req.body)}')`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const eliminar = async (req, res) => {
    const query = {text: `delete from enc_encuesta where id_asignacion=${req.body.asignacion} and correlativo=${req.body.correlativo};
    delete from enc_informante where id_asignacion=${req.body.asignacion} and correlativo=${req.body.correlativo};`}
    client.query(query, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const finalizar = async (req, res) => {
    const query = {text: `update enc_informante set estado='FINALIZADO' where id_asignacion=${req.body.asignacion} and correlativo=${req.body.correlativo}`}
    client.query(query, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const tablaId = async (req, res) => {
    const text = `select (select upper(nombredepa) from cartografia.car_departamento where codigo::int=a.id_departamento) as nombre,
	min(feccre)::date::text as fecha_inicio,max(feccre)::date::text as fecha_final,sum(total) as viviendas,
	 (select direccion from cartografia.car_departamento where codigo::int=a.id_departamento) from 
    (select cu.id_departamento,ei.feccre::date,extract(week from ei.feccre::date) as intervalo,count(*) as total from enc_informante ei 
    join cat_upm cu on cu.id_upm=ei.id_upm and cu.id_departamento=${req.params.id}
    where ei.estado='CONCLUIDO' and cu.estado!='ANULADO'
    group by cu.id_departamento,ei.feccre::date) as a
    group by id_departamento,intervalo
    order by fecha_inicio,fecha_final,id_departamento`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}


const tablaFecha = async (req, res) => {
    const text = `select (select upper(nombredepa) from cartografia.car_departamento where codigo::int=a.id_departamento) as nombre,
	min(feccre)::date::text as fecha_inicio,max(feccre)::date::text as fecha_final,sum(total) as viviendas,
	 (select direccion from cartografia.car_departamento where codigo::int=a.id_departamento) from 
    (select cu.id_departamento,ei.feccre::date,extract(week from ei.feccre::date) as intervalo,count(*) as total from enc_informante ei 
    join cat_upm cu on cu.id_upm=ei.id_upm 
    where ei.estado='CONCLUIDO' and cu.estado!='ANULADO'
    group by cu.id_departamento,ei.feccre::date) as a
    group by id_departamento,intervalo
    order by fecha_inicio,fecha_final,id_departamento`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const tablaMunicipio = async (req, res) => {
    const text = `select (select upper(nombredepa) from cartografia.car_departamento where codigo::int=cu.id_departamento) as nombre,
	cu.provincia,cu.municipio,count(*) as viviendas,
	(select direccion from cartografia.car_departamento where codigo::int=cu.id_departamento)from enc_informante ei 
    join cat_upm cu on cu.id_upm=ei.id_upm 
    where ei.estado='CONCLUIDO' and cu.estado!='ANULADO'
    group by cu.id_departamento,cu.provincia,cu.municipio`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}

const mapaMunicipio = async (req, res) => {
    const text = `SELECT row_to_json(fc)
	FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
	FROM ( SELECT 'Feature' As type
	, ST_AsGeoJSON(lg.geom)::json As geometry
	, row_to_json((SELECT l FROM (SELECT codigo,municipio,sectores_ace,sector,avance) As l
	)) As properties
	FROM (select * from cartografia.vw_ac_2021_avance_municipio) As lg ) As f )  As fc`;
    client.query(text, async (err, result) => {
        if (err) {throw err; } else { return res.status(200).json(result.rows); }
    })
}



module.exports = {
    listaDep,
    listaProv,
    listaMun,
    lista_municipios,
    lista_departamento,
    lista_provincia,
    listaAreas,
    listaAreas1,
    listaAreaCensal,
    listaZonaCensal,
    listaManzanaCensal,
    listaComunidadCensal,
    equipamientoCensal,
    listaDistrito,
    listaDatos,
    listaPareto,
    listaCurva,
    lista_municipio,
    lista_ciudades,
    ciudadesAsignacion,
    ciudadesAsignacion1,
    lista_distrito,
    shape_distrito_seleccionado,
    shapeManzanasArea,
    shapePuntos,
    infoActualizadores,
    InfoSupervisores,
    InfoAvaceBrigada,
    preguntas,
    asignaciones,
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
    infoDistritos,
    tablaId, 
    tablaFecha,
    tablaMunicipio,
    mapaMunicipio ,
    municipioAvance,
    avanceAmanzanado,
    avanceUrbano,
    avanceDisperso,
    municipioTabla,
    detalleAvance,
    graficoInicial,
    departamentoAvance,
    listaMunicipioAvance
}


