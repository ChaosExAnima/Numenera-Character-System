/**
 * Numenera Character Sheet App
 * Ephraim Gregor, 2014
 * ephraim@ephraimgregor.com
 */

'use strict';

/**
 * GLOBAL VARIABLES
 */
window.socket = io.connect(window.location.hostname);

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
			this.page = page !== null ? page : 1;
			this.model = new Character();
			this.headerView = new HeaderView();
			this.alertView = new AlertView();
			this.bodyView = new CharacterView();
		}
	});

	// MODEL
	var Character = Backbone.Model.extend({

		socket: window.socket,
		noIoBind: false,
		urlRoot: 'character',
		
		initialize: function() {
			this.set('id', app.name);
			
			_.bindAll(this, 'serverChange', 'serverDelete', 'modelCleanup', 'syncError');

			if(!this.noIoBind) {
				this.ioBind('read', this.serverRead, this);
				this.ioBind('update', this.serverChange, this);
				this.ioBind('delete', this.serverDelete, this);
			}

			this.sync('read', this);
		},

		serverRead: function(data) {
			var result = {},
				recurse = function(cur, prop) {
				if (Object(cur) !== cur) {
					result[prop] = cur;
				} else if (Array.isArray(cur)) {
					for(var i=0, l=cur.length; i<l; i++) {
						recurse(cur[i], prop + '.' + i);
					}
					if (l === 0) {
						result[prop] = [];
					}
				} else {
					var isEmpty = true;
					for (var p in cur) {
						isEmpty = false;
						recurse(cur[p], prop ? prop + '.' + p : p);
					}
					if (isEmpty && prop) {
						result[prop] = {};
					}
				}
			};
			recurse(data, '');

			console.log('Read:', result);

			this.set(result);
			app.bodyView.bind();
		},

		serverChange: function(data) {
			console.log('Got from server:', data);
			app.headerView.showRefresh();
			data.fromServer = true;
			this.set(data);
		},

		serverDelete: function() {
			this.trigger('remove', this);
			this.modelCleanup();
		},

		modelCleanup: function() {
			this.ioUnbindAll();
			return this;
		},

		syncError: function() {
			app.alertView.show('There was a problem syncing with the server!');
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
			this.$refresh = this.$el.find('.refreshing');
		},

		changePage: function(event) {
			app.page = $(event.target).data('page');
			app.navigate('character/' + app.name + '/' + app.page);
			app.bodyView.changePage();
		},

		showRefresh: function() {
			this.$refresh.css('opacity', 1);
			_.delay( _.bind( this.hideRefresh, this ), 2000);
		},

		hideRefresh: function() {
			_.debounce( this.$refresh.css('opacity', 0), 1000 );
		}
	});

	var AlertView = Backbone.View.extend({
		el: '.alert',
		$template: $('#alert-template'),

		initialize: function() {
			this.template = _.template( this.$template.html() );
		},

		show: function(text) {
			this.hide();
			this.$template.after( this.template({ text: text }) );
			this.$el = $('.alert');
		},

		hide: function() {
			this.$el.alert('close');
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

			var i = 0;

			// Skills
			var skillCount = this.$('.skills li').length;
			for(i = 0; i < skillCount; i++) {
				app.model.on('change:skills.'+i+'.name', this.onSkillChange, this);
			}

			// Cypher Limit Coloring
			app.model.on('change:cypherLimit', this.onCypherLimitChange, this);
			var cypherCount = this.$('.cyphers li').length;
			for(i = 0; i < cypherCount; i++) {
				app.model.on('change:cyphers.'+i, this.onCypherLimitChange, this);
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

		showPortrait: function() {
			this.$('#portrait-modal').modal();
		},

		savePortrait: function() {
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
			// Create an array of the valid values.
			var skillsCount = this.$('.skills li').length,
				valid = [];
			for(var i = 0; i < skillsCount; i++) {
				valid.push('skills.log.'+i+'.date');
			}

			var attrs = _.pick(data.attributes, valid),
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

			for( var i = 0; i < $inputs.length; i++ ) {
				var text = data.attributes['cyphers.'+i];
				if( text && text.charAt(0) === ' ' ) {
					limit++;
				}
			}
			
			$inputs.slice(limit).addClass('extra');
		},

		// UTILITY FUNCTIONS

		save: function(name, val) {
			console.log(name, 'changed:', val);
			app.model.save(name, val, { patch: true });
			app.headerView.showRefresh();
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