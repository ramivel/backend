const { Client } = require('pg');
const client = new Client({});
client.connect()

module.exports.validaUsuarioUnico = async(usuario= '')=>{
    const consulta = {
        text: 'SELECT * FROM public.users WHERE usuario = $1',
        values: [usuario],
    }
    const existeUsuario = await client.query(consulta);
    if(existeUsuario.rowCount > 0) throw new Error('El Usuario ya se encuentra registrado');        
}