"use strict";
var bcrypt = require("bcrypt-nodejs");
var moongosePaginate = require("mongoose-pagination");
var fs = require("fs");
var path = require("path");
const { getTemplate, sendEmail } = require("../config/mail.config");

var User = require("../models/user");
var Follow = require("../models/follow");
var Publication = require("../models/publication");
var Message = require("../models/message");
var jwt = require("../services/jwt");
const user = require("../models/user");
const { count } = require("../models/user");

//REGISTRO
function saveUser(req, res) {
  var params = req.body;
  var user = new User();

  if (
    params.name &&
    params.surname &&
    params.nick &&
    params.email &&
    params.password
  ) {
    user.name = params.name;
    user.surname = params.surname;
    user.nick = params.nick;
    user.email = params.email;
    user.role = "USER";
    user.image = null;

    //Controlar usuarios duplicados
    User.find({
      $or: [
        { email: user.email.toLowerCase() },
        { nick: user.nick.toLowerCase() },
      ],
    }).exec((err, users) => {
      if (err)
        return res
          .status(500)
          .send({ message: "Error en la petición de usuarios" });

      if (users && users.length >= 1) {
        return res
          .status(200)
          .send({ message: "¡El usuario que intentas registrar ya existe!" });
      } else {
        //Cifra la password y me guarda los datos
        bcrypt.hash(params.password, null, null, (err, hash) => {
          user.password = hash;
          const template = getTemplate(user.name);

          // Enviar el email
          sendEmail(user.email, "Este es un email de prueba", template);
          user.save((err, userStored) => {
            if (err)
              return res.status(500).send({
                message: "Error al guardar el usuario",
              });
            if (userStored) {
              res.status(200).send({ user: userStored });
            } else {
              res
                .status(404)
                .send({ message: "No se ha registrado el usuario" });
            }
          });
        });
      }
    });
  } else {
    res.status(200).send({
      message: "Rellena todos los campos obligatorios",
    });
  }
}

//LOGIN
function loginUser(req, res) {
  var params = req.body;

  var email = params.email;
  var password = params.password;

  User.findOne({ email: email }, (err, user) => {
    if (err) return res.status(500).send({ message: "Error en la peticion" });

    if (user) {
      bcrypt.compare(password, user.password, (err, check) => {
        if (check) {
          //devolver datos de usuario
          if (params.gettoken) {
            //generar y devolver token
            return res.status(200).send({
              token: jwt.createToken(user),
            });
          } else {
            user.password = undefined; //eliminamos la propiedad password, de esta manera el servidor no la devuelve (mas seguridad)
            return res.status(200).send({ user });
          }
        } else {
          return res
            .status(404)
            .send({ message: "El usuario no se ha podido identificar" });
        }
      });
    } else {
      return res
        .status(404)
        .send({ message: "El usuario no se ha podido identificar!!" });
    }
  });
}

//CONSEGUIR DATOS DE UN USUAIRO
function getUser(req, res) {
  var userId = req.params.id;

  User.findById(userId, (err, user) => {
    if (err) return res.status(500).send({ message: "Error en la petición" });

    if (!user) return res.status(404).send({ message: "El usuario no existe" });

    followThisUsers(req.user.sub, userId).then((value) => {
      user.password = undefined;
      return res
        .status(200)
        .send({ user, following: value.following, followed: value.followed });
    });
  });
}

async function followThisUsers(identity_user_id, user_id) {
  var following = await Follow.findOne({
    user: identity_user_id,
    followed: user_id,
  })
    .exec()
    .then((follow) => {
      return follow;
    })
    .catch((err) => {
      return handleError(err);
    });

  var followed = await Follow.findOne({
    user: user_id,
    followed: identity_user_id,
  })
    .exec()
    .then((follow) => {
      console.log(follow);
      return follow;
    })
    .catch((err) => {
      return handleError(err);
    });

  return {
    following: following,
    followed: followed,
  };
}

