const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check } = require('express-validator');
const { loginPost } = require('../controllers/login.controllers');
const { usuarioDatos, verificarUsuario } = require('../middlewares/validar-datos-login');
const { validarCampos } = require('../middlewares/validar-campos');
const { Client } = require('pg');

const routerAutenticacion = require('express').Router();

routerAutenticacion.post('/', [usuarioDatos],
[check('datos', 'Datos no Validos').notEmpty(), verificarUsuario, validarCampos],
loginPost);

module.exports = routerAutenticacion;