/**
* Module dependencies.
*/

var express = require('express')
    , redis = require('./redis_client')
    , request = require('request')
    , zombie = require('zombie')
    , couchdb = process.env.couchdb || null
    ;

var app = module.exports = express.createServer();
var rclient = new redis.RedisClient(process.env.redis_channel || "build tasks", {
    ready: function (){
        app.listen(process.env.port || 7060, process.env.host || undefined);
        console.log("Express server listening on port %d in %s mode", process.env.port || 7060, app.settings.env);
        console.log("Accepting push notifications.");
    }
});

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

app.get('/', function (req, res, next){
    var fragment = req.param("_escaped_fragment_");
    if (fragment){
        zombie.visit("https://www.ideafreemonoid.org/#!"+fragment, function (err, browser){
            if (!err){
                browser.fire("hashchange", browser.window, function (){
                    browser.window.run("Ember.routes.set('location', '!"+fragment+"'); console.log('Manually setting location.');");
                    browser.wait(function (){
                        //console.log(browser.window.console.output);
                        console.log("Generated static content for https://www.ideafreemonoid.org/#!%s", fragment);
                        res.send(browser.html());
                    });
                });
            }
            else {
                next(err);
            }
        });
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

        request(couchdb + "/" + ["buildset", payload.repository.owner.name, payload.repository.name, ref].join(":"), function (err, resp, body){
            if (err){
                console.log("Buildset not found.");
                res.send("not ok");
            }
            else {
                var doc = JSON.parse(body);

                if (doc.type === "buildset"){
                    console.log("Payload OK.");

                    if (!doc.freeze){
                        rclient.op({
                            task: "build"
                            , head: payload.after
                            , project_owner: payload.repository.owner.name
                            , project_name: payload.repository.name
                            , project_ref: ref
                        });
                    }
                    else {
                        console.log("Buildset frozen.");
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
