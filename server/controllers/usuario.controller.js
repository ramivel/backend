const ActiveDirectory = require('activedirectory2');
const configAD = require('../config/active-directori.config');
const { generarCeros } = require('../helpers/aniadirCeros');
var ad = new ActiveDirectory(configAD);

const { Pool } = require('pg');
const client = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
client.connect();

const usuarioGetActDir = async(req, res) => {
  const id = req.params;
    let query = `${id.id}=*${id.dat}*`;
    await ad.findUsers(query, true, function(err, users) {
        if (err) {
          return;
        }
        if ((!users) || (users.length == 0)){ 
          console.log('No users found.');
      }else {
          return res.status(200).json({
            ok:true,
            msg:'los usuarios',
            users
         })
        }
      })
}

const usuarioSolicitudGet = async(req, res) =>{
   const query = {
    text: 'SELECT id_usuario, login, estado FROM seg_usuario WHERE estado = $1',
    values: ['SOLICITADO'],
}
await client.query(query, (err, result) => {
  if (err) {
    throw err;
  } else {
    let usuarios = result.rows;
    return res.status(200).json({
      ok:true,
      msg:'Usuarios con solicitud de acceso',
      usuarios
   })
  }
})
}

const usuarioElaboradoGet = async(req, res) =>{
  const text = `SELECT a.id_usuario, a.login, a.id_departamento, b.nombre nombre_dep, c.descripcion  
          FROM seg_usuario a INNER JOIN cat_departamento b ON a.id_departamento = b.id_departamento 
          INNER JOIN  seg_rol c ON a.id_rol = c.id_rol
          WHERE a.estado = 'ELABORADO'
          AND a.id_rol not in (8,9)
          AND case when 0=${req.params.departamento} then a.id_departamento::text ilike '%%' else a.id_departamento::int = ${req.params.departamento} end`;
  await client.query(text, (err, result) => {
    if (err) {
      throw err;
    } else {
      let usuarios = result.rows;
      return res.status(200).json({
        ok:true,
        msg:'Usuarios con solicitud de acceso',
        usuarios
      })
    }
  })
}

const brindaAccesoPut = async(req, res) => {
  const id = req.params;
  const query = {
    text: `UPDATE seg_usuario SET id_rol=$1, id_departamento=$2, estado=$3 WHERE id_usuario = ${id.id}`,
    values: [req.body.id_rol,req.body.id_departamento,'ELABORADO'],
 }
 await client.query(query, (err, result) => {
  if (err) {
    throw err;
  } else {
    let usuario = result;
    return res.status(200).json({
      ok:true,
      msg:'Permisos de usuario actualizado',
      usuario
   })
  }
 })
}
 const agregarUsuarioPost = async(req, res) =>{
      let usucre = req.body.usucre;
      let query = {
        text: `INSERT INTO seg_usuario(login, nombre, id_rol, id_departamento, usucre) VALUES ($1, $2, $3, $4, $5)`,
        values: [req.body.login,req.body.nombre, req.body.id_rol, req.body.id_departamento, usucre],
     }
     await client.query(query, (err, result) => {
      if (err) {
        throw err;
      } else {
        let usuarios = result;
        return res.status(200).json({
          ok:true,
          msg:'Usuario registrado en el sistema',
          usuarios
       })
      }
     })  
 }
 const crearUsuariosAleatorios = async(req, res)=>{
  let datos = req.body;
  let usucre = 'esosa';
  let gestion = 2021;
  let mes = 7;
  let dato_nue =[];
for(let i = 1; i <= datos.cantidad; i++){
  if(!datos.desc){
    datos.desc='';
  }
  
  dato_nue.push(`('${datos.login+generarCeros(i, 2)+datos.desc}', '${datos.nombre+generarCeros(i, 2)+datos.desc}','${bcrypt.hashSync(datos.password, 10)}',${datos.id_rol}, ${datos.id_departamento},'${usucre}')`);
}

 let asignaciones = dato_nue;
 let query = {
     text:`INSERT INTO seg_usuario(login, nombre, password,id_rol, id_departamento, usucre) VALUES ${asignaciones.join()}`
   }
   await client.query(query, (err, result) => {
    if (err) {
      throw err;
    } else {
      return res.status(200).json({
        ok:true,
        msg:'Usuarios Creados',
     })
    }
   })
 }
 const borrarUsuario = async(req,res) => {
  let query = {
    text:`UPDATE seg_usuario SET estado= 'ELIMINADO' WHERE id_usuario = ${req.params.id}`
  }
  await client.query(query, (err, result) => {
   if (err) {
      throw err;
   } else {
     return res.status(200).json({
       ok:true,
       msg:'Usuario eliminado',
    })
   }
  })
 }
 const getUsuarios = async(req, res)=>{
  let query = `select id_usuario, login, nombre, id_departamento, id_rol
  from seg_usuario where estado = 'ELABORADO' and id_rol not in (8,9)`;
  await client.query(query, (err, resul) => {
    if (!err) {
      let usuarios = resul.rows;
      return res.status(200).json({
        ok:true,
        msg:'Usuarios',
        usuarios
      });
    }
    return res.status(400).json({
      ok:false,
      msg:'Error en el servidor'
    });
  });
 }
 const getUsuariosRepo = async(req, res)=>{
  let query = `SELECT su.id_usuario,
  su.LOGIN,
  su.nombre,
  ld.depto,
  sr.descripcion
  FROM seg_usuario su,
  ace.lim_departamento ld,
  seg_rol sr
  WHERE su.estado = 'ELABORADO'
  AND su.id_rol NOT IN (8, 9)
  AND su.id_departamento = ld.id
  AND su.id_departamento = sr.id_rol`;
  await client.query(query, (err, resul) => {
    if (!err) {
      let usuarios = resul.rows;
      return res.status(200).json({
        ok:true,
        msg:'Usuarios',
        usuarios
      });
    }
    return res.status(400).json({
      ok:false,
      msg:'Error en el servidor'
    });
  });
 }
 const updateUsuario = async(req, res)=>{
  let query = `UPDATE seg_usuario
              SET id_departamento = ${req.body.id_departamento}
                  ,id_rol = ${req.body.id_rol}
              WHERE id_usuario = ${req.body.id_usuario}`;
  await client.query(query, (err, resul) => {
    if (!err) {
      return res.status(200).json({
        ok:true,
        msg:'Usuario Actualizado'
      });
    }
    return res.status(400).json({
      ok:false,
      msg:'Error en el servidor'
    });
  });
 }
module.exports = {
  usuarioGetActDir,
  getUsuarios,
  getUsuariosRepo,
  updateUsuario,
  usuarioSolicitudGet,
  usuarioElaboradoGet,
  brindaAccesoPut,
  agregarUsuarioPost,
  crearUsuariosAleatorios,
  borrarUsuario
}
