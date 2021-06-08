'use strict'

const serverHttp = require('http').Server(app);
const io = require('socket.io');
var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;


//conexion a bbdd por promesa
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/wts', { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log("La conexion a la bbdd wts se ha realizado correctamente");
        //crear servidor
        app.listen(port, () => {
            console.log("Servidor corriendo en http://localhost:3800");
        })
    })
    .catch(err => console.log(err));

 /*   var TitleController = require('./controllers/title');
    var cron = require("node-cron");

 /*   cron.schedule("./15 * * * * *", () => {
 /*       TitleController.getRandomTitle
      }, {
        scheduled: true,
        timezone: "Europe/Madrid"
      });*/
