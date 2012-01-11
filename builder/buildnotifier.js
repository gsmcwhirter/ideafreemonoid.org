/**
 * Module dependencies.
 */

var express = require('express')
    , redis = require('redis')
    , repo_name = process.env.repo_name || ""
    , repo_owner = process.env.repo_owner || ""
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
    console.log("Here");
    var fragment = req.param("_escaped_fragment_");
    if (fragment){
        res.send([fragment, req.url]); //TODO: real functionality

    }
    else {
        res.send("not found", 404);
    }
});

app.post('/build/', function (req, res, next){
    var payload = JSON.parse(req.body.payload || 'null');

    console.log(payload);

    if (payload &&
            payload.commits &&
            payload.repository &&
            payload.repository.name === repo_name &&
            payload.repository.owner === repo_owner &&
            payload.ref === "refs/heads/master"){

        var build_orders = {};

        var checkpath = function (path){
            var parts = path.split("/");
            if (parts.length > 1){
                build_orders[parts[0]] = true;
            }
        };

        payload.commits.forEach(function (commit){
            (commit.added || []).forEach(checkpath);
            (commit.modified || []).forEach(checkpath);
            (commit.removed || []).forEach(checkpath);
        });

        for (var key in build_orders){
            if (build_orders.hasOwnProperty(key)){
                rclient_op({
                      head: payload.after
                    , project: key
                });
            }
        }

        res.end("ok");
    }
    else {
        res.end("not ok", 403);
    }
});

rclient.on("ready", function (){
    app.listen(process.env.port || 7060, process.env.host || undefined);
    console.log("Express server listening on port %d in %s mode", process.env.port || 7060, app.settings.env);
});
