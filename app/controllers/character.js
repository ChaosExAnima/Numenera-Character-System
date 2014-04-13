'use strict';

var mongoose = require('mongoose'),
	Character = mongoose.model('Character');

exports.detail = function(req, res) {
	var name = req.params.name,
		page = req.params.page;

	res.locals.nav[0].active = false;

	res.locals.nav.push({
		active: true,
		url: '/character/'+name,
		name: name
	});

	res.render('character/blank', {
		title: name,
		page: page ? page : 1,
		skillDefault: { name: '', trained: false, specialized: false },
		attackDefault: { name: '', mod: '', damage: '' },
		experienceDefault: { date: '', val: '', notes: '' }
	});
};

exports.respond = function(socket) {
	socket.on('character:patch', function(data, callback) {
		var name = data.id;
		delete data.id;

		Character.findByNameAndUpdate(name, data, function(err, character) {
			if(err) {
				console.error('ERROR:', err);
				return;
			}

			console.log('Updated', character.name, 'with', data);

			socket.broadcast.emit('character/'+name+':update', data);
		});
	});

	socket.on('character:read', function(data, callback) {
		var name = data.id;
		delete data.id;

		Character.findByName(name, function(err, character) {
			if(err) {
				console.error('ERROR:', err);
				return;
			}
			
			console.log('Returning', character.name, 'state');
			socket.emit('character/'+name+':read', character);
		});
	});
};