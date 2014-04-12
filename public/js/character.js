/**
 * Numenera Character Sheet App
 * Ephraim Gregor, 2014
 * ephraim@ephraimgregor.com
 */

/**
 * GLOBAL VARIABLES
 */

// usage: log('inside coolFunc',this,arguments);
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
				this.ioBind('update', this.serverChange, this);
				this.ioBind('delete', this.serverDelete, this);
			}
		},

		serverChange: function(data) {
			log('Got from server:', data);
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
			'change input[type="radio"], input[type="checkbox"]': 'onChange',
			'input input[type="text"], input[type="number"], textarea': 'onChange',
			'click input[type="radio"]': 'onClickRadio'
		},

		initialize: function() {
			this.$el.find('input, textarea').each(function() {
				var $ele = $(this),
					type = $ele.attr('type'),
					name = $ele.attr('name'),
					val  = $ele.val();

				if(type === 'checkbox') {
					val = $ele.prop('checked');
				} else if(type === 'radio' && !$ele.prop('checked')) {
					val = null;
				}

				if(val !== null && val !== '') {
					app.model.set(name, val);
				}
			});

			this.binder = new Backbone.ModelBinder();
			this.render();
		},

		render: function() {
			this.binder.bind(app.model, this.el);
		},

		onChange: function(event) {
			var $ele = $(event.target),
				name = $ele.attr('name'),
				val  = $ele.val();

			if($ele.attr('type') === 'checkbox') {
				val = $ele.prop('checked');
			}
			
			this.save(name, val);
		},

		onClickRadio: function(event) {
			var $ele = $(event.target), 
				name = $ele.attr('name'),
				$sibling = $ele.parent().siblings('span').children('input');

			if($ele.prop('checked') && !$sibling.prop('checked')) {
				$ele.prop('checked', false);

				// this.save(name, false);	
			}
		},

		save: function(name, val) {
			log(name, 'changed:', val);
			app.model.save(name, val, { patch: true });
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