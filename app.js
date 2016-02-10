var express = require('express')
  , session = require('express-session')
  , RedisStore = require('connect-redis')(session)
  , path = require('path')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , massive = require("massive")
  , stylus = require("stylus")
  , nib = require("nib")
  ;

// express app
var app = express();

// load configuation files
var databaseConf = require("./database.json")
  , appConf = require("./config.json")
  ;

// connect to the database
var dbInstance = massive.connectSync(databaseConf[app.get('env')]);
app.set('db', dbInstance);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// sessions
var sessConf = {
  secret: appConf.cookie_secret
, resave: false
, saveUninitialized: false
, cookie: {}
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // trust first proxy
  sessConf.cookie.secure = true; // serve secure cookies
  sessConf.store = new RedisStore(appConf.redis);
}

// stylus
function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib());
}


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session(sessConf));

require("./auth")(app, appConf);

app.use(stylus.middleware(
  { src: __dirname + '/public'
  , compile: compile
  }
));

app.use(express.static(path.join(__dirname, 'public')));

// load routes
var routes = require('./routes/index')
  , users = require('./routes/users')
  , api1 = require('./routes/api/v1')
  ;

app.use('/', routes);
app.use('/users', users);
app.use('/api/v1', api1);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
