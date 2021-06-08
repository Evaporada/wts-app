"use strict";

var path = require("path");
var fs = require("fs");
var moment = require("moment");
var moongosePaginate = require("mongoose-pagination");

var Publication = require("../models/publication");
var User = require("../models/user");
var Follow = require("../models/follow");

//Crear una publicacion con todos sus atributos. Likes siempre a 0.
function savePublication(req, res) {
  var params = req.body;

  if (!params.text)
    return res.status(200).send({ message: "¡Debes enviar un texto!" }); //sino me llega texto no devolvemos nada

  var publication = new Publication();
  publication.text = params.text;
  publication.file = "null";
  publication.title = params.title;
  publication.user = req.user.sub;
  publication.likes = 0; //al crear hay cero likes
  //No hace falta añadir propiedad likedBy
  publication.created_at = moment().unix();

  publication.save((err, publicationStored) => {
    if (err)
      return res
        .status(500)
        .send({ message: "Error al guardar la publicacion." });
    if (!publicationStored)
      res.status(404).send({ message: "La publiacion no ha sido guardada." });

    return res.status(200).send({ publication: publicationStored });
  });
}

//TIMELINE (Solo se muestran publicaciones de la gente a la que se sigue)
function getPublications(req, res) {
  var page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  var itemsPerPage = 4;

  Follow.find({ user: req.user.sub })
    .populate("followed")
    .exec((err, follows) => {
      if (err)
        return res
          .status(500)
          .send({ message: "Error al devolver el seguimiento." });

      var follows_clean = [];

      follows.forEach((follow) => {
        follows_clean.push(follow.followed);
      });
      follows_clean.push(req.user.sub);
      //publicaciones de los usuarios que sigo ordenadas de mas nuevas a mas viejas
      Publication.find({ user: { $in: follows_clean } })
        .sort("-created_at")
        .populate("user")
        .paginate(page, itemsPerPage, (err, publications, total) => {
          if (err)
            return res
              .status(500)
              .send({ message: "Error al devolver publicaciones." });

          if (!publications)
            return res.status(404).send({ message: "No hay publicaciones." });

          return res.status(200).send({
            total_items: total,
            pages: Math.ceil(total / itemsPerPage),
            page: page,
            items_per_page: itemsPerPage,
            publications,
          });
        });
    });
}

function getPublicationsUser(req, res) {
  var page = 1;
  if (req.params.page) page = req.params.page;

  var user_id = req.user.sub;

  if (req.params.user) {
    user_id = req.params.user;
  }
  var itemsPerPage = 4;

  //Comprueba si los usarios extraídos se encuentran dentro de la propiedad user de las publicaciones anteriores
  Publication.find({ user: user_id })
    .sort("-created_at")
    .populate("user")
    .paginate(page, itemsPerPage, (err, publications, total) => {
      if (err)
        return res
          .status(500)
          .send({ message: "Error al devolver publicaciones" });

      if (!publications)
        if (err)
          return res.status(404).send({ message: "No hay publicaciones" });
      //console.log("Publications" + publications);
      return res.status(200).send({
        total_items: total,
        pages: Math.ceil(total / itemsPerPage),
        page: page,
        items_per_page: itemsPerPage,
        publications,
      });
    });
}

//ACCEDER A UNA PUBLICACION CONCRETA (no implementado en front)
function getPublication(req, res) {
  var publicationId = req.params.id;
  Publication.findById(publicationId, (err, publication) => {
    if (err)
      return res
        .status(500)
        .send({ message: "Error al devolver publicaciones." });

    if (!publication)
      return res.status(404).send({ message: "No existe la publicación." });

    return res.status(200).send({ publication });
  });
}

//ELIMINAR PUBLICACION
function deletePublication(req, res) {
  var publicationId = req.params.id;

  Publication.find({ user: req.user.sub, _id: publicationId }).remove(
    (err, publicationRemoved) => {
      if (err)
        return res
          .status(500)
          .send({ message: "Error al borrar publicaciones" });
      if (!publicationRemoved)
        return res
          .status(404)
          .send({ message: "No se ha borrado la publicacion " });

      if (publicationRemoved.n == 1) {
        return res
          .status(200)
          .send({ message: "Publicacion eliminada correctamente" });
      } else {
        return res.status(404).send({ message: "Error al borrar publicacion" });
      }
    }
  );
}

function deletePublicationAsAdmin(req, res) {
  var publicationId = req.params.id;

  Publication.find({ _id: publicationId }).remove((err, publicationRemoved) => {
    if (err)
      return res.status(500).send({ message: "Error al borrar publicaciones" });
    if (!publicationRemoved)
      return res
        .status(404)
        .send({ message: "No se ha borrado la publicacion " });

    if (publicationRemoved.n == 1) {
      return res
        .status(200)
        .send({ message: "Publicacion eliminada correctamente" });
    } else {
      return res.status(404).send({ message: "Error al borrar publicacion" });
    }
  });
}

