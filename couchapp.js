var couchapp = require('couchapp')
    , path = require('path')
    , jade = require('jade')
    , ffi = require('node-ffi')
    , libc = new ffi.Library(null, {"system": ["int32", ["string"]]})
    , run = libc.system
    ;

var ddoc =
    { _id:'_design/app'
    , rewrites :
        [ {from:"/", to:'index.html'}
        , {from:"/api", to:'./'}
        , {from:"/api/*", to:'../../*'}
        , {from:"/*", to:'*'}
        ]
    }
    ;

ddoc.views = {
      cvsections: {
        map: function (doc){
            if (doc.type === "cv-section"){
                emit(doc.order, 1);
            }
        }
    }
    , blogposts: {
        map: function (doc){
            if (doc.type === "blog-post"){
                emit([doc.is_published, 0, doc.display_date], 1);
            }
        }
    }
    , blogtags: {
        map: function (doc){
            if (doc.type === "blog-post" && doc.tags && doc.tags.length){
                doc.tags.forEach(function (tag){
                    emit(tag, 1);
                });
            }
        }
        , reduce: function (keys, values, rereduce){
            return sum(values);
        }
    }
    , blogslugs: {
        map: function (doc){
            if (doc.type === "blog-post"){
                emit(doc.slug, 1);
            }
        }
    }
    , blogauthors: {
        map: function (doc){
            if (doc.type === "blog-post" && doc.authors && doc.authors.length){
                doc.authors.forEach(function (author){
                    emit(author, 1);
                });
            }
        }
        , reduce: function (keys, values, rereduce){
            return sum(values);
        }
    }
    /*, projects: {
        
    }*/
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1){
        throw "Only admin can delete documents on this database.";
    }
    else if (userCtx.roles.indexOf('poster') === -1 && userCtx.roles.indexOf("builder") === -1 && userCtx.roles.indexOf('_admin') === -1){
        throw "You do not have permission to make changes.";
    }

    if (!newDoc._deleted && oldDoc && typeof oldDoc.build_status !== "undefined" && userCtx.roles.indexOf('builder') === -1 && userCtx.roles.indexOf('_admin') === -1){
        throw "You may not change the build status.";
    }

    if (!newDoc._deleted && oldDoc && oldDoc.type != newDoc.type){
        throw "You may not change a document's type.";
    }

    if (!newDoc._deleted && oldDoc && oldDoc.created_at && oldDoc.created_at !== newDoc.created_at){
        throw "You may not change the created_at value.";
    }
};

ddoc.templates = couchapp.loadFiles(path.join(__dirname, "templates"), {
    operators: [
        function renderJade(content) {
            return jade.compile(content, {compileDebug: false, client: true});
        }
    ]
});

ddoc.changes = require("./couchwatcher");

run(["jade", path.join(__dirname, "attachments")].join(" "));
run(["stylus", path.join(__dirname, "attachments", "css", "layout.styl")].join(" "));

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