//DEVOLVER LISTADO DE USUARIOS PAGINADOS
function getUsers(req, res) {
  var identity_user_id = req.user.sub; //id del usuario logueado (payload) video 24

  var page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  var itemsPerPage = 6;

  User.find()
    .sort("_id")
    .paginate(page, itemsPerPage, (err, users, total) => {
      if (err) return res.status(500).send({ message: "Error en la petición" });

      if (!users)
        return res.status(404).send({ message: "No hay usuarios disponibles" });

      followUsersIds(identity_user_id).then((value) => {
        return res.status(200).send({
          users,
          user_following: value.following,
          users_follow_me: value.followed,
          total,
          pages: Math.ceil(total / itemsPerPage),
        });
      });
    });
}

function getAllUsers(req, res) {
  // var identity_user_id = req.user.sub; //id del usuario logueado (payload) video 24

  var page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  var itemsPerPage = 6;

  User.find()
    .sort("_id")
    .paginate(page, itemsPerPage, (err, users, total) => {
      if (err) return res.status(500).send({ message: "Error en la petición" });

      if (!users)
        return res.status(404).send({ message: "No hay usuarios disponibles" });

      return res.status(200).send({
        users,
        total,
        pages: Math.ceil(total / itemsPerPage),
      });
    });
}
async function followUsersIds(user_id) {
  var following = await Follow.find({ user: user_id })
    .select({ _id: 0, __v: 0, user: 0 })
    .exec()
    .then((follows) => {
      var follows_clean = [];

      follows.forEach((follow) => {
        follows_clean.push(follow.followed);
      });

      return follows_clean;
    })

    .catch((err) => {
      return handleError(err);
    });

  var followed = await Follow.find({ followed: user_id })
    .select({ _id: 0, __v: 0, followed: 0 })
    .exec()
    .then((follows) => {
      var follows_clean = [];

      follows.forEach((follow) => {
        follows_clean.push(follow.user);
      });

      return follows_clean;
    })

    .catch((err) => {
      return handleError(err);
    });

  return {
    following: following,

    followed: followed,
  };
}

function getCounters(req, res) {
  var userId = req.user.sub;

  if (req.params.id) {
    userId = req.params.id;
  }

  getCountFollow(userId).then((value) => {
    return res.status(200).send(value);
  });
}

async function getCountFollow(user_id) {
  var following = await Follow.countDocuments({ user: user_id })
    .exec()
    .then((count) => {
      console.log(count);
      return count;
    })
    .catch((err) => {
      return handleError(err);
    });

  var followed = await Follow.countDocuments({ followed: user_id })
    .exec()
    .then((count) => {
      return count;
    })
    .catch((err) => {
      return handleError(err);
    });

  var publications = await Publication.countDocuments({ user: user_id })
    .exec()
    .then((count) => {
      return count;
    })
    .catch((err) => {
      return handleError(err);
    });

  return {
    following: following,
    followed: followed,
    publications: publications,
  };
}
//ACTUALIZAR DATOS DE USUARIO
async function updateUser(req, res) {
  var userId = req.params.id;
  var update = req.body;

  // borrar la propiedad password
  delete update.password;

  if (userId != req.user.sub) {
    return res.status(500).send({
      message: "No tienes permiso para actualizar los datos del usuario",
    });
  }

  User.find({
    $or: [
      { email: update.email.toLowerCase() },
      { nick: update.nick.toLowerCase() },
    ],
  }).exec((err, users) => {
    var user_isset = false;
    users.forEach((user) => {
      if (user && user._id != userId) user_isset = true;
    });

    if (user_isset)
      return res.status(404).send({ message: "Los datos ya están en uso" });

    User.findByIdAndUpdate(
      userId,
      update,
      { new: true },
      (err, userUpdated) => {
        if (err)
          return res.status(500).send({ message: "Error en la petición" });

        if (!userUpdated)
          return res
            .status(404)
            .send({ message: "No se ha podido actualizar el usuario" });

        return res.status(200).send({ user: userUpdated });
      }
    );
  });
}

