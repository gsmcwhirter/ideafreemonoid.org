window.Blog = Ember.Application.create({
    rootElement: $("#blog")
});

Blog.Router = {
    index: function (){
        _gaq.push(['_trackPageview', '#!blog']);
        Blog.Router.show_page.call(this, {page: 1});
    }
    , show_page: function (params){
        if (!params.page){
            params.page = 1;
        }

        App.hideAll();
        Blog.postsController.loadPage(params.page);
        this.get("rootElement").show();
        App.setTitle("Blog");
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

    , editString: function (){
        var edits = this.get("edits");
        if (edits && edits.length){
            var last = edits[edits.length - 1];
            return "Edited " + edits.length + " times, most recently by " + last.author + " on " + (new Date(last.edit_date)).toLocaleString();
        }
        else {
            return "";
        }
    }.property("edits")

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
        var edits = this.get("edits");
        if (edits && edits.length) return _(edits).map(function (edit){
            return {
                  author: edit.author
                , edit_date: edit.edit_date
                , formattedDate: (new Date(edit.edit_date)).toLocaleString()
            };
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

    , isDraft: function (){
        return !this.get("is_published");
    }.property("is_published")

    , slug: function (){
        var id = this.get("_id") || "";
        var title = this.get("title");

        var slug_chars = "abcdefghijklmnopqrstuvwxyz0123456789-_ ";

        var slugify = function (title){
          var sub = _(title.toLowerCase().split("")).select(function (item){ return slug_chars.indexOf(item) > -1; });
          return sub.join("").replace(/\s{2,}/g, " ").replace(/ /g,"-");
        }

        return id.substring(0, 6) + "-" + slugify(title);
    }.property("_id", "title")

    , tagString: Ember.computed(function (key, value){
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
});

Blog.postsController = Ember.ArrayController.create({
      content: []
    , _postData: null
    , _seenPosts: {}
    , currentPage: 1
    , _totalPosts: 1
    , _pageSize: 1

    , totalPages: function (){
        return Math.ceil(this.get("_totalPosts") / this.get("_pageSize"));
    }.property("_totalPosts", "_pageSize")

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
                var newedits = post.get("edits").slice();
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

    , loadPage: function (page){
        var self = this;
        var pageSize = this.get("_pageSize");
        var postData = this.get("_postData");

        var first = function (second){second();};

        if (!postData){
            first = function (second){
                var opts = {
                    descending: true
                };

                if (!User.userController.isConnected()){
                    opts.endkey = ['pub', 0];
                    opts.startkey = ['pub', 1];
                }

                IFMAPI.getView("blogposts", opts, function (err, response){
                    if (response && response.rows){
                        self.set("_totalPosts", response.total_rows);
                        console.log("set total posts");

                        var postData = [];
                        var seenPosts = {};
                        _(response.rows).chain()
                                        .pluck('key')
                                        .each(function (key){
                                            console.log(key);
                                            postData.push(key);
                                            seenPosts[key[2]] = true;
                                        });

                        postData.sort().reverse();
                        self.set("_postData", postData);
                        self.set("_seenPosts", seenPosts);
                    }
                    else {
                        //TODO: error handling
                    }
                    second();
                });
            };
        }

        first(function (){
            if (!page || page < 1){
                page = 1;
            }

            var lastPage = self.get("totalPages");

            if (page > 1 && page > lastPage){
                page = lastPage;
            }

            var opts = {
                  include_docs: true
                , descending: true
                , limit: pageSize + 1
            };

            var getStartkey = function (pageSize, page, data){
                var index = pageSize * (page - 1);

                if (data.length < index + 1){
                    return ['pub', 0];
                }
                else {
                    return data[index];
                }
            };

            if (!User.userController.isConnected()){
                //start and end need to be reversed due to descending
                opts.endkey = ['pub', 0];

                if (page > 1){
                    opts.startkey = getStartkey(pageSize, page, self.get("_postData"));
                }
                else {
                    opts.startkey = ['pub', 1];
                }
            }
            else if (page > 1) {
                opts.startkey = getStartkey(pageSize, page, self.get("_postData"));
            }

            IFMAPI.getView("blogposts", opts, function (err, response){
                if (err){
                    //TODO: error handling
                    console.log(response);
                }

                if (response && response.rows){
                    var newcontent = _(response.rows).chain()
                                                     .pluck('doc')
                                                     .map(function (doc){
                                                        delete doc.slug;
                                                        return Blog.Post.create(doc);
                                                     })
                                                     .value();

                    if (newcontent.length === pageSize + 1){
                        newcontent = _(newcontent).initial();
                    }

                    self.set('content', newcontent);
                    self.set('currentPage', page);
                }
                else {
                    //TODO: error handling
                }
            });
        });
    }
});

Blog.BlogView = Ember.View.extend({
      templateName: "blog"
    , currentPageBinding: "Blog.postsController.currentPage"
    , totalPagesBinding: "Blog.postsController.totalPages"

    , hasManyPages: function (){
        return this.get("totalPages") > 1;
    }.property("totalPages")

    , pagesLinkData: function (){
        var total = this.get("totalPages") || 1;
        var current = this.get("currentPage") || 1;
        if (total > 1){
            var ret = [];
            var start = Math.max(1, current - 3);
            var end = Math.min(total, current + 3);
            for (var i = start; i <= end; i++){
                ret.push({page: i, pageHref: "#!blog/" + i});
            }

            return ret;
        }
        else {
            return [];
        }
    }.property("totalPages", "currentPage")

    , lastHref: function (){
        return "#!blog/" + this.get("totalPages");
    }.property("totalPages")
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