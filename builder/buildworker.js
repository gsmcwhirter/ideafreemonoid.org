var redis = require('redis')
    , request = require('request')
    , git = require('./git')
    , exec = require("child_process").exec
    , fs = require("fs")
    , follow = require("follow")
    , task_queue = require("./task_queue").task_queue

    , couchdb = process.env.couchdb || null
    , build_path = process.env.build_path || null
    , dist_path = process.env.dist_path || null
    , python = process.env.python || null
    , version_regex = /version\s*=\s*['"](\d+\.\d+(?:\.\d+)?)['"]/i
    , name_regex = /name\s*=\s*['"]([^'"]+)['"]/i
    , license_regex = /license\s*=\s*['"]([^'"]+)['"]/i
    , classifiers_regex = /classifiers\s*=\s*\[([^\]]*)\]/im
    , cparse_regex = /['"]([^'"]+)['"]/i
    ;

var rclient = redis.createClient();

rclient.on("error", function (err){
    console.log("Redis Error: " + err);
});

rclient.on("subscribe", function (channel){
    console.log("Subscribed to " + channel);
});

rclient.on("message", function (channel, message){
    console.log("Got message on channel " + channel + ": " + message);

    message = JSON.parse(message);

    if (message.task === "build" && build_path && dist_path && python){
        console.log("Building %s:%s:%s:%s at %s", message.project_owner, message.project_name, message.project_ref, message.buildset, message.head);

        request(couchdb + "/" + ["buildset", message.project_owner, message.project_name, message.project_ref, message.buildset].join(":"), function (err, resp, body){

            if (err){
                console.log(err);
                //TODO: error handling
            }
            else {
                var doc = JSON.parse(body);

                if (!doc.error && doc.type === "buildset"){
                    do_build(message, doc);
                }
                else if (doc.error && (doc.reason === "missing" || doc.reason === "deleted")){
                    doc = {
                          "_id": ["buildset", message.project_owner, message.project_name, message.project_ref, message.buildset].join(":")
                        , "type": "buildset"
                        , builds: []
                        , status: "ready"
                        , origin: "git://github.com/" + message.project_owner + "/" + message.project_name + ".git"
                    };

                    request.put({ uri: couchdb + "/" + doc._id
                                , body: JSON.stringify(doc)
                                , headers: {"Content-type": "application/json"}
                    }, function (err, resp, body){
                        if (!err){
                            var jresp = JSON.parse(body);

                            if (!jresp.error){
                                doc._rev = jresp.rev;
                                console.log("Kicking off build...");
                                do_build(message, doc);
                            }
                        }
                    }
                    );
                }
                else {
                    console.log("Error: %s, %s", doc.error, doc.reason);
                }
            }
        });
    }
});

rclient.on("ready", function (){
    rclient.subscribe(process.env.redis_channel || "build tasks");
});

var queues = {};

follow({db: couchdb, since: "now", include_docs: true}, function (err, change){
    if (!err){
        console.log("Follow change notification...");
        if (change.doc && change.doc.type === "buildset" && change.doc.status !== "building"){
            console.log("Follow buildset change.");
            queues[change.doc._id] = queues[change.doc._id] || [];
            if (queues[change.doc._id].length > 0){
                var message = queues[change.doc._id].shift();

                do_build(message, change.doc, true);
            }
        }
    }
    else {
        console.log("Follow error:");
        console.log(err);
    }
});

function do_build(message, doc, from_queue){
    if (doc.status === "building" && !from_queue){
        console.log("Already building. Adding to queue...");
        queues[doc._id] = queues[doc._id] || [];
        queues[doc._id].push(message);
    }
    else if (doc.status === "building"){
        console.log("Error: Already building, but got from queue.");
        //TODO: notification / error handling
    }
    else if (doc.type === "buildset"){
        doc.status = "building";
        request.put({ uri: couchdb + "/" + doc._id
                    , body: JSON.stringify(doc)
                    , headers: {"Content-type": "application/json"}
        }, function (err, resp, body){
            if (!err){
                var jresp = JSON.parse(body);

                if (!jresp.error){
                    doc._rev = jresp.rev;
                    console.log("Processing build...");
                    process_build(message, doc);
                }
            }
        });
    }
    else {
        console.log("Error: not a buildset");
    }
}

function handle_build_error(message, doc, err, version, test_results, callback){
    if (typeof version === "function"){
        callback = version;
        test_results = null;
        version = null;
    }
    else if (typeof test_results === "function"){
        callback = test_results;
        test_results = null;
    }
    else {
        callback = callback || function (){};
    }

    //TODO: notification
    console.log("Error on " + [message.project_owner, message.project_name, message.project_ref, message.buildset].join(":") + " -- " + err);

    var build = null;
    if (doc.last_build && version){
        build = (doc.last_build[version] || 0) + 1;
    }

    doc.builds = doc.builds || [];
    doc.builds.push({
          version: version || "unknown"
        , build: build || "unknown"
        , date: (new Date()).toISOString()
        , status: "failed"
        , error: err
        , test_results: test_results || "unknown"
    });

    finish_build(doc, version, callback);
}

function finish_build(doc, version, callback){
    if (typeof version === "function"){
        callback = version;
        version = null;
    }
    else {
        callback = callback || function (){};
    }

    if (version){
        doc.last_build = doc.last_build || {};
        doc.last_build[version] = (doc.last_build[version] || 0) + 1;
    }

    doc.status = "ready";

    request.put({ uri: couchdb + "/" + doc._id
                , body: JSON.stringify(doc)
                , headers: {"Content-type": "application/json"}
    }, function (err, resp, body){
        if (!err){
            var jresp = JSON.parse(body);

            if (!jresp.error){
                doc._rev = jresp.rev;
                callback(null, doc);
            }
            else {
                callback(jresp.error);
            }
        }
        else {
            callback(err);
        }
    });
}