//SUBIR AVATAR DE USUARIO
function uploadImage(req, res) {
  var userId = req.params.id;

  if (req.files) {
    console.log(req.files);
    var file_path = req.files.image.path;
    console.log(file_path);
    //var file_split = file_path.split("\\");
	var file_split = file_path.split("/");
    console.log(file_split);

    var file_name = file_split[2];
    console.log(file_name);

    var ext_split = file_name.split(".");
    console.log(ext_split);
    var file_ext = ext_split[1];
    console.log(file_ext);

    if (userId != req.user.sub) {
      return removeFilesOfUpload(
        res,
        file_path,
        "No tienes permiso para actualizar los datos del usuario"
      );
    }

    if (
      file_ext == "png" ||
      file_ext == "jpg" ||
      file_ext == "jpeg" ||
      file_ext == "gif"
    ) {
      //Actualizar avatar de usuario logado
      User.findByIdAndUpdate(
        userId,
        { image: file_name },
        { new: true },
        (err, userUpdated) => {
          if (err)
            return res.status(500).send({ message: "Error en la petición" });

          if (!userUpdated)
            return res
              .status(404)
              .send({ message: "No se ha podido actualizar el usuario" });

          return res.status(200).send({ user: userUpdated });
        }
      );
    } else {
      return removeFilesOfUpload(res, file_path, "Extension no valida");
    }
  } else {
    return res.status(200).send({ message: "No se han subido imagenes" });
  }
}

function removeFilesOfUpload(res, file_path, message) {
  fs.unlink(file_path, (err) => {
    return res.status(200).send({ message: message });
  });
}

function getImageFile(req, res) {
  var image_file = req.params.imageFile;
  var path_file = "./uploads/users/" + image_file;

  fs.exists(path_file, (exists) => {
    if (exists) {
      res.sendFile(path.resolve(path_file));
    } else {
      res.status(200).send({ message: "No existe la imagen..." });
    }
  });
}

function deleteUserAsAdmin(req, res) {
  var userId = req.params.id;

  User.find({ _id: userId }).deleteOne((err, userRemoved) => {
    if (err)
      return res.status(500).send({ message: "Error al borrar usuario" });

    Follow.find({ $or: [{ user: userId }, { followed: userId }] }).deleteMany(
      (err, followRemoved) => {
        if (err) console.log("Error follow");

        Message.find({
          $or: [{ emitter: userId }, { receiver: userId }],
        }).deleteMany((err, messageRemoved) => {
          if (err) console.log("Error mensaje");

          Publication.find({ user: userId }).deleteMany(
            (err, publicationRemoved) => {
              if (err) if (err) console.log("Error pub");

              if (!userRemoved)
                return res
                  .status(404)
                  .send({ message: "No se ha borrado el usuario " });

              if (
                userRemoved.n == 1 &&
                followRemoved.n == 1 &&
                messageRemoved.n == 1 &&
                publicationRemoved.n == 1
              ) {
                return res
                  .status(200)
                  .send({ message: "Usuaurio eliminada correctamente" });
              } else {
                return res
                  .status(404)
                  .send({ message: "Error al borrar usuario" });
              }
            }
          );
        });
      }
    );
  });
}

function findUser(req, res) {
  let params = req.body;
  User.find(
    {
      $or: [
        { nick: new RegExp(params.word, "i") },
        { name: new RegExp(params.word, "i") },
      ],
    },
    function (err, docs) {
      return res.json(docs);
    }
  );
}
module.exports = {
  saveUser,
  loginUser,
  getUser,
  getUsers,
  getCounters,
  updateUser,
  uploadImage,
  getImageFile,
  deleteUserAsAdmin,
  getAllUsers,
  findUser,
};
