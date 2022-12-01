const ActiveDirectory = require('activedirectory2');
var config = require('../config/active-directori.config');

var ad = new ActiveDirectory(config);
const usuarioExiste = async(username= '')=>{
  
    let usernameAux = validaUsuario(username);
  const usuarioexisteActDir = await ad.userExists(usernameAux, function(err, exists) {
    if (err) {
      return;
    }
   return exists;
  });
  if(usuarioexisteActDir){
    throw new Error(`El usuario ${usernameAux} no se encuentra registrado`);
  } 
}
function validaUsuario(username){
  if(username.indexOf("@ine.gob.bo") > -1 || username.indexOf("@ine.gov.bo") > -1){    
    return username;
  }else{     
    return username+"@ine.gov.bo";
  }
}
module.exports= {
    usuarioExiste
}
