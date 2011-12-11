/*REMOVE*/
var lipsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed augue nisl, elementum a luctus id, luctus ut nisl. Donec semper egestas lorem, eu vehicula libero pellentesque nec. Nunc vel purus erat, eu lobortis nisi. Ut vehicula libero ac risus feugiat pretium in imperdiet risus. Duis mollis purus in augue pretium egestas. Donec sit amet libero vel lectus consequat ullamcorper quis ac nunc. In mattis luctus nibh et convallis. Morbi tincidunt ipsum nec neque ullamcorper faucibus. Nulla suscipit aliquam felis sed aliquam. Nullam luctus diam vitae enim cursus in scelerisque dui molestie. Vestibulum vulputate turpis eget sapien fringilla in pharetra velit faucibus. Mauris scelerisque pharetra sapien, sed euismod dolor laoreet a. Ut lacinia dolor non eros pharetra elementum. Quisque id risus id ante pretium porttitor. Etiam et dignissim nisl. Phasellus velit odio, lobortis tincidunt tempor quis, aliquet euismod mauris.\n\nAliquam sit amet neque erat. Nulla ultricies porttitor porttitor. Nulla egestas venenatis ligula, sed pulvinar arcu pharetra eu. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Nulla et egestas quam. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam augue massa, eleifend eget vulputate vitae, dictum eu enim. Fusce metus libero, porta mollis accumsan quis, facilisis eget elit. Pellentesque sodales massa et turpis vestibulum commodo. Curabitur ac suscipit metus. Pellentesque sed elit massa, sed pretium mauris.\n\nPhasellus faucibus mollis nunc lobortis feugiat. Donec urna leo, commodo non dapibus in, lacinia eget velit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum vehicula, justo vitae accumsan ullamcorper, est quam lacinia nisl, eget ultricies dolor sapien sed elit. Ut nisi magna, tincidunt vitae feugiat non, commodo vel sapien. Vestibulum gravida convallis ullamcorper. Proin consectetur, odio et lacinia ullamcorper, ante magna gravida felis, et ullamcorper massa neque at lacus. Cras tellus ipsum, ultrices vel dictum quis, varius eget tellus. In hac habitasse platea dictumst. Nam sed lectus tellus, sed suscipit enim. Vivamus malesuada nunc a odio viverra vel scelerisque metus lacinia.\n\nProin facilisis lectus a lectus blandit ut ultrices nibh fringilla. Nunc risus ante, feugiat sed blandit ut, venenatis tincidunt sem. Aliquam erat volutpat. Sed eu vulputate metus. Sed sollicitudin pellentesque venenatis. Praesent fermentum sapien et nunc dictum vehicula. Fusce porta mi non lectus pharetra scelerisque. Vivamus orci ante, pellentesque eu ultrices a, vehicula sed tortor. Cras vulputate iaculis diam ut pretium. Nam hendrerit diam in magna dictum convallis. In et purus ut ante semper semper.\n";

window.Blog = SC.Application.create({
    rootElement: $("#blog")
});

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

    , content: function (){
        return SDConverter.makeHtml(this.content_raw || "\n");
    }.property('content_raw')
    
    , authorString: function (){
        if (this.authors && typeof this.authors.join === "function"){
            return this.authors.join(", ");
        }
        else {
            return this.authors;
        }
    }.property('authors')
    
    , tagString: function (){
        if (this.tags && this.tags.length){
            _(this.tags).map(function(tag){
                return "<a href=\"#!/tag/" + tag + "\">" + tag + "</a>";
            }).join(", ");
        }
        else {
            return "";
        }
    }.property('tags')

    , dateString: function (){
        if (this.display_date){
            var date = new Date(this.display_date);

            return date.toLocaleString();
        }
        else {
            return "";
        }
    }.property('display_date')
    
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
        authors = authors || User.currentUser.get('name');

        if (typeof authors === "string"){
            authors = [authors];
        }

        //console.log(authors);

        var now = dateISOString(new Date());

        //console.log(now);

        var post = Blog.Post.create({
              title: title
            , slug: slug
            , authors: authors
            , tags: tags || []
            , created_at: now
            , display_date: now
            , content_raw: content || lipsum || "\n" /*REMOVE lipsum*/
        });

        this.unshiftObject(post);
    }

    , cleanPosts: function (){
        var deletedPosts = this.filterProperty('_deleted', true);
        deletedPosts.forEach(this.removeObject, this);

        var unpubPosts = this.filterProperty('is_published', false);
        unpubPosts.forEach(this.removeObject, this);

    }
});


