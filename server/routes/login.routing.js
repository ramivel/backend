const express = require('express')
const router = express.Router();
const { loginPost, loginPostDatUsers } = require('../controllers/login.controller')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verificaToken } = require('../middlewares/autenticacion');
const { Client } = require('pg');
const { check } = require('express-validator');
const { usuarioExiste } = require('../middlewares/validar-active-directori');
const { validarCampos } = require('../middlewares/validar-campos');
const { usuarioDatos, verificarUsuario } = require('../middlewares/validardatologin')
const client = new Client({});
client.connect()

router.post('/signup', function(req, res) {
    if (!req.body.id_departamento || !req.body.login || !req.body.password || !req.body.nombre) {
        return res.status(400).json({ msg: 'Porfavor introduzca el Usuario y Contraseña' })
    } else {
        const query = {
            text: 'INSERT INTO seg_usuario (id_departamento, login, password, nombre, usucre) VALUES($1, $2, $3, $4, $5)',
            values: [req.body.id_departamento, req.body.login, bcrypt.hashSync(req.body.password, 10), req.body.nombre, req.body.usucre],
        }
        client.query(query)
            .then(result => res.status(200).json({
                usuario: req.body.login,
                nombre: req.body.nombre,
                departamento: req.body.id_departamento
            }))
            .catch(e => console.error(e.stack))
            .then(() => client.end())
    }
});
router.post('/signin',[usuarioDatos],[check('datos', 'Datos no validos').not().isEmpty(),verificarUsuario,
                        validarCampos], loginPost);
router.post('/buscar/user', loginPostDatUsers);
router.get('/renew', verificaToken, function (req, res) {
    const { token } = req.headers;
    var payload = jwt.decode(token, process.env.SEED);
    const { usuario } = payload;
    res.json({
        usuario: usuario,
        token: token,
        menu: usuario.menu
    }
    )
    
});

module.exports = router;