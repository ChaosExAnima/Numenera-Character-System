'use strict';

var mongoose = require('mongoose'),
	Character = mongoose.model('Character');

exports.detail = function(req, res) {
	var name = req.params.name,
		page = req.params.page;

	Character.findOne({ name: name }, function(err, character) {
		res.locals.nav[0].active = false;

		res.locals.nav.push({
			active: true,
			url: '/character/'+character.name,
			name: character.name
		});

		res.render('character/detail', {
			title: character.name,
			character: character,
			page: page ? page : 1,
			skillDefault: { name: '', trained: false, specialized: false },
			attackDefault: { name: '', mod: '', damage: '' },
			experienceDefault: { date: '', val: '', notes: '' }
		});
	});
};

exports.respond = function(socket) {
	socket.on('character:patch', function(data, callback) {
		var name = data.id;
		delete data.id;
		console.log('Update for', name, 'with', data);

		Character.findByName(name, function(err, character) {
			var lo = require('lodash'),
				obj = {};

			lo.each(data, function(val, key) {
				var bits = key.split('.');				

				lo.each(bits, function(k) {
					// obj[k] = 
				});
			});
		});

		return;

		Character.findByNameAndUpdate(name, data, function(err, character) {
			console.log('Updated', character.name);

			socket.broadcast.emit('character/'+name+':update', data);
		});		
		
	});
};