//SUBIR IMAGENES EN PUBLICACION (no se si estará en la version final)
function uploadImage(req, res) {
  var publicationId = req.params.id;

  if (req.files) {
    var file_path = req.files.image.path;

   // var file_split = file_path.split("\\");
	var file_split = file_path.split("/");
    var file_name = file_split[2];

    var ext_split = file_name.split(".");

    var file_ext = ext_split[1];

    if (
      file_ext == "png" ||
      file_ext == "jpg" ||
      file_ext == "jpeg" ||
      file_ext == "gif"
    ) {
      Publication.findOne({ user: req.user.sub, _id: publicationId }).exec(
        (err, publication) => {
          console.log(publication);

          if (publication) {
            // Actualizar documento de publicación

            Publication.findByIdAndUpdate(
              publicationId,
              { file: file_name },
              { new: true },
              (err, publicationUpdated) => {
                if (err)
                  return res
                    .status(500)
                    .send({ message: "Error en la petición" });

                if (!publicationUpdated)
                  return res
                    .status(404)
                    .send({ message: "No se ha podido actualizar el usuario" });

                return res
                  .status(200)
                  .send({ publication: publicationUpdated });
              }
            );
          } else {
            return removeFilesOfUploads(
              res,
              file_path,
              "No tienes permiso para actualizar esta publicacion"
            );
          }
        }
      );
    } else {
      return removeFilesOfUploads(res, file_path, "Extensión no válida");
    }
  } else {
    return res.status(200).send({ message: "No se han subido imagenes" });
  }
}

function removeFilesOfUploads(res, file_path, message) {
  fs.unlink(file_path, (err) => {
    return res.status(200).send({ message: message });
  });
}

function getImageFile(req, res) {
  var imageFile = req.params.imageFile;
  var pathFile = `./uploads/publications/${imageFile}`;

  fs.exists(pathFile, (exists) => {
    if (exists) {
      res.sendFile(path.resolve(pathFile));
    } else {
      res.status(200).send({ message: "No existe la imagen" });
    }
  });
}

//DEVOLVER TODAS LAS PUBLICACIONES (en caso de no existir sesion iniciada se ven todas las publicaciones)
function getAllPublications(req, res) {
  //var identity_user_id = req.user.sub; // no hace falta creo

  var page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  var itemsPerPage = 6;

  Publication.find()
    .sort("-created_at")
    .populate("user")
    .paginate(page, itemsPerPage, (err, publications, total) => {
      if (err)
        return res
          .status(500)
          .send({ message: "Error al devolver publicaciones." });

      if (!publications)
        return res.status(404).send({ message: "No hay publicaciones." });

      return res.status(200).send({
        total_items: total,
        pages: Math.ceil(total / itemsPerPage),
        page: page,
        items_per_page: itemsPerPage,
        publications,
      });
    });
}

function updateLikesPub(req, res) {
  var publicationId = req.params.id;
  if (!publicationId) {
    res.json({ success: false, message: "No se proporcionó ninguna identificación." }); // Se devuelve error
  } else {
    // Se busca en la bbdd por id
    Publication.findOne({ _id: publicationId }, (err, publication) => {
      // Comprobaciones
      console.log("user", req.user.sub);
      console.log("pub", publication.user);
      if (req.user.sub == publication.user) {
        return res.send({ message: "No puedes dar like a tu propia publicación" });
      } else {
        
        if (publication.likedBy.includes(req.user.sub)) {
          return res.send({ message: "Ya has dado like a esta publicación" });
     
        } else {
          publication.likes++; //Se incrementa en uno los likes
          publication.likedBy.push(req.user.sub); // Se añade al array el id del usuario que dio like
    
          publication.save((err, publicationStored) => {
            if (err) {
              return res.send({ message: "Algo ha ido mal..." });
            } else {
              return res.send({ publication: publicationStored });
            }
          });
        }
      }
    });
    //-----------------------------------------
  }
}
function unlike(req, res) {
  var publicationId = req.params.id;
  if (!publicationId) {
    res.json({ success: false, message: "No se proporcionó ninguna identificación." }); 
  } else {
 
    Publication.findOne({ _id: publicationId }, (err, publication) => {
  
      console.log("user", req.user.sub);
      console.log("pub", publication.user);
      if (req.user.sub == publication.user) {
        return res.send({ message: "No puedes unlikear tu propia publicación." });
      } else {
    
        if (!publication.likedBy.includes(req.user.sub)) {
          return res.send({ message: "No diste me gusta a esta publicación" });
       
        } else {
          publication.likes--; //Se resta un like
          publication.likedBy.remove(req.user.sub);  //Se elimina del array el id del usuario que quitó su like
       
          publication.save((err, publicationStored) => {
            if (err) {
              return res.send({ message: "Algo ha ido mal..." });
            } else {
              return res.send({ publication: publicationStored });
            }
          });
        }
      }
    });
    //-----------------------------------------
  }
}

module.exports = {
  savePublication,
  getPublications,
  getPublicationsUser,
  getPublication,
  deletePublication,
  uploadImage,
  getImageFile,
  getAllPublications,
  deletePublicationAsAdmin,
  updateLikesPub,
  unlike,
};
