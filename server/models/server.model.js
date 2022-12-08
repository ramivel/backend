require('../config/config.js');
const express = require('express');
const cors = require('cors');

const app = express();

const indexRouter = require('../routes/index.router');
const autenticacionRouter = require('../routes/autenticacion.router');
const usuarioRouter = require('../routes/usuario.router');

class Server {
  constructor(){
    this.app = express();
    this.port = process.env.PORT;
    this.middlewares();
    this.routes();
  }
  middlewares(){
    this.app.use(cors());
    this.app.use(express.json()); // Utilizar el body en formato json
  }
  routes(){
    this.app.use('/api', indexRouter);
    this.app.use('/api/autenticacion', autenticacionRouter);
    this.app.use('/api/usuario', usuarioRouter);
  }
  listen(){
    this.app.listen(this.port, () => {
      console.log(`Servicio iniciado en el puerto: ${this.port}`);
    });
  }
}

module.exports = Server;