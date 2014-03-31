/*
Numenera Character App
Ephraim Gregor, 2014
*/

var app,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

window.log = function() {
  var newarr;
  log.history = log.history || [];
  log.history.push(arguments);
  if (this.console) {
    arguments.callee = arguments.callee.caller;
    newarr = [].slice.call(arguments);
    if (typeof console.log === "object") {
      log.apply.call(console.log, console, newarr);
    } else {
      console.log.apply(console, newarr);
    }
  }
};

window.socket = io.connect('http://localhost');

window.socket.on('foo', function(data) {
  return log(data);
});

app = {};

$(function() {
  /*
  	ROUTER
  */

  var AppRouter, Character, CharacterView, HeaderView, _ref, _ref1, _ref2, _ref3;
  AppRouter = (function(_super) {
    __extends(AppRouter, _super);

    function AppRouter() {
      _ref = AppRouter.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    AppRouter.prototype.routes = {
      'character/:name(/:page)': 'character'
    };

    AppRouter.prototype.name = '';

    AppRouter.prototype.page = 1;

    AppRouter.prototype.character = function(name, page) {
      this.name = name;
      this.page = page != null ? page : {
        page: 1
      };
      this.model = new Character();
      this.bodyView = new CharacterView();
      return this.headerView = new HeaderView();
    };

    return AppRouter;

  })(Backbone.Router);
  /*
  	MODELS
  */

  Character = (function(_super) {
    __extends(Character, _super);

    function Character() {
      _ref1 = Character.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Character.prototype.socket = window.socket;

    Character.prototype.noIoBind = false;

    Character.prototype.urlRoot = 'character';

    Character.prototype.initialize = function() {
      this.set('id', app.name);
      _.bindAll(this, 'serverChange', 'serverDelete', 'modelCleanup');
      if (!this.noIoBind) {
        this.ioBind('update', this.serverChange, this);
        return this.ioBind('delete', this.serverDelete, this);
      }
    };

    Character.prototype.serverChange = function(data) {
      log('Got from server:', data);
      data.fromServer = true;
      return this.set(data);
    };

    Character.prototype.serverDelete = function(data) {
      if (this.collection) {
        this.collection.remove(this);
      } else {
        this.trigger('remove', this);
      }
      return this.modelCleanup();
    };

    Character.prototype.modelCleanup = function() {
      this.ioUnbindAll();
      return this;
    };

    return Character;

  })(Backbone.Model);
  /*
  	VIEWS
  */

  HeaderView = (function(_super) {
    __extends(HeaderView, _super);

    function HeaderView() {
      _ref2 = HeaderView.__super__.constructor.apply(this, arguments);
      return _ref2;
    }

    HeaderView.prototype.el = 'div.navbar';

    HeaderView.prototype.events = {
      'click label': 'changePage'
    };

    HeaderView.prototype.initialize = function() {
      return this.$ul = this.$el.find('.navbar-nav');
    };

    HeaderView.prototype.changePage = function(event) {
      app.page = $(event.target).data('page');
      app.navigate('character/' + app.name + '/' + app.page);
      return app.bodyView.changePage();
    };

    return HeaderView;

  })(Backbone.View);
  CharacterView = (function(_super) {
    __extends(CharacterView, _super);

    function CharacterView() {
      _ref3 = CharacterView.__super__.constructor.apply(this, arguments);
      return _ref3;
    }

    CharacterView.prototype.el = '#main-content';

    CharacterView.prototype.events = {
      'change input, textarea': 'onChange'
    };

    CharacterView.prototype.initialize = function() {
      this.$el.find('input, textarea').each(function() {
        var $ele, name, type, val;
        $ele = $(this);
        type = $ele.attr('type');
        name = $ele.attr('name');
        val = $ele.val();
        if (type === 'checkbox') {
          val = $ele.prop('checked');
        } else if (type === 'radio' && !$ele.prop('checked')) {
          val = null;
        }
        if (val !== null && val !== '') {
          return app.model.set(name, val);
        }
      });
      this.binder = new Backbone.ModelBinder();
      return this.render();
    };

    CharacterView.prototype.render = function() {
      return this.binder.bind(app.model, this.el);
    };

    CharacterView.prototype.onChange = function(event) {
      var $ele, name, val;
      $ele = $(event.target);
      val = $ele.val();
      name = $ele.attr('name');
      if ($ele.attr('type') === 'checkbox') {
        val = $ele.prop('checked');
      }
      log(name, 'changed:', val);
      return app.model.save(name, val, {
        patch: true
      });
    };

    CharacterView.prototype.changePage = function() {
      var root;
      root = this.$el;
      return root.children('.active').fadeOut(function() {
        root.children('.active').removeClass('active');
        return root.children('[data-page=' + app.page + ']').addClass('active').show();
      });
    };

    return CharacterView;

  })(Backbone.View);
  /*
  	INITIALIZATION
  */

  app = new AppRouter();
  Backbone.history.start({
    pushState: true
  });
});
