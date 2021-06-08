'use strict'

var express = require('express');
var MessageController = require('../controllers/message');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

api.post('/mensajes', md_auth.ensureAuth, MessageController.saveMessage);
api.get('/mis-mensajes/:page?', md_auth.ensureAuth, MessageController.getReceivedMessages);
api.get('/mensajes/:page?', md_auth.ensureAuth, MessageController.getEmmitMessages);
api.get('/noleidos-messages', md_auth.ensureAuth, MessageController.getUnviewedMessages);
api.put('/marcar-mensajes-vistos', md_auth.ensureAuth, MessageController.setViewedMessages);

module.exports = api;