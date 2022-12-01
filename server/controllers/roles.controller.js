const { Pool } = require('pg');
const client = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
client.connect();
const rolesGet = (req, res)=>{
  
  const query = {
      text: `Select id_rol, descripcion from seg_rol where estado = 'ELABORADO' AND id_rol in (8,9)`,
  }
  client.query(query, (err, result) => {
      if (err) {
        throw err;
      } else {
        let roles = result.rows;
        return res.status(200).json({
          ok:true,
          msg:'Roles actuales',
          roles
       })
      }
     })
}
const rolesGetActive = (req, res)=>{
  var comodin = '';
  if(req.body.id_rol_token === 0){
    comodin = 'AND id_rol not in (0,8,9)'
    }
    if(req.body.id_rol_token === 17 || req.body.id_rol_token === 16){
      comodin = 'AND id_rol not in (8,9,0)'
    }
const query = {
    text: `Select id_rol, descripcion from seg_rol where estado = 'ELABORADO' ${comodin}`,
}
client.query(query, (err, result) => {
    if (err) {
      throw err;
    } else {
      let roles = result.rows;
      return res.status(200).json({
        ok:true,
        msg:'Roles actuales',
        roles
     })
    }
   })
}

module.exports = {
   rolesGet,
   rolesGetActive
  }
  