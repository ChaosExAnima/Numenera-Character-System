###
Numenera Character App
Ephraim Gregor, 2014
###
window.log = ->
  	log.history = log.history or [] # store logs to an array for reference
  	log.history.push arguments
  	if @console
    	arguments.callee = arguments.callee.caller
    	newarr = [].slice.call(arguments)
    	(if typeof console.log is "object" then log.apply.call(console.log, console, newarr) else console.log.apply(console, newarr))
  	return

window.socket = io.connect 'http://localhost'

window.socket.on 'foo', (data) ->
	log data

app = {}

$ ->
	###
	ROUTER
	###
	class AppRouter extends Backbone.Router
		routes: 
			'character/:name(/:page)': 'character'

		name: ''
		page: 1

		character: (name, page) ->
			@name = name
			@page = page ? page : 1

			@model = new Character()
			@bodyView = new CharacterView()
			@headerView = new HeaderView()


	###
	MODELS
	###
	class Character extends Backbone.Model
		socket: window.socket
		noIoBind: false
		urlRoot: 'character'

		initialize: ->
			@.set 'id', app.name

			_.bindAll @, 'serverChange', 'serverDelete', 'modelCleanup'

			if !@noIoBind
				@ioBind 'update', @serverChange, @
				@ioBind 'delete', @serverDelete, @

		serverChange: (data) ->
			log 'Got from server:', data
			data.fromServer = true
			@set data

		serverDelete: (data) ->
			if @collection
				@collection.remove @
			else
				@trigger 'remove', @
			@modelCleanup()

		modelCleanup: ->
			@ioUnbindAll()
			return @


	###
	VIEWS
	###
	class HeaderView extends Backbone.View
		el: 'div.navbar'
		events: 
			'click label': 'changePage'	

		initialize: ->
			@.$ul = @.$el.find('.navbar-nav')

		changePage: (event) ->
			app.page = $(event.target).data('page')
			app.navigate 'character/'+app.name+'/'+app.page
			app.bodyView.changePage()


	class CharacterView extends Backbone.View
		el: '#main-content'

		events:
			'change input, textarea': 'onChange'

		initialize: ->
			# Sets up default data.
			@.$el.find('input, textarea').each ->
				$ele = $(@)
				type = $ele.attr('type')
				name = $ele.attr('name')
				val = $ele.val()

				if type == 'checkbox'
					val = $ele.prop 'checked'
				else if type == 'radio' && !$ele.prop 'checked'
					val = null

				if val != null && val != ''
					app.model.set name, val

			@.binder = new Backbone.ModelBinder()
			@.render()

		render: ->
			@.binder.bind app.model, @.el

		onChange: (event) ->
			$ele = $(event.target)
			val = $ele.val()
			name = $ele.attr('name')

			if $ele.attr('type') == 'checkbox'
				val = $ele.prop 'checked'

			log name, 'changed:', val
			app.model.save name, val, { patch: true }

		changePage: ->
			root = @.$el

			root.children('.active').fadeOut ->
				root.children('.active').removeClass('active')
				root.children('[data-page='+app.page+']').addClass('active').show()


	###
	INITIALIZATION
	###
	app = new AppRouter()
	Backbone.history.start
		pushState: true

	return