'use strict';

module.exports = function(app) {
	var index = require('../app/controllers/index'),
		character = require('../app/controllers/character');

	app.get('/', index.render);
	app.get('/character/:name', character.detail);
	app.get('/character/:name/:page', character.detail);
};