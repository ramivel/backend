const { Pool } = require('pg');
const client = new Pool({
  //max: 50,
  //idleTimeoutMillis: 30000,
  //connectionTimeoutMillis: 2000,
});
client.connect();

/* Seleccionar todos los Elementos */
const obtenerUsuariosGet = async(req, res) => {
    let consulta = 'SELECT * FROM public.users WHERE estado';
    await client.query(consulta, (err, result) => {
        if (err) {
          throw err;
        } else {
            let usuarios = result.rows;
            return res.status(200).json({
                ok:true,
                usuarios
            });
        }
    });
};

/* Buscar un Elemento */
const obtenerUsuarioGet = async(req, res) => {
    const { id } = req.params;
    let consulta = {
        text: 'SELECT * FROM public.users WHERE estado AND id = $1',
        values: [id]
    };
    await client.query(consulta, (err, result) => {
        if (err) {
          throw err;
        } else {
            let usuario = result.rows;
            return res.status(200).json({
                ok:true,
                usuario
            });
        }
    });
};

/* Agregar un Elemnto */
const agregarUsuarioPost = async(req, res) => {
    const usucre = req.body.usulogin;
    let consulta = {
        text: 'INSERT INTO public.users(usuario, email, contrasena) VALUES($1,$2,$3)',
        values: [req.body.usuario, req.body.email, req.body.contrasena]
    };
    await client.query(consulta, (err, result)=>{
        if(err){
            throw err;
        }else{
            return res.status(200).json({
                ok:true,
                msg:'Usuario registrado en el sistema'
            });
        }
    });
};

/* Actualizar un Elemento */
const actualizarUsuarioPut = async(req, res) => {
    let consulta = {
        text: 'UPDATE users SET usuario=$2, email = $3 WHERE estado AND id = $1',
        values: [req.body.id, req.body.usuario, req.body.email]
    };
    await client.query(consulta, (err, result) => {
        if(err){
            throw err;
        }else{
            return res.status(200).json({
                ok:true,
                msg:'Usuario actualizado en el sistema'
            });
        }
    });
};

/* Eliminar un Elemento */
const borrarUsuarioDelete = async(req, res) => {
    let consulta = {
        text: 'UPDATE users SET estado=false WHERE id = $1',
        values: [req.body.id]
    };
    await client.query(consulta, (err, result) => {
        if(err){
            throw err;
        }else{
            return res.status(200).json({
                ok:true,
                msg:'Usuario eliminado del sistema'
            });
        }
    });
};

module.exports = {
    obtenerUsuariosGet,
    obtenerUsuarioGet,
    agregarUsuarioPost,
    actualizarUsuarioPut,
    borrarUsuarioDelete
}