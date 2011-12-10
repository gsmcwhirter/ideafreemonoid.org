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
        [ {from:"/", to:'blog.html'}
        , {from:"/gametheory", to:'gametheory.html'}
        , {from:"/cv", to:'cv.html'}
        , {from:"/session", to:'../../_session'}
        , {from:"/api", to:'../'}
        , {from:"/api/*", to:'../*'}
        , {from:"/*", to:'*'}
        ]
    }
    ;

ddoc.views = {};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {
    if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1){
        throw "Only admin can delete documents on this database.";
    }
    else if (userCtx.roles.indexOf('poster') === -1 && userCtx.roles.indexOf('_admin') === -1){
        throw "You do not have permission to make changes.";
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
