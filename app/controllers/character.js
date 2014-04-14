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
	// Initial read.
	socket.on('character:read', function(data) {
		var name = data.id;
		delete data.id;

		Character.findByName(name, function(err, character) {
			if(err) {
				console.error('ERROR:', err);
				return;
			}

			character = character.toObject();			
			console.log('Returning', character.name, 'state');

			// Experience date formatting
			var pad = function(str) {
				str = str.toString();
				return str.length < 2 ? '0'+str : str;
			};

			character.experience.log.forEach(function(item, key) {
				var date = new Date(item.date);

				if( date.getTime() === 0 ) {
					date = '';
				} else {
					date = date.getFullYear()+'-'+pad(date.getMonth())+'-'+pad(date.getDate());
				}

				character.experience.log[key].date = date;
			});

			socket.emit('character/'+name+':read', character);
		});
	});

	// Updates.
	socket.on('character:patch', function(data) {
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
};