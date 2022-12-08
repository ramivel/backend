const {Client} = require('pg');
const connectionData = {
  user: "postgres",
  host: "localhost",
  database: "prueba",
  password: "postgres",
  port: 5432,
};
const client = new Client(connectionData);

client.connect((req, res) =>{
    if(req)
        console.log(`Ha ocurrido un error ${req}`);
    else
        console.log('La base de datos se conecto correctamente.');
});

module.exports = client;