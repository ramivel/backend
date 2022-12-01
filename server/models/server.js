require('../config/config');
const express = require('express')
const morgan = require('morgan')
const cors = require('cors');
const indexRouter = require('../routes/index');
const path = require('path');
const app = express();
class Server {
    constructor(){
        this.app = express();
        this.port = process.env.PORT;
        this.middlewares();
        this.routes();
    }
    middlewares(){
       this.app.use(cors());
       this.app.use( express.json() );
       this.app.use(express.static('public')); 
    }
    routes(){
        this.app.use('/', indexRouter);
        this.app.use('/login', require('../routes/login.routing'));
        this.app.use('/usuario', require('../routes/usuario.routing'));
        this.app.use('/asig-carga', require('../routes/asig-carga.routing'));
        this.app.use('/roles', require('../routes/roles.routing'));
        this.app.use('/creacion', require('../routes/creacion.routing'));
        this.app.use('/dashboard', require('../routes/dashboard.routing'));
        this.app.use('/segmentacion', require('../routes/segmentacio.routing'));
        this.app.use('/cobertura', require('../routes/cobertura-cartografica.routing'));
        this.app.use('/muestreo', require('../routes/muestreo.routing'));
    }
    listen(){
        this.app.listen(this.port, () => {
            console.log('Iniciando servicios puerto', this.port);
        });
    }
}
module.exports = Server;