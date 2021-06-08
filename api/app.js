//Usao de JavaScript
'use strict'

//Solicita el uso de express
var express = require('express');
//Carga el framework express
var app = express();
//Convierte el body de las peticiones recibidas a un objeto JavaScript
var bodyParser = require('body-parser');
var path = require('path');

//Carga las diferentes rutas
var user_routes = require('./routes/user');
var follow_routes = require('./routes/follow');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');
var title_routes = require('./routes/title');


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

//Cors - evita problemas de acceso entre front y back, permitiendo accesos por http
//Cabeceras http
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});

//Routes -> Controla todas las peiciones que llegan al API
app.use('/', express.static('client', {redirect: false}));
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);
app.use('/api', title_routes);

app.get('*', function(req,res,next) {
	return res.sendFile(path.resolve('client/index.html'));
});
//Exporta todo la configuración para usarse en index.js
module.exports = app;