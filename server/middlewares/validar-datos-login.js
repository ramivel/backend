const { response, request } = require('express');
const CryptoJS = require("crypto-js");
const { Client } = require('pg');

const client = new Client({});
client.connect();
const key = "$1$0$@821061&%15";

const usuarioDatos = async(req=request, res=response, next) => {

    let decrypted = CryptoJS.AES.decrypt(req.body.datos, key).toString(CryptoJS.enc.Utf8);
    decrypted = JSON.parse(decrypted);
    if(!decrypted.usuario) return res.status(400).json({ok: false, msg: 'El usuario es requerido'});
    if(!decrypted.contrasena) return res.status(400).json({ok: false, msg: 'La contraseña es requerida'});
    req.body.usuario = decrypted.usuario;
    req.body.contrasena = decrypted.contrasena;

    next();
}

const verificarUsuario = async(req, res, next) => {

    const consulta = await client.query(`SELECT * FROM public.users WHERE estado AND usuario=$1`,[req.body.usuario]);    
    if(consulta.rowCount <= 0) return res.status(400).json({ok: false, msg: 'El usuario o contraseña son incorrectos.'});

    next();
}

module.exports= {
    usuarioDatos,
    verificarUsuario
}
