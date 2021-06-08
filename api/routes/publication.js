'use strict'

var express = require('express');
var PublicationController = require('../controllers/publication');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');
var md_upload = multipart({ uploadDir: './uploads/publications'});

api.post('/publication', md_auth.ensureAuth, PublicationController.savePublication);
api.get('/publications/:page?', md_auth.ensureAuth, PublicationController.getPublications);
api.get('/publications-user/:user/:page?', md_auth.ensureAuth, PublicationController.getPublicationsUser);

api.get('/publication/:id', md_auth.ensureAuth, PublicationController.getPublication);
api.delete('/publication/:id', md_auth.ensureAuth, PublicationController.deletePublication);
api.delete('/delete-pub-admin/:id', md_auth.ensureAuth, PublicationController.deletePublicationAsAdmin);

api.post('/upload-image-pub/:id', [md_auth.ensureAuth, md_upload], PublicationController.uploadImage);
api.get('/get-image-pub/:imageFile', PublicationController.getImageFile);
api.get('/publicaciones', md_auth.ensureAuth, PublicationController.getAllPublications);
api.get('/allpublications/:page?',PublicationController.getAllPublications);
api.put('/likespub/:id?', md_auth.ensureAuth, PublicationController.updateLikesPub);
api.put('/unlike/:id?', md_auth.ensureAuth, PublicationController.unlike);

module.exports = api;