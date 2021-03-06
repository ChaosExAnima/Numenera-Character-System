'use strict';

/**
 * Module dependencies.
 */
var express = require('express'),
    fs = require('fs');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Load configurations
// Set the node environment variable if not set before
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Define Walk function.
var walk = function(path) {
    fs.readdirSync(path).forEach(function(file) {
        var newPath = path + '/' + file;
        var stat = fs.statSync(newPath);
        if (stat.isFile()) {
            if (/(.*)\.(js$|coffee$)/.test(file)) {
                require(newPath);
            }
        } else if (stat.isDirectory()) {
            walk(newPath);
        }
    });
};

// Initializing system variables 
var config = require('./config/config'),
    mongoose = require('mongoose');

// Bootstrap db connection
var db = mongoose.connect(config.db);

// Bootstrap models
var modelsPath = __dirname + '/app/models';
walk(modelsPath);

var app = express();

// Express settings
require('./config/express')(app, db);

// Bootstrap routes
require('./config/routes')(app);

// Start the app by listening on <port>
var port = process.env.PORT || config.port;
var server = app.listen(port);
console.log('Express app started on port ' + port);

// Start Socket.io
require('./config/socket-io')(app, server);

// Expose app
exports = module.exports = app;