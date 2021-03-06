'use strict';

module.exports = function(grunt) {
	var config = require('./config/config');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		assets: grunt.file.readJSON('config/assets.json'),
		watch: {
			js: {
				files: ['gruntfile.js', 'server.js', 'app/**/*.js', 'app/**/*.coffee', 'public/js/**'],
				tasks: ['jshint'],
				options: {
					livereload: true
				}
			},
			html: {
				files: ['public/views/**', 'app/views/**'],
				options: {
					livereload: true
				}
			},
			css: {
				files: ['public/css/**', 'app/css/**'],
				tasks: ['csslint'],
				options: {
					livereload: true
				}
			}
		},
		jshint: {
			all: {
				src: ['gruntfile.js', 'server.js', 'app/**/*.js', 'public/js/**'],
				options: {
					jshintrc: true
				}
			}
		},
		uglify: {
			options: {
				compress: false,
				sourceMap: true
			},
			production: {
				files: '<%= assets.js %>'
			}
		},
		csslint: {
			options: {
				csslintrc: '.csslintrc'
			},
			all: {
				src: ['public/css/**/*.css']
			}
		},
		cssmin: {
			combine: {
				files: '<%= assets.css %>'
			}
		},
		fixtures: {
			options: {
				db: config.db,
				schema: __dirname + '/app/models/characters.js',
				model: 'Character'
			},
			files: ['fixtures/*.json']
		},
		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					args: [],
					ignore: ['public/**'],
					ext: 'js,html',
					nodeArgs: ['--debug'],
					delayTime: 1,
					env: {
						PORT: 3000
					},
					cwd: __dirname
				}
			}
		},
		concurrent: {
			tasks: ['nodemon', 'watch'],
			options: {
				logConcurrentOutput: true
			}
		}
	});

	// Load NPM tasks
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-csslint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-env');

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	// Basic Tasks.
	grunt.registerTask('default', ['csslint', 'jshint', 'concurrent']); // Development.
	grunt.registerTask('compile', ['csslint', 'jshint', 'cssmin', 'uglify']); // Production.

	// Custom Tasks.
	grunt.registerMultiTask('fixtures', 'Loads fixture data into DB.', function() {
		// Load schema
		require(this.options().schema);

		// Loads models.
		var mongoose = require('mongoose').connect(this.options().db),
			model = mongoose.model(this.options().model),
			path = require('path'),
			done = this.async(),
			files = this.filesSrc;

		// Clean old data.
		model.remove({}, function(err) {
			if(err) {
				console.error('ERROR:', err);
				done();
				return;
			}

			console.log('Removed old documents.');

			// Load new data.
			files.forEach( function(fixturePath) {
				fixturePath = path.resolve(fixturePath);
				
				if( fixturePath ) {
					console.log('Loading:', fixturePath);

					var data = require(fixturePath);
					model.create(data);
				}			
			});

			done();
		});
	});
};