'use strict';

var mongoose = require('mongoose'),
	Character = mongoose.model('Character');

exports.render = function(req, res) {
	Character.find({}, 'name player', { sort: { 'name' : 1 } }, function(err, characters) {
		res.render('index', {
			title: 'Character Selection',
			characters: characters
		});
	});
};