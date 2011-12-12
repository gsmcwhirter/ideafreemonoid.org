/*REMOVE*/
var lipsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed augue nisl, elementum a luctus id, luctus ut nisl. Donec semper egestas lorem, eu vehicula libero pellentesque nec. Nunc vel purus erat, eu lobortis nisi. Ut vehicula libero ac risus feugiat pretium in imperdiet risus. Duis mollis purus in augue pretium egestas. Donec sit amet libero vel lectus consequat ullamcorper quis ac nunc. In mattis luctus nibh et convallis. Morbi tincidunt ipsum nec neque ullamcorper faucibus. Nulla suscipit aliquam felis sed aliquam. Nullam luctus diam vitae enim cursus in scelerisque dui molestie. Vestibulum vulputate turpis eget sapien fringilla in pharetra velit faucibus. Mauris scelerisque pharetra sapien, sed euismod dolor laoreet a. Ut lacinia dolor non eros pharetra elementum. Quisque id risus id ante pretium porttitor. Etiam et dignissim nisl. Phasellus velit odio, lobortis tincidunt tempor quis, aliquet euismod mauris.\n\nAliquam sit amet neque erat. Nulla ultricies porttitor porttitor. Nulla egestas venenatis ligula, sed pulvinar arcu pharetra eu. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla et egestas quam. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam augue massa, eleifend eget vulputate vitae, dictum eu enim. Fusce metus libero, porta mollis accumsan quis, facilisis eget elit. Pellentesque sodales massa et turpis vestibulum commodo. Curabitur ac suscipit metus. Pellentesque sed elit massa, sed pretium mauris.\n\nPhasellus faucibus mollis nunc lobortis feugiat. Donec urna leo, commodo non dapibus in, lacinia eget velit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum vehicula, justo vitae accumsan ullamcorper, est quam lacinia nisl, eget ultricies dolor sapien sed elit. Ut nisi magna, tincidunt vitae feugiat non, commodo vel sapien. Vestibulum gravida convallis ullamcorper. Proin consectetur, odio et lacinia ullamcorper, ante magna gravida felis, et ullamcorper massa neque at lacus. Cras tellus ipsum, ultrices vel dictum quis, varius eget tellus. In hac habitasse platea dictumst. Nam sed lectus tellus, sed suscipit enim. Vivamus malesuada nunc a odio viverra vel scelerisque metus lacinia.\n\nProin facilisis lectus a lectus blandit ut ultrices nibh fringilla. Nunc risus ante, feugiat sed blandit ut, venenatis tincidunt sem. Aliquam erat volutpat. Sed eu vulputate metus. Sed sollicitudin pellentesque venenatis. Praesent fermentum sapien et nunc dictum vehicula. Fusce porta mi non lectus pharetra scelerisque. Vivamus orci ante, pellentesque eu ultrices a, vehicula sed tortor. Cras vulputate iaculis diam ut pretium. Nam hendrerit diam in magna dictum convallis. In et purus ut ante semper semper.\n";

window.Blog = SC.Application.create({
    rootElement: $("#blog")
});

Blog.Router = {
    index: function (){
        App.hideAll();
        this.reloadData();
        this.get("rootElement").show();
        App.setTitle("Blog");
        _gaq.push(['_trackPageview', '#!/blog']);
    }
};

Blog.Post = SC.Object.extend({
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

Blog.postsController = SC.ArrayController.create({
    content: []

    , createPost: function (title, slug, content, tags, authors){
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
            , tags: tags || []
            , created_at: now
            , display_date: now
            , content_raw: content || lipsum || "\n" /*REMOVE lipsum*/
            , is_published: true /*REMOVE*/
            , tags: ["testing"] /*REMOVE*/
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
});

Blog.reloadData = function (){
    IFMAPI.getView("blogposts", {startkey: [true,0], endkey: [true, 1], include_docs: true, descending: true}, function (err, response){
        if (err){
            //TODO: error handling
            console.log(response);
        }

        if (response && response.rows){
            Blog.postsController.set('content', _(response.rows).chain().pluck('doc').map(function (doc){return Blog.Post.create(doc);}).value());
        }
    });
};

SC.Handlebars.registerHelper("formatTags", function (property){
    var val = SC.getPath(this, property);
    if (val && val.length){
        _(val).map(function(tag){
            return "<a href=\"#!/tag/" + tag + "\">" + tag + "</a>"; //TODO: working links
        }).join(", ");
    }
    else {
        return "";
    }
});

SC.Handlebars.registerHelper("formatAuthors", function (property){
    var val = SC.getPath(this, property);
    if (val && val.length){
        return val.join(", "); //TODO: links
    }
    else {
        return "";
    }
});
