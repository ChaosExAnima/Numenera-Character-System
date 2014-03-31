'use strict';

module.exports = function(app, server) {
	var socketIO = require('socket.io').listen(server),
		character = require('../app/controllers/character');

	socketIO.sockets.on('connection', function(socket) {
		character.respond(socket);
	});

	return socketIO;
}
