"use strict";

var path = require("path");
var fs = require("fs");
var moment = require("moment");
var cron = require("node-cron");

var Title = require("../models/title");
const title = require("../models/title");

function inTitles(req, res) {
  console.log(req.body);
  res.status(200).send({
    message: "Estoy en el controlador de titulos",
  });
}

//AÑADIR TITULO
function saveTitle(req, res) {
  var params = req.body;
  if (!params.text)
    return res.status(200).send({ message: "¡Debes enviar un titulo!" }); //sino me llega texto no devolvemos nada

  title.text = params.text.toLowerCase();
  console.log(`titulo` + title.text);
  Title.find({
    $or: [{ text: title.text.toLowerCase() }],
  }).exec((err, titles) => {
    if (err) {
      return res
        .status(500)
        .send({ message: "Error en la petición de titulos" });
    }
    console.log(titles.length);
    if (titles && titles.length >= 1) {
      return res.status(200).send({
        message: "El titulo que intentas añadir ya existe en la base de datos!",
      });
    } else {
      var title = new Title();
      title.text = params.text.toLowerCase();

      title.save((err, titleStored) => {
        if (err)
          return res
            .status(500)
            .send({ message: "Error al guardar el titulo." });
        if (!titleStored)
          res.status(404).send({ message: "El titulo ha sido guardado." });

        return res.status(200).send({ title: titleStored });
      });
    }
  });
}

function getRandomTitle(req, res) {
 
      Title.countDocuments().exec(function (err, count) {
        var random = Math.floor(Math.random() * count);

       Title.findOne()
          .skip(random)
          .exec(function (err, title) {
            if (err)
              return res.status(500).send({ message: "Error en la petición" });
            if (!title)
              return res
                .status(404)
                .send({ message: "No hay titulos disponibles" });

            console.log(title);
            return res.status(200).send({ title});
          });
      });
}

//Cron es usado para lanzar funciones cada x tiempo (no funciona en local, se necesita un host o un servidor)

function getRandomCron(){
  cron.schedule('*/15 * * * * *', () => {
    console.log('Running every 15 seconds');
  }, {
    scheduled: true,
    timezone: "Europe/Madrid"
  });
}

module.exports = {
  inTitles,
  saveTitle,
  getRandomTitle,
};
