var redis = require("redis");

var RedisClient = function (channel, events, client){
    this._paused = false;
    this._queue = [];
    this._client = client || redis.createClient();
    this._channel = channel;

    var self = this;

    this._client.on("error", function (err){
        console.log("Redis Error: " + err);
    });

    this._client.on("drain", function (){
        if (self._paused){
            console.log("Resuming redis publication.");
            self._paused = false;

            if (self._queue.length > 0){
                process.nextTick(function (){self.op();});
            }
        }
    });

    events = events || {};

    for (var key  in events){
        if (events.hasOwnProperty(key)){
            this._client.on(key, events[key]);
        }
    }
};

RedisClient.prototype.op = function (task){
    if (task){
        this._queue.push(task);
    }
    else if (this._queue.length === 0){
        return;
    }

    var nexttask = this._queue.shift();

    if (this._client.publish(this._channel, JSON.stringify(nexttask)) === false){
        console.log("Pausing redis publication.");
        this._paused = true;
    }
    else if (this._queue.length > 0){
        console.log("Queue exists. Running next item.");
        var self = this;
        process.nextTick(function (){self.op();});
    }
    else {
        console.log("Message published.");
    }

    return;
};

exports.RedisClient = RedisClient;