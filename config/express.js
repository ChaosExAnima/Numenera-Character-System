'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
	assetmanager = require('assetmanager'),
	config = require('./config');

module.exports = function(app, db) {
	app.set('showStackError', true);

	// Prettify HTML
	app.locals.pretty = true;

	// Should be placed before express.static
	// To ensure that all assets and data are compressed (utilize bandwidth)
	app.use(express.compress({
		filter: function(req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		// Levels are specified in a range of 0 to 9, where-as 0 is
		// no compression and 9 is best compression, but slowest
		level: 9
	}));

	// Only use logger for development environment
	if (process.env.NODE_ENV === 'development') {
		app.use(express.logger('dev'));
	}

	// set up Jade
	app.set('views', config.root + '/app/views');
	app.set('view engine', 'jade');

	// Set up Stylus
	var stylus = require('stylus'),
		nib = require('nib');

	app.use(stylus.middleware({
		src: config.root + '/app',
		dest: config.root + '/public',
		compress: false,
		compile: function(str, path) {
			return stylus(str)
				.set('filename', path)
				.use(nib())
				.import('nib');
		}
	}));
	app.use(express.bodyParser());

	// Enable jsonp
	app.enable('jsonp callback');

	app.configure(function() {
		// The cookieParser should be above session
		app.use(express.cookieParser());

		// Request body parsing middleware should be above methodOverride
		app.use(express.urlencoded());
		app.use(express.json());
		app.use(express.methodOverride());

		// Import your asset file
		var assets = require('./assets.json');
		assetmanager.init({
			js: assets.js,
			css: assets.css,
			debug: (process.env.NODE_ENV !== 'production'),
			webroot: 'public'
		});

		// Add assets to local variables
		app.use(function (req, res, next) {
			res.locals({
				assets: assetmanager.assets
			});
			next();
		});

		// Set up nav defaults.
		app.use(function(req, res, next) {
			res.locals({
				nav: [
					{
						url: '/',
						name: 'Home',
						active: true
					}
				],
				debug: (process.env.NODE_ENV !== 'production')
			});
			next();
		});

		// Routes should be at the last
		app.use(app.router);

		// Setting the fav icon and static folder
		app.use(express.static(config.root + '/public'));
		app.use(express.favicon());

		// Assume "not found" in the error msgs is a 404. this is somewhat
		// silly, but valid, you can do whatever you like, set properties,
		// use instanceof etc.
		app.use(function(err, req, res, next) {
			// Treat as 404
			if (~err.message.indexOf('not found')) return next();

			// Log it
			console.error(err.stack);

			// Error page
			res.status(500).render('500', {
				error: err.stack,
				title: '500 Server Error! :('
			});
		});

		// Assume 404 since no middleware responded
		app.use(function(req, res) {
			res.status(404).render('404', {
				url: req.originalUrl,
				back: req.header('Referer'),
				error: 'Not found',
				title: '404 Not Found! :('
			});
		});
	});
};