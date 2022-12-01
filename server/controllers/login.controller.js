const ActiveDirectory = require("activedirectory2");
const configAD = require("../config/active-directori.config");
const { generarJWT } = require("../helpers/generar-jwt");
var ad = new ActiveDirectory(configAD);
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const client = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
client.connect();

const loginPostDatUsers = async (req, res) => {
  let username = await validaUsuario(req.body.login);
  await ad.authenticate(username, req.body.password, async function (err, auth) {
      if (err) {
        res.status(400).json({
          ok: false,
          msg: `Usuario contraseÃ±a no son correctos`,
        });
      }
      if (auth) {
        ad.findUser(username, function(err, users) {
          if (err) {
            return;
          }
          if (!users){
              res.status(400).json({
              ok:false,
              msg: `El usuario ${req.body.usuario} no se encuentra registrado`,
          })}
          else {
            return res.status(200).json({
              ok: true,
              msg: "Usuario correcto",
              data: users
            });
          }
        });
      } else {

      }
    }
  );
};

const loginPost = async (req, res) => {
  const existeEmail = await client.query(`SELECT login FROM seg_usuario WHERE estado='ELABORADO' AND id_rol=9 AND login = '${req.body.login}'`);
  let username = await validaUsuario(req.body.login);
  await ad.authenticate(username, req.body.password, async function (err, auth) {
      if (err) {
        res.status(400).json({
          ok: false,
          msg: `Usuario contraseÃ±a no son correctos`,
        });
      }
      if (auth) {
        await verificaUsuario(req, res, username);
      } else {
        return res.status(200).json({
          ok: true,
          msg: "Usuario correcto",
        });
      }
    }  
  );
  /*const text = `SELECT login,password FROM seg_usuario WHERE estado='ELABORADO' AND login = '${req.body.login}'`;
    client.query(text, async (err, result) => {
        if (err) {
          res.status(400).json({
            ok: false,
            msg: `Usuario no valido`,
          });
        } else { 
          
          if(result.rows.length>0){
            if (!bcrypt.compareSync(req.body.password, result.rows[0].password)) {
              res.status(400).json({
                ok: false,
                msg: `Contraseña no son correctos`,
              });  
            } else {
              await verificaUsuario(req, res, req.body.login);
            }
            
          } else {
            res.status(400).json({
              ok: false,
              msg: `No existe ningun usuario`,
            });
          }  
        }
    })*/
};

function validaUsuario(username) {
  if (
    username.indexOf("@ine.gob.bo") > -1 ||
    username.indexOf("@ine.gov.bo") > -1
  ) {
    return username;
  } else {
    return username + "@ine.gov.bo";
  }
}

function verificaUsuario(req, res, users) {
  const query = {
    text: `SELECT * FROM seg_usuario WHERE login=$1`,
    values: [req.body.login],
  };
  client.query(query, (err, result) => {
    if (err) {
      throw err;
    }
    if (result.rowCount > 0) {
      obtieneUsuario(req, res, users);
    } else {
      return res.status(400).json({
        ok: false,
        msg: "El usuario no tiene permisos para el acceso",
      });
    }
  });
}

function obtieneUsuario(req, res, users) {
  const query = {
    text: "SELECT s.*,r.menu FROM seg_usuario s join seg_rol r on s.id_rol=r.id_rol WHERE login=$1",
    values: [req.body.login],
  };
  client.query(query, async (err, result) => {
    if (err) throw err;

    let generador = result.rows[0];
    let queryUser = users;
    User = {
      usuarioId: queryUser.cn,
      login: generador.login,
      rol: generador.id_rol,
      departamento: generador.id_departamento
    };
    const token = await generarJWT(
      generador.id_usuario,
      generador.id_rol,
      generador.id_departamento
    );
    if (result.rowCount == 0) {
      return res.status(400).json("error");
    }
    return res.status(200).json({
      ok: true,
      User,
      token,
      menu: generador.menu,
    });
  });
}

module.exports = {
  loginPost,
  loginPostDatUsers,
};
