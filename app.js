var koa = require('koa')
  , responseTime = require("koa-response-time")
  , logger = require("koa-logger")
  , session = require("koa-generic-session")
  , RedisStore = require("koa-redis")
  , Jade = require("koa-jade")
  , stylus = require('koa-stylus')
  , serve = require('koa-static')
  , massive = require("massive")
  , helmet = require("koa-helmet")
  , Router = require("koa-router")
  , favicon = require("koa-favicon")
  , bodyParser = require("koa-bodyparser")
  , path = require('path')
  ;

// load configuation files
var databaseConf = require("./database.json")
  , appConf = require("./config.json")
  ;

// app setup
var app = koa();

//connect to database
var dbInstance = massive.connectSync(databaseConf[app.env]);

// response time headers
app.use(responseTime());

// logging
app.use(logger());

// favicon
app.use(favicon(__dirname + '/public/images/favicon.ico'));

// set database reference
app.db = dbInstance;

// body parser
app.use(bodyParser());

// cookie parser

// sessions
var sessConf = {
  secret: appConf.cookie_secret
, resave: false
, saveUninitialized: false
, cookie: {}
};

if (app.env === 'production') {
  //app['trust proxy'] = 1; // trust first proxy
  sessConf.cookie.secure = true; // serve secure cookies
  sessConf.store = new RedisStore(appConf.redis);
}

app.use(session(sessConf));

// view engine setup
const jade = new Jade({
  viewPath: './views',
  debug: false,
  pretty: false,
  compileDebug: false,
  locals: {},
  basedir: './views',
  helperPath: [],
  app: app // equals to jade.use(app) and app.use(jade.middleware)
});

// stylus to css
app.use(stylus('./public'));

// static files
app.use(serve('./public'));

// helmet
app.use(helmet());

//require("./auth")(app, appConf);

// routing
// load routes
var indexroutes = require('./routes/index')
  , users = require('./routes/users')
  , api1 = require('./routes/api/v1')
  ;

var router = new Router();
router.use("/", indexroutes.routes(), indexroutes.allowedMethods());
router.use("/users", users.routes(), users.allowedMethods());
router.use("/api/v1", api1.routes(), api1.allowedMethods());

app.use(router.routes());
app.use(router.allowedMethods());

// rendering
app.use(function *(next){
  this.render('index', {}, true);
  yield next;
});

// catch 404 and forward to error handler
/*app.use(function *(next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});*/

// development error handler
// will print stacktrace
/*if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}*/

// production error handler
// no stacktraces leaked to user
/*app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});*/

module.exports = app;
