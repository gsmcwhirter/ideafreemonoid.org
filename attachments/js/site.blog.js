window.Blog = Ember.Application.create({
    rootElement: $("#blog")
});

Blog.Router = {
    index: function (){
        App.hideAll();
        Blog.postsController.reloadData();
        this.get("rootElement").show();
        App.setTitle("Blog");
        _gaq.push(['_trackPageview', '#!blog']);
    }
    , show_author: function (params){
        if (!params.author){
            Ember.routes.set('location', '!blog');
        }
        else {
            App.hideAll();
            this.get("rootElement").show();
            App.setTitle("Blog");
            _gaq.push(['_trackPageview', '#!blog/author/' + params.author]);
        }
    }
    , show_tag: function (params){
        if (!params.tag){
            Ember.routes.set('location', '!blog');
        }
        else {
            App.hideAll();
            this.get("rootElement").show();
            App.setTitle("Blog");
            _gaq.push(['_trackPageview', '#!blog/tag/' + params.tag]);
        }
    }
    , show_post: function (params){
        if (!params.post){
            Ember.routes.set('location', '!blog');
        }
        else {
            App.hideAll();
            this.get("rootElement").show();
            App.setTitle("Blog");
            _gaq.push(['_trackPageview', '#!blog/' + params.post]);
        }
    }
};

Blog.Post = Ember.Object.extend({
      type: "blog-post"
    , title: null
    , slug: null
    , authors: []
    , content_raw: ''
    , display_date: null
    , created_at: null
    , is_published: false
    , tags: []
    , edits: []
    , _id: null
    , _rev: null
    , isEditing: false

    , _doc: function (){
        return this.getProperties("type","title","slug","authors","content_raw","display_date","created_at","is_published","tags","edits","_id","_rev");
    }.property("type","title","slug","authors","content_raw","display_date","created_at","is_published","tags","edits","_id","_rev")

    , formattedAuthors: function (){
        var val = this.get("authors");
        if (val && val.length) return _(val).map(function (author){
            return "<a href=\"#!blog/author/" + author + "\">" + author + "</a>";
        }).join(", "); //TODO: links
        else return "";
    }.property("authors")

    , formattedContent: function (){
        return SDConverter.makeHtml(this.get("content_raw") || "\n");
    }.property("content_raw")

    , formattedDate: function (){
        var val = this.get("display_date");
        if (val) return (new Date(val)).toLocaleString();
        else return "";
    }.property("display_date")

    , formattedEdits: function (){
        var val = this.get("edits");
        if (edits && edits.length) return _(val).map(function (edit){
            edit.formattedDate = (new Date(val)).toLocaleString();
            return edit;
        });
        else return [];
    }.property("edits")

    , formattedTags: function (){
        var val = this.get("tags");
        if (val && val.length) return _(val).map(function (tag){
                return "<a href=\"#!blog/tag/" + tag + "\">" + tag + "</a>";
            }).join(", ");
        else return "";
    }.property("tags")

    , tags_string: Ember.computed(function (key, value){
        //getter
        if (arguments.length === 1){
            var tags = this.get("tags");
            if (tags && tags.length){
                return tags.join(", ");
            }
            else {
                return "";
            }
        }
        //setter
        else {
            this.set("tags", _(value.split(",")).map(function (tag){return $.trim(tag);}));
        }
    }).property("tags")

    , editString: function (){
        var edits = this.get("formattedEdits");
        if (edits && edits.length){
            var last = edits[edits.length - 1];
            return "Edited " + edits.length + " times, most recently by " + last.author + " on " + last.formattedDate;
        }
        else {
            return "";
        }
    }.property('edits')
});

