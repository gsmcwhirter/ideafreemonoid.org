var redis = require('redis')
    , config = require('./config.live')
    ;

var rclient = redis.createClient();

rclient.on("error", function (err){
    console.log("Redis Error: " + err);
});

rclient.on("subscribe", function (channel){
    console.log("Subscribed to " + channel);
});

rclient.on("message", function (channel, message){
    //TODO: do work here
    console.log("Got message on channel " + channel + ": " + message);

});

rclient.on("ready", function (){
    rclient.subscribe(config.builder.redis_channel || "build tasks");
});

console.log("Build worker is now on the job.");
