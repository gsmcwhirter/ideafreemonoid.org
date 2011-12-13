window.Blog = Ember.Application.create({
    rootElement: $("#blog")
});

Blog.Router = {
    index: function (){
        App.hideAll();
        Blog.postsController.reloadData();
        this.get("rootElement").show();
        App.setTitle("Blog");
        _gaq.push(['_trackPageview', '#!/blog']);
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
    , createPost: function (title, slug, content, tags, authors){
        if (User.userController.isConnected()){
            authors = authors || User.userController.get('currentUser').get('name');

            if (typeof authors === "string"){
                authors = [authors];
            }

            var now = dateISOString(new Date());

            var post = {
                  type: "blog-post"
                , title: title
                , slug: slug
                , authors: authors
                , created_at: now
                , display_date: now
                , content_raw: content || lipsum || "\n" /*REMOVE lipsum*/
                , is_published: true /*REMOVE*/
                , tags: tags || ["testing"] /*REMOVE*/
            };

            var self = this;

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
            });
        }
        else {
            //TODO: error handling
        }
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

Blog.BlogPostView = Ember.View.extend({
    templateName: "blog-post"
});


Ember.Handlebars.registerHelper("formatTags", function (property){
    var val = Ember.getPath(this, property);
    if (val && val.length){
        _(val).map(function(tag){
            return "<a href=\"#!/tag/" + tag + "\">" + tag + "</a>"; //TODO: working links
        }).join(", ");
    }
    else {
        return "";
    }
});

Ember.Handlebars.registerHelper("formatAuthors", function (property){
    var val = Ember.getPath(this, property);
    if (val && val.length){
        return val.join(", "); //TODO: links
    }
    else {
        return "";
    }
});