Blog.postsController = Ember.ArrayController.create({
      content: []
    , createPost: function (title, slug, tags, content, callback){
        if (typeof title === "function"){
            callback = title;
            title = null;
            slug = null;
            tags = null;
            content = null;
        }
        else if (typeof slug === "function"){
            callback = slug;
            slug = null;
            tags = null;
            content = null;
        }
        else if (typeof tags === "function"){
            callback = tags;
            tags = null;
            content = null;
        }
        else if (typeof content === "function"){
            callback = content;
            content = null;
        }

        if (typeof callback !== "function"){
            callback = function (){};
        }

        if (User.userController.isConnected()){

            var now = dateISOString(new Date());

            var post = {
                  title: title
                , slug: slug
                , authors: [User.userController.get('currentUser').get('name')]
                , created_at: now
                , display_date: now
                , content_raw: content || "\n"
                , is_published: false
                , tags: tags
                , isEditing: true
            };

            post = Blog.Post.create(post);
            this.unshiftObject(post);

            callback(false, post);
        }
        else {
            callback({error: "not connected"}, User.userController.get("currentUser"));
        }
    }

    , savePost: function (post, force_publish, callback){
        if (typeof force_publish === "function"){
            callback = force_publish;
            force_publish = false;
        }

        if (typeof callback !== "function") callback = function (){};

        if (User.userController.isConnected()){

            if (post.get("is_published")){
                var newedits = post.get("edits");
                newedits.push({
                      author: User.userController.get("currentUser").get("name")
                    , edit_date: dateISOString(new Date())
                });
                post.set("edits", newedits);
            }
            else {
                post.set("display_date", dateISOString(new Date()));
            }

            if (force_publish){
                post.set("is_published", true);
            }

            var first;
            if (!post.get("_id")){
                console.log("Saving new...");
                first = function (second){
                    IFMAPI.getUUIDs(function (err, response){
                        if (err){
                            callback(err, response);
                        }
                        else if (response && response.uuids){
                            post.set("_id", response.uuids[0]);
                            second();
                        }
                        else {
                            callback(true, response);
                        }
                    });
                };
            }
            else {
                console.log("Saving existing...");
                first = function (second){
                    second();
                };
            }

            first(function (){
                var doc = post.get("_doc");

                if (!doc._rev){
                    delete doc._rev;
                }

                IFMAPI.putDoc(post.get("_id"), doc, function (err, response){
                    if (err){
                        callback(err, response);
                    }
                    else if (response && response.ok){
                        post.set("_rev", response.rev);

                        callback(false, post);
                    }
                    else {
                        callback(true, response);
                    }
                });
            });
        }
        else {
            callback({error: "not connected"}, User.userController.get("currentUser"));
        }
    }

    , reloadData: function (){
        var self = this;
        var opts = {
              include_docs: true
            , descending: true
        }

        if (!User.userController.isConnected()){
            //start and end need to be reversed due to descending
            opts.end_key = ['pub', 0];
            opts.start_key = ['pub', 1];
        }

        IFMAPI.getView("blogposts", opts, function (err, response){
            if (err){
                //TODO: error handling
                console.log(response);
            }

            if (response && response.rows){
                self.set('content', _(response.rows).chain()
                                                    .pluck('doc')
                                                    .map(function (doc){return Blog.Post.create(doc);})
                                                    .value());
            }
            else {
                //TODO: error handling
            }
        });
    }
});

Blog.BlogView = Ember.View.extend({
    templateName: "blog"
});

Blog.AddPostLink = Ember.View.extend({
      templateName: "blog-add-post-link"
    , currentUserBinding: "User.userController.currentUser"
    , click: function (event){
        event.preventDefault();
        Blog.postsController.createPost(function (err, result){
            if (err){
                //TODO: error handling
            }
        });
        return false;
    }
});

Blog.BlogPostView = Ember.View.extend({
      templateName: "blog-post"
    , doubleClick: function (){
        if (User.userController.isConnected()){
            this.get("content").set("isEditing", true);
        }
        return false;
    }
});

Blog.PostDisplayView = Ember.View.extend({
      templateName: "blog-post-display"
});

Blog.EditFormView = Ember.View.extend({
      templateName: "blog-post-form"
    , saveButton: Ember.Button.extend({
          target: null
        , action: null
        , click: function (event){
            event.preventDefault();

            this.get("content").set("isEditing", false);

            if (User.userController.isConnected()){
                Blog.postsController.savePost(this.get("content"), function (err, resp){
                    if (err){
                        //TODO: error handling
                        console.log(err);
                        console.log(resp);
                    }
                });
            }
            else {
                console.log("Not Connected!");
            }

            console.log(this.get("content").get("title"));

            return false;
        }
    })
    , publishButton: Ember.Button.extend({
          target: null
        , action: null
        , click: function (event){
            event.preventDefault();

            this.get("content").set("isEditing", false);

            if (User.userController.isConnected()){
                Blog.postsController.savePost(this.get("content"), true, function (err, resp){
                    if (err){
                        //TODO: error handling
                        console.log(err);
                        console.log(resp);
                    }
                });
            }
            else {
                console.log("Not Connected!");
            }

            console.log(this.get("content").get("title"));

            return false;
        }
    })
});