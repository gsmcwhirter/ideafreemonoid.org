/**
 * Module dependencies.
 */

var express = require('express')
    , config = require('./config')
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

var rclient = redis.createClient();

app.get('/', function (req, res, next){

});
app.post('/', function (req, res, next){

});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
