'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		assets: grunt.file.readJSON('config/assets.json'),
		watch: {
			js: {
				files: ['gruntfile.js', 'server.js', 'app/**/*.js', 'app/**/*.coffee', 'public/js/**'],
				// tasks: ['jshint'],
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
			},
			fixtures: {
				files: ['fixtures/*.json'],
				tasks: ['shell:update_db'],
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

	//Load NPM tasks
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-csslint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-env');
	grunt.loadNpmTasks('grunt-shell');

	//Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	//Default task(s).
	if (process.env.NODE_ENV === 'production') {
		grunt.registerTask('default', ['csslint', 'cssmin', 'uglify', 'concurrent']);
	} else {
		grunt.registerTask('default', ['csslint', 'concurrent']);
	}
	grunt.registerTask('minify', ['csslint', 'cssmin', 'uglify']);
};