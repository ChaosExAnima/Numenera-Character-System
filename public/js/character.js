/**
 * Numenera Character Sheet App
 * Ephraim Gregor, 2014
 * ephraim@ephraimgregor.com
 */

/**
 * GLOBAL VARIABLES
 */

// usage: console.log('inside coolFunc',this,arguments);
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function() {
	log.history = log.history || [];	 // store logs to an array for reference
	log.history.push(arguments);
	if( this.console ) {
		console.log( Array.prototype.slice.call(arguments) );
	}
};

window.socket = io.connect('http://localhost');



var app = {};

$( function() {
	// ROUTER
	var AppRouter = Backbone.Router.extend({
		routes: {
			'character/:name(/:page)': 'character'
		},

		name : '',
		page : 1,

		character: function(name, page) {
			this.name = name;
			this.page = page != null ? page : 1;
			this.model = new Character();
			this.bodyView = new CharacterView();
			this.headerView = new HeaderView();
		}
	});

	// MODEL
	var Character = Backbone.Model.extend({

		socket: window.socket,
		noIoBind: false,
		urlRoot: 'character',
		
		initialize: function() {
			this.set('id', app.name);
			
			_.bindAll(this, 'serverChange', 'serverDelete', 'modelCleanup');

			if(!this.noIoBind) {
				this.ioBind('read', this.serverRead, this);
				this.ioBind('update', this.serverChange, this);
				this.ioBind('delete', this.serverDelete, this);
			}

			this.sync('read', this);
		},

		validate: function(attributes, options) {
			var error = [];

			_.each(attributes, function(val, key) {
				if( /^experience\.log\.\d\.date$/.test(key) ) {
					if( !val || val.trim() === '' ) {
						return;
					} else if( !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val) ) {
						error.push('Invalid date format: '+val);
					}
				}
			});

			if(error.length > 0) {
				console.log(error);
				return error;
			}
		},

		serverRead: function(data) {
			var result = {},
				recurse = function(cur, prop) {
				if (Object(cur) !== cur) {
					result[prop] = cur;
				} else if (Array.isArray(cur)) {
					 for(var i=0, l=cur.length; i<l; i++)
						 recurse(cur[i], prop + "." + i);
					if (l == 0)
						result[prop] = [];
				} else {
					var isEmpty = true;
					for (var p in cur) {
						isEmpty = false;
						recurse(cur[p], prop ? prop+"."+p : p);
					}
					if (isEmpty && prop)
						result[prop] = {};
				}
			}
			recurse(data, "");

			console.log("Read:", result);

			this.set(result);

			app.bodyView.bind();
		},

		serverChange: function(data) {
			console.log('Got from server:', data);
			data.fromServer = true;
			this.set(data);
		},

		serverDelete: function(data) {
			this.trigger('remove', this);
			this.modelCleanup();
		},

		modelCleanup: function() {
			this.ioUnbindAll();
			return this;
		}
	});

	// VIEWS
	var HeaderView = Backbone.View.extend({
		el: 'div.navbar',
		
		events: {
			'click label': 'changePage'
		},

		initialize: function() {
			this.$ul = this.$el.find('.navbar-nav');
		},

		changePage: function(event) {
			app.page = $(event.target).data('page');
			app.navigate('character/' + app.name + '/' + app.page);
			app.bodyView.changePage();
		}	
	});

	var CharacterView = Backbone.View.extend({
		el: '#main-content',

		events: {
			'change input': 'onChange',
			'input textarea': 'onChange',
			'click .portrait': 'showPortrait',
			'click #portrait-save': 'savePortrait'
		},

		initialize: function() {
			this.binder = new Backbone.ModelBinder();

			// Portrait
			app.model.on('change:portrait', this.onPortraitChange, this);

			// Skills
			var skillCount = this.$('.skills li').length;
			for(i = 0; i < skillCount; i++) {
				app.model.on('change:skills.'+i+'.name', this.onSkillChange, this);
			}

			// Cypher Limit
			app.model.on('change:cypherLimit', this.onCypherLimitChange, this);

			// Experience Log
			var experienceLogCount = this.$('.experience li').length;
			for(i = 0; i < experienceLogCount; i++) {
				app.model.on('change:experience.log.'+i+'.date', this.onExperienceDateChange, this);
			}
		},

		bind: function() {
			this.binder.bind(app.model, this.el);
		},

		// EVENT FUNCTIONS

		onChange: function(event) {
			var $ele = $(event.target),
				name = $ele.attr('name'),
				val  = $ele.val();

			if($ele.attr('type') === 'checkbox') {
				val = $ele.prop('checked');
			}
			
			this.save(name, val);
		},

		showPortrait: function(event) {
			this.$('#portrait-modal').modal();
		},

		savePortrait: function(event) {
			var url = this.$('#portrait').val();
			this.save('portrait', url);

			this.$('#portrait-modal').modal('hide');
		},

		// BOUND EVENT FUNCTIONS

		onPortraitChange: function(data) {
			var url = data.attributes.portrait,
				$ele = this.$('.portrait');

			$ele.css('background-image', 'url('+url+')');
		},

		onSkillChange: function(data, text) {
			var attrs = data.attributes,
				name = _.invert(attrs)[text];

			if(typeof name !== 'string') {
				return;
			}

			var $ele = this.$('.skills input[name="'+name+'"]'),
				val = attrs[$ele.attr('name')],
				$radio = $ele.parent().find('input[type="radio"]');

			if( typeof val === 'undefined' || val === '' ) {
				$radio.each(function() {
					$(this).prop('checked', false).prop('disabled', true);
				});

				this.save($radio.first().attr('name'), '');
			} else {
				$radio.each(function() {
					$(this).prop('disabled', false);
				});
			}		
		},

		onCypherLimitChange: function(data) {
			var limit = data.attributes.cypherLimit,
				$inputs = this.$('.cyphers li input');

			$inputs.removeClass('extra');
			$inputs.slice(limit).addClass('extra');
		},

		onExperienceDateChange: function(data, text) {
			var attrs = data.attributes,
				name = _.invert(attrs)[text];

			if(typeof name !== 'string') {
				return;
			}

			if( !attrs[name] ) {
				attrs[name] = '';
				return;
			}

			var date = new Date(attrs[name]);
			attrs[name] = date.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
		},

		// UTILITY FUNCTIONS

		save: function(name, val) {
			console.log(name, 'changed:', val);
			app.model.save(name, val, { patch: true, validation: true });
		},

		changePage: function() {
			var $root = this.$el,
				$active = this.$el.children('.active');
			
			$active.fadeOut(function() {
				$active.removeClass('active');
				$root.children('[data-page=' + app.page + ']').addClass('active').show();
			});
		}
	});

	app = new AppRouter();
	Backbone.history.start({ pushState: true });
} );