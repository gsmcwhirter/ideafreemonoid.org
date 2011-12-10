Blog = SC.Application.create({
    rootElement: $("#blog")
});

Blog.Post = SC.Object.extend({
      type: "blog-post"
    , title: null
    , slug: null
    , authors: []
    , content_raw: ''
    , content_formatted: ''
    , created_at: null
    , status: 'formatting'
    , is_published: false
    , tags: []
    , edits: []
    , _deleted: false
});

Blog.postsController = SC.ArrayProxy.create({
    content: []

    , createPost: function (title, slug, authors, content, tags){
        authors = authors || "";

        if (typeof authors === "string"){
            authors = [authors];
        }

        var post = Blog.Post.create({
              title: title
            , slug: slug
            , authors: authors
            , content_raw: content || "\n"
            , tags: tags || []
        });

        this.pushObject(post);
    }

    , cleanPosts: function (){
        var deletedPosts = this.filterProperty('_deleted', true);
        deletedPosts.forEach(this.removeObject, this);

        var unpubPosts = this.filterProperty('is_published', false);
        unpubPosts.forEach(this.removeObject, this);

    }


});

