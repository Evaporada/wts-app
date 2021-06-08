'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TitleSchema = Schema({
    text: String

});

module.exports = mongoose.model('Title', TitleSchema);