function parse_classifiers(str){
    var lines = str.split("\n");

    var lineres = lines.map(function (line){
        var cfs = line.split(",");
        return cfs.map(function (line){
            var classifier = cparse_regex.exec(line.trim());
            return classifier ? classifier[1] : null;
        });
    });

    var res = [];

    lineres.forEach(function (arr){
        res.concat(arr.filter(function (item){return item;}));
    });

    res.sort();

    return res;
}

function process_build(message, doc){
    var proj_id = [message.project_owner, message.project_name, message.project_ref, message.buildset];
    var repo = new git.Repo({path: [build_path, proj_id.join("_")].join("/"), origin: doc.origin});

    //console.log("Created repo object:");
    //console.log(repo);

    var last_head;
    var git_build_tasks = [
          ["checkExists", [true]]
        , ["reset", [["--hard"]]]
        , ["revparse", [["--verify", "HEAD"]], function (data){last_head = data.trim();}]
        , ["checkout", [message.project_ref]]
        , ["fetch", [["origin"]]]
        , ["merge", [["origin/"+message.project_ref]]]
        , ["checkout", [message.head, {notBackwards: !message.force, last_head: function (){return last_head;}}]]
    ];

    repo.process_tasks(git_build_tasks, function (err){
        console.log("Done git tasks.");
        if (!err){
            //git is in the right spot now
            var pdir = repo.path + "/" + message.buildset;

            fs.readFile(pdir + "/setup.py", "utf8", function (err, data){
                //console.log(pdir + "/setup.py");
                if (!err){

                    var version = null;
                    var matches2 = version_regex.exec(data);
                    if (matches2){
                        version = matches2[1];
                    }

                    doc.last_build = doc.last_build || {};
                    var build = (doc.last_build[version] || 0) + 1;

                    var matches = name_regex.exec(data);
                    var lmatches = license_regex.exec(data);
                    var cmatches = classifiers_regex.exec(data);

                    if (lmatches && doc.license !== lmatches[1]){
                        doc.license = lmatches[1];
                    }

                    if (cmatches){
                        var classifiers = parse_classifiers(cmatches[1]);
                        doc.classifiers = classifiers;
                    }

                    if (matches){

                        var dist_name = matches[1];

                        if (version){
                            data = data.replace(version_regex, "version = '$1-" + build + "'");

                            var filename = dist_name + "-" + version + "-" + build + ".tar.gz";
                            var dist_dir = [message.project_owner, message.project_name, message.project_ref, message.buildset].join("_");

                            var test_results = "";

                            var fsTasks = [
                                  [fs.writeFile, [pdir + "/setup.py", data], "could not update version string"]
                                , [exec, [["cd", pdir, "&&", python, "setup.py", "nosetests", "--verbosity=2", "--with-coverage"].join(" ")], undefined, function (err, stdout, stderr){
                                    test_results = stdout;
                                    test_results += "\n\n" + stderr;
                                }]
                                , [exec, [["cd", pdir, "&&", python, "setup.py", "sdist"].join(" ")]]
                                , [fs.stat, [dist_path + "/" + dist_dir], true]
                            ];

                            var self = this;
                            task_queue(fsTasks, function (task, next){

                                var cb = function (err, stdout, stderr){
                                    if (typeof task[3] === "function"){
                                        (task[3])(err, stdout, stderr);
                                    }

                                    if (err){
                                        next(task[2] || stderr || err);
                                    }
                                    else {
                                        next();
                                    }
                                };

                                var args = task[1] || [];
                                args.push(cb);

                                if (typeof task[0] === "function"){
                                    task[0].apply(self, args);
                                }
                                else {
                                    next("Unknown function: " + task[0]);
                                }
                            }, function (err){
                                var next = function (){
                                    fs.rename(pdir + "/dist/" + filename, dist_path + "/" + dist_dir + "/" + filename, function (err){
                                        //console.log(pdir + "/dist/" + filename);
                                        //console.log(dist_path + "/" + dist_dir + "/" + filename);
                                        if (!err){
                                            doc.builds = doc.builds || [];
                                            doc.builds.push({
                                                  version: version
                                                , build: build
                                                , date: (new Date()).toISOString()
                                                , status: "ok"
                                                , test_results: test_results
                                                , download_dir: dist_dir
                                                , download_file: filename
                                            });

                                            fs.readFile(pdir + "/README.md", "utf8", function (err, readme){
                                                if (!err){
                                                    doc.description = readme;
                                                }

                                                finish_build(doc, version);
                                            });
                                        }
                                        else {
                                            handle_build_error(message, doc, "could not move to dist location: " + err, version, test_results);
                                        }
                                    });
                                };

                                if (err === true){
                                    fs.mkdir(dist_path + "/" + dist_dir, function (err){
                                        if (!err){
                                            next();
                                        }
                                        else {
                                            handle_build_error(message, doc, "could not create dist location", version, test_results);
                                        }
                                    });
                                }
                                else if (err){
                                    handle_build_error(message, doc, err, version, test_results);
                                }
                                else {
                                    next();
                                }
                            });


                        }
                        else {
                            handle_build_error(message, doc, "could not find version string", version);
                        }
                    }
                    else {
                        handle_build_error(message, doc, "could not find dist name", version);
                    }
                }
            });
        }
        else {
            handle_build_error(message, doc, err);
        }
    });

}

console.log("Build worker is now on the job. Listening to " + process.env.redis_channel);
