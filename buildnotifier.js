/**
 * Module dependencies.
 */

var express = require('express')
    , config = require('./config.live')
    , redis = require('redis')
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
    if (rclient.publish(config.builder.redis_channel || "build tasks", JSON.stringify(nexttask)) === false){
        console.log("Pausing redis publication.");
        rclient_paused = true;
    }
    else if (rclient_queue.length > 0) {
        process.nextTick(rclient_op);
    }
}


app.post('/', function (req, res, next){
    var payload = req.body.payload
});

rclient.on("ready", function (){
    app.listen(config.port);
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
