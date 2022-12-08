const express = require('express');
const routerIndex = express.Router();

routerIndex.get('/', (req, res) => {
    return res.json({ 'titulo' : 'Servicio BackEnd Plantilla'});
});

module.exports = routerIndex;