const { response, request } = require('express');
const CryptoJS = require("crypto-js");
const { Client } = require('pg');
const client = new Client({});
client.connect()



const usuarioDatos = async(req = request, res = response, next)=>{
   let tokenFromUI = "$1$0$@821061&%15";
   let _key = CryptoJS.enc.Utf8.parse(tokenFromUI);
   let _iv = CryptoJS.enc.Utf8.parse(tokenFromUI);
   let decrypted = await CryptoJS.AES.decrypt(
     req.body.datos, _key, {
       keySize: 16,
       iv: _iv,
       mode: CryptoJS.mode.ECB,
       padding: CryptoJS.pad.Pkcs7
     }).toString(CryptoJS.enc.Utf8);
     decrypted = JSON.parse(decrypted);
  req.body.login=decrypted.login;
  req.body.password=decrypted.password;
  if(!decrypted.login){
    res.status(400).json({
        ok:false,
        msg: `El nombre de usuario es requerido`,
    })
  }
  if(!decrypted.password){
    res.status(400).json({
        ok:false,
        msg: `La contraseña es requerida`,
    }) 
  }
  next();  
  } 

 const  verificarUsuario = async(req, res, next)=>{
   
    const existeEmail = await client.query(`SELECT login FROM seg_usuario WHERE estado='ELIMINADO' AND login = $1`,[req.body.login]);
      if(existeEmail.rowCount > 0) {
        res.status(400).json({
          ok:false,
          msg: `Usuario contraseña no son correctos`,
        }) 
      }
      next();  
 }

module.exports= {
    usuarioDatos,
    verificarUsuario
}
