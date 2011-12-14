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
    , _deleted: false
    , _id: null
    , _rev: null
    , isEditing: false

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
        if (this.edits && this.edits.length){
            var last = this.edits[this.edits.length - 1];
            return "Edited " + this.edits.length + " times, most recently by " + last.author + " on " + last.edit_date_formatted;
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
            tags = null
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
                  type: "blog-post"
                , title: title
                , slug: slug
                , authors: [User.userController.get('currentUser').get('name')]
                , created_at: now
                , display_date: now
                , content_raw: content || "\n"
                , is_published: false
                , tags: tags
                , isEditing: true
            };

            this.unshiftObject(Blog.Post.create(post));

            /*var self = this;

            IFMAPI.getUUIDs(function (err, response){
                if (err){
                    //TODO: error handling
                    console.log(response);
                }

                if (response && response.uuids){
                    post._id = response.uuids[0];

                    IFMAPI.putDoc(post._id, post, function (err, response){
                        if (err){
                            //TODO: error handling
                            console.log(response);
                        }

                        console.log(response);

                        if (response && response.ok){
                            post._rev = response.rev;

                            self.unshiftObject(Blog.Post.create(post));
                        }
                    });
                }
            });*/
        }
        else {
            //TODO: error handling
        }
    }

    , savePost: function (post, callback){

    }

    , reloadData: function (){
        var self = this;
        IFMAPI.getView("blogposts", {startkey: [true,0], endkey: [true, 1], include_docs: true, descending: true}, function (err, response){
            if (err){
                //TODO: error handling
                console.log(response);
            }

            if (response && response.rows){
                self.set('content', _(response.rows).chain().pluck('doc').map(function (doc){return Blog.Post.create(doc);}).value());
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
                this.get("content").set("last_updated", dateISOString(new Date()));
                /*CV.sectionsController.saveSection(this.get("content"), function (err, resp){
                    if (err){
                        //TODO: error handling
                        console.log(err);
                        console.log(resp);
                    }
                });*/
            }
            else {
                console.log("Not Connected!");
            }

            console.log(this.get("content").get("title"));

            return false;
        }
    })
});