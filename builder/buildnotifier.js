/**
 * Module dependencies.
 */

var express = require('express')
    , redis = require('redis')
    , request = require('request')
    , couchdb = process.env.couchdb || null
    ;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

// Routes

var rclient = redis.createClient()
    , rclient_paused = false
    , rclient_queue = []
    ;

rclient.on("error", function (err){
    console.log("Redis Error: " + err);
});

rclient.on("drain", function (){
    if (rclient_paused){
        console.log("Resuming redis publication.");
        rclient_paused = false;

        if (rclient_queue.length > 0){
            process.nextTick(rclient_op);
        }
    }
});

function rclient_op(task){
    if (task){
        rclient_queue.push(task);
    }

    if (rclient_queue.length === 0){
        return;
    }

    var nexttask = rclient_queue.shift();
    if (rclient.publish(process.env.redis_channel || "build tasks", JSON.stringify(nexttask)) === false){
        console.log("Pausing redis publication.");
        rclient_paused = true;
    }
    else if (rclient_queue.length > 0) {
        process.nextTick(rclient_op);
    }
}

app.get('/', function (req, res, next){
    var fragment = req.param("_escaped_fragment_");
    if (fragment){
        res.send([fragment, req.url]); //TODO: real functionality

    }
    else {
        res.send("not found", 404);
    }
});

app.post('/build', function (req, res){
    console.log("Processing push notification...");
    var payload = JSON.parse(req.body.payload || 'null');

    if (payload && payload.commits && payload.repository && payload.repository.owner){

        var ref_parts = payload.ref.split("/");
        var ref = ref_parts.pop();

        request(couchdb + "/" + ["project", payload.repository.owner.name, payload.repository.name, ref].join(":"), function (err, resp, body){
            if (err){
                console.log("Project not found.");
                res.send("not ok");
            }
            else {
                var doc = JSON.parse(body);

                if (doc.type === "project"){
                    console.log("Payload OK.");

                    var build_orders = {};

                    var checkpath = function (path){
                        var parts = path.split("/");
                        if (parts.length > 1 && doc.buildsets.indexOf(parts[0]) !== -1){
                            build_orders[parts[0]] = true;
                        }
                    };

                    payload.commits.forEach(function (commit){
                        console.log(commit.added);
                        console.log(commit.modified);
                        console.log(commit.removed);
                        (commit.added || []).forEach(checkpath);
                        (commit.modified || []).forEach(checkpath);
                        (commit.removed || []).forEach(checkpath);
                    });

                    for (var key in build_orders){
                        if (build_orders.hasOwnProperty(key)){
                            rclient_op({
                                  task: "build"
                                , head: payload.after
                                , project_owner: payload.repository.owner.name
                                , project_name: payload.repository.name
                                , project_ref: ref
                                , buildset: key
                            });
                        }
                    }

                    res.send("ok");
                }
                else {
                    console.log("Payload not OK.");
                    res.send("not ok");
                }
            }
        });


    }
    else {

    }
});

rclient.on("ready", function (){
    app.listen(process.env.port || 7060, process.env.host || undefined);
    console.log("Express server listening on port %d in %s mode", process.env.port || 7060, app.settings.env);
    console.log("Accepting push notifications.");
});
