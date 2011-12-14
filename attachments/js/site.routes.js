Ember.routes.add('', Blog, Blog.Router.index);
Ember.routes.add('!blog', Blog, Blog.Router.index);
Ember.routes.add('!blog/tag/:tag', Blog, Blog.Router.show_tag);
Ember.routes.add('!blog/author/:author', Blog, Blog.Router.show_author);
Ember.routes.add('!blog/:post', Blog, Blog.Router.show_post);

Ember.routes.add('!cv', CV, CV.Router.index);

Ember.routes.add('!gametheory', Gametheory, Gametheory.Router.index);