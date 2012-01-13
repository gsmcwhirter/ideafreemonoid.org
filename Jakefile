var fs = require("fs")
  , cleancss = require("clean-css")
  , jade = require("jade")
  , stylus = require("stylus")
  , minify = require("jake-uglify").minify
  , couchapp = require("couchapp")
  , path = require("path")
  , forever = require("forever")
  , config = require("./config.live")
  , request = require("request")
  , redis = require("./builder/redis_client")
  ;

function abspath (pathname) {
    if (pathname[0] === '/') return pathname;
    return path.join(process.env.PWD, path.normalize(pathname));
}

desc("Generates the markup, css, and js for production");
task("default", ["markup:make", "js:make", "css:make"]);

namespace("couchapp", function (){
    desc("Makes the markup, css, and js then pushes the couchapp");
    task("push", ["default"], function (couch){
        jake.Task["couchapp:push-nomake"].invoke(couch);
    });

    desc("Makes the markup, css, and js then syncs the couchapp");
    task("sync", ["default"], function (couch){
        jake.Task["couchapp:sync-nomake"].invoke(couch);
    });

    desc("Pushes the couchapp to the server.");
    task("push-nomake", function (couch){
        console.log("Pushing couchapp...");

        if (!couch){
            fail("You must specify a couchdb server.");
        }

        couchapp.createApp(require(abspath("couchapp/couchapp.js")), couch, function (app) {
            app.push();
            complete();
        });
    }, {async: true});

    desc("Sets up a sync with the server.");
    task("sync-nomake", function (couch){
        console.log("Syncing couchapp...");

        if (!couch){
            fail("You must specify a couchdb server.");
        }

        couchapp.createApp(require(abspath("couchapp/couchapp.js")), couch, function (app) {
            app.sync();
            complete();
        });
    }, {async: true});
});

namespace("markup", function (){
    desc("Default way to render the production markup.");
    task("make", function (){
        jake.Task["markup:couchapp/attachments/index.html"].invoke();
    });

    desc("Renders index.html from jade.");
    task("couchapp/attachments/index.html", function (){
        console.log("Rendering index.jade to index.html...");

        var source = fs.readFileSync("couchapp/jade/index.jade");

        var fn = jade.compile(source, {filename: "couchapp/jade/index.jade"});
        var locals = {};

        fs.writeFileSync("couchapp/attachments/index.html", fn(locals));
    });
});

namespace("js", function (){
    desc("Default way to render the production javascript.");
    task("make", function (){
        jake.Task["js:couchapp/attachments/js/plugins.js"].invoke();
        console.log("Minifying the site javascript...");
        jake.Task["js:couchapp/attachments/js/site.min.js"].invoke();
    });

    desc("Concatenates several things into the plugins.js file");
    file("couchapp/attachments/js/plugins.js", [], function (){
        console.log("Generating the plugins.js file...");
        var plugins = fs.readFileSync("couchapp/js/libs/plugins.js");
        var ember = fs.readFileSync("couchapp/js/libs/ember.min.js");
        var showdown = fs.readFileSync("couchapp/js/libs/showdown.js");

        fs.writeFileSync("couchapp/attachments/js/plugins.js", plugins + ember + showdown);
    });

    desc("Concatenates the site functionality files together and minifies");
    var files = ["api", "main", "user", "blog", "cv", "gametheory", "routes"].map(function (file){
        return "couchapp/js/site." + file + ".js";
    });
    minify({"couchapp/attachments/js/site.min.js": files});
});

namespace("css", function (){
    desc("Default way to create production css.");
    task("make", function (){
        jake.Task["css:couchapp/css/layout.css"].invoke();
        jake.Task["css:couchapp/attachments/ifm-min.css"].invoke();
    });

    desc("Creates the production css.");
    file("couchapp/attachments/ifm-min.css", ["css:couchapp/css/layout-min.css"], function (){
        console.log("Concatenating minified css files...");
        var reset = fs.readFileSync("couchapp/css/reset-min.css");
        var base = fs.readFileSync("couchapp/css/base-min.css");
        var fonts = fs.readFileSync("couchapp/css/fonts-min.css");
        var layout = fs.readFileSync("couchapp/css/layout-min.css");

        fs.writeFileSync("couchapp/attachments/ifm-min.css", reset + base + fonts + layout);
    });

    desc("Minifies the layout.css");
    file("couchapp/css/layout-min.css", ["css:couchapp/css/layout.css"], function (){
        console.log("Minifiying layout.css...");
        var source = fs.readFileSync("couchapp/css/layout.css", "utf8");

        fs.writeFileSync("couchapp/css/layout-min.css", cleancss.process(source));
    });

    desc("Generates the layout.css file from stylus");
    file("couchapp/css/layout.css", function (){
        console.log("Generating layout.css from stylus.");

        var source = fs.readFileSync("couchapp/css/layout.styl", "utf8");

        stylus.render(source, {filename: 'couchapp/css/layout.styl'}, function (err, css){
            if (err) throw err;

            fs.writeFileSync("couchapp/css/layout.css", css);

            complete();
        });
    }, {async: true});
});

function build_couchdb_url(conf){
    var cdbarray = ["http:/", config.couchdb.host, config.couchdb.db];

    if (conf.use_authentication){
        cdbarray[1] = conf.user + ":" + conf.pass + "@" + cdbarray[1];
    }

    return cdbarray.join("/");
}

