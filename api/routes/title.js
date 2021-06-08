'use strict'

var express = require('express');
var TitleController = require('../controllers/title');
var api = express.Router();
var md_auth = require('../middlewares/authenticated');

var multipart = require('connect-multiparty');

api.get('/inTitles', TitleController.inTitles);
api.post('/add-titulo', TitleController.saveTitle);
api.get('/random', TitleController.getRandomTitle);
module.exports = api;