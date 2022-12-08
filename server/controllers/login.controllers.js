//const ActiveDirectory = require('activedirectory2');
const bcrypt = require('bcryptjs');
const { generarJWT } = require("../helpers/generar-jwt");
const { Pool } = require('pg');
const client = new Pool({
  //max: 50, //N° maximo de clientes
  //idleTimeoutMillis: 30000,
  //connectionTimeoutMillis: 2000,
});
client.connect();

const loginPost = async(req, res) => {
    const consulta = `SELECT * FROM public.users WHERE estado AND usuario = '${req.body.usuario}'`;
    client.query(consulta, async (err, result) => {
        if (err) {
          res.status(400).json({
            ok: false,
            msg: `El usuario o contraseña son incorrectos.`,
          });
        } else {
          if(result.rows.length>0){
            if(req.body.contrasena ===  result.rows[0].contrasena){
              let generador = result.rows[0];
              User = {
                usuario: generador.usuario,
                email: generador.email
              };
              const token = await generarJWT(generador.id);
              return res.status(200).json({
                ok: true,
                User,
                token,
              });
            }else{
                res.status(400).json({
                    ok: false,
                    msg: `El usuario o contraseña son incorrectos.`,
                });
            }
            /*if (!bcrypt.compareSync(req.body.password, result.rows[0].password)) {
              res.status(400).json({
                ok: false,
                msg: `El usuario o contraseña son incorrectos.`,
              });
            } else {
              await verificaUsuario(req, res, req.body.login);
            }*/
          } else {
            res.status(400).json({
              ok: false,
              msg: `El usuario o contraseña son incorrectos.`,
            });
          }
        }
    })
};

module.exports = {
    loginPost
};