namespace("notifier", function (){
    desc("Starts the notifier backend.");
    task("start", function (environ){
        var env = environ || config.forever.env || 'development';
        var host = process.env.host || config.forever.host || 'INADDR_ANY';
        var port = process.env.port || config.forever.port || 7060;
        var logDir = config.forever.logDir || "./log";
        var redis_channel = process.env.redis_channel || config.builder.redis_channel || "build tasks";
        var couchdb = process.env.couchdb || build_couchdb_url(config.couchdb);

        console.log("Starting build notifier at " + host + ":" + port + " in " + env + " mode...");
        console.log("Logging to " + logDir + "...");



        var child = forever.startDaemon("builder/buildnotifier.js", {
              silent: false
            , forever: true
            , uid: config.forever.uid
            , env: {
                  NODE_ENV: env
                , port: port
                , host: host
                , redis_channel: redis_channel
                , couchdb: couchdb
            }
            , logFile: [logDir, "notifier_forever.log"].join("/")
            , outFile: [logDir, "notifier_out.log"].join("/")
            , errFile: [logDir, "notifier_error.log"].join("/")
            , appendLog: true
        });

        child.on('exit', function (){
            console.log("Notifier: exiting forever process.");
        });

        child.on('error', function (err){
            console.log("Notifier: error on forever process:");
            console.log(err);
        });

        child.on('start', function (){
            console.log("Notifier: started forever process");
        });

        child.on('stop', function (){
            console.log("Notifier: stopped forever process");
        });

        child.on('restart', function (){
            console.log("Notifier: restarted forever process");
        });

        forever.startServer(child);
    });

    desc("Stops the notifier backend.");
    task("stop", function (){
        console.log("Stopping build notifier...");
        forever.stop("builder/buildnotifier.js");
    });

    desc("Gives a status update for the notifier backend.");
    task("status", function (){
        forever.list(true, function (err, list){
            if (err) fail("Forever couldn't list the processes.");

            list = (list || "").split("\n").filter(function (item){ return item.indexOf("builder/buildnotifier.js") !== -1;});

            if (list.length > 0){
                console.log(list.join("\n"));
            }
            else {
                console.log("Build notifier is stopped.");
            }

            complete();
        });
    }, {async: true});

    desc("Restarts the notifier backend.");
    task("restart", function (){
        console.log("Restarting build notifier...");
        forever.restart("builder/buildnotifier.js");
    });
});

namespace("worker", function (){
    desc("Starts the worker backend.");
    task("start", function (environ){
        var env = environ || config.forever.env || 'development';
        var logDir = config.forever.logDir || "./log";
        var redis_channel = process.env.redis_channel || config.builder.redis_channel || "build tasks";
        var couchdb = process.env.couchdb || build_couchdb_url(config.couchdb);
        var build_path = process.env.build_path || config.builder.build_path || "";
        var dist_path = process.env.dist_path || config.builder.dist_path || "";
        var python = process.env.python || config.builder.python || "";

        console.log("Starting build worker in " + env + " mode...");
        console.log("Logging to " + logDir + "...");

        var child = forever.startDaemon("builder/buildworker.js", {
              silent: false
            , forever: true
            , uid: config.forever.uid
            , env: {
                  NODE_ENV: env
                , redis_channel: redis_channel
                , couchdb: couchdb
                , build_path: build_path
                , dist_path: dist_path
                , python: python
            }
            , logFile: [logDir, "worker_forever.log"].join("/")
            , outFile: [logDir, "worker_out.log"].join("/")
            , errFile: [logDir, "worker_error.log"].join("/")
            , appendLog: true
        });

        child.on('exit', function (){
            console.log("Worker: exiting forever process.");
        });

        child.on('error', function (err){
            console.log("Worker: error on forever process:");
            console.log(err);
        });

        child.on('start', function (){
            console.log("Worker: started forever process");
        });

        child.on('stop', function (){
            console.log("Worker: stopped forever process");
        });

        child.on('restart', function (){
            console.log("Worker: restarted forever process");
        });

        forever.startServer(child);
    });

    desc("Stops the worker backend.");
    task("stop", function (){
        console.log("Stopping build worker...");
        forever.stop("builder/buildworker.js");
    });

    desc("Gives a status update for the worker backend.");
    task("status", function (){
        forever.list(true, function (err, list){
            if (err) fail("Forever couldn't list the processes.");

            list = (list || "").split("\n").filter(function (item){ return item.indexOf("builder/buildworker.js") !== -1;});

            if (list.length > 0){
                console.log(list.join("\n"));
            }
            else {
                console.log("Build worker is stopped.");
            }

            complete();
        });
    }, {async: true});

    desc("Restarts the worker backend.");
    task("restart", function (){
        console.log("Restarting build worker...");
        forever.restart("builder/buildworker.js");
    });

    desc("Forces a rebuild of all projects and buildsets.");
    task("forcebuild", function (){
        var redis_channel = process.env.redis_channel || config.builder.redis_channel || "build tasks";
        var couchdb = process.env.couchdb || build_couchdb_url(config.couchdb);

        var rclient = new redis.RedisClient(redis_channel);

        request(couchdb + "_design/app/_view/projects?include_docs=true", function (err, resp, body){
            if (!err){
                var response = JSON.parse(body);

                if (response.error){
                    fail(response.error);
                }
                else {
                    (response.rows || []).forEach(function (row){
                        var doc_data = row.doc._id.split(":");

                        if (doc_data.length === 4){
                            (row.doc.buildsets || []).forEach(function (buildset){

                                rclient.op({
                                      task: "build"
                                    , head: "HEAD"
                                    , project_owner: doc_data[1]
                                    , project_name: doc_data[2]
                                    , project_ref: doc_data[3]
                                    , buildset: buildset
                                });
                            });
                        }
                    });
                }
            }
            else {
                fail("Couldn't fetch project docs.");
            }
        });
    });
});
