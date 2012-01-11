var redis = require('redis')
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

    message = JSON.parse(message);

    if (message.task === "build"){
        console.log("Building %s at %s", message.project, message.head);
    }
});

rclient.on("ready", function (){
    rclient.subscribe(process.env.redis_channel || "build tasks");
});

console.log("Build worker is now on the job. Listening to " + process.env.redis_channel);
