var passport = require("passport")
  , jwt = require("jsonwebtoken")
  ;

var FacebookStrategy = require("passport-facebook").Strategy
  , TwitterStrategy = require("passport-twitter").Strategy
  , GoogleStrategy = require("passport-google").Strategy
  , JWTStrategy = require("passport-jwt").Strategy
  , LocalStrategy = require("passport-local").Strategy
  ;

module.exports = function (app, appConf){
  // load passport strategies

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    //TODO
    /*User.findById(id, function(err, user) {
      done(err, user);
    });*/
  });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      //TODO
      /*User.findOne({ username: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validPassword(password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
      });*/
    }
  ));

  app.post('/login', passport.authenticate('local', 
            { 
              successRedirect: '/',
              failureRedirect: '/login'
            }));

  passport.use(new FacebookStrategy({
      clientID: appConf.facebook.app_id,//FACEBOOK_APP_ID,
      clientSecret: appConf.facebook.app_secret,//FACEBOOK_APP_SECRET,
      callbackURL: appConf.domain + "/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      //TODO
      /*User.findOrCreate(..., function(err, user) {
        if (err) { return done(err); }
        done(null, user);
      });*/
    }
  ));

  app.get('/auth/facebook', passport.authenticate('facebook'));
  app.get('/auth/facebook/callback', passport.authenticate('facebook',
          {
            successRedirect: '/',
            failureRedirect: '/login'
          }));

  passport.use(new TwitterStrategy({
      consumerKey: appConf.twitter.consumer_key,//TWITTER_CONSUMER_KEY,
      consumerSecret: appConf.twitter.consumer_secret,//TWITTER_CONSUMER_SECRET,
      callbackURL: appConf.domain + "/auth/twitter/callback"
    },
    function(token, tokenSecret, profile, done) {
      //TODO
      /*User.findOrCreate(..., function(err, user) {
        if (err) { return done(err); }
        done(null, user);
      });*/
    }
  ));

  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback', passport.authenticate('twitter',
          {
            successRedirect: '/',
            failureRedirect: '/login'
          }));

  passport.use(new GoogleStrategy({
      returnURL: appConf.domain + "/auth/google/callback",
      realm: appConf.domain
    },
    function(identifier, profile, done) {
      //TODO
      /*User.findOrCreate({ openId: identifier }, function(err, user) {
        done(err, user);
      });*/
    }
  ));

  app.get('/auth/google', passport.authenticate('google'));
  app.get('/auth/google/callback', passport.authenticate('google',
          {
            successRedirect: '/',
            failureRedirect: '/login'
          }));

  passport.use(new JWTStrategy(appConf.jwt, function(jwt_payload, done) {
      //TODO
      /*User.findOne({id: jwt_payload.sub}, function(err, user) {
          if (err) {
              return done(err, false);
          }
          if (user) {
              done(null, user);
          } else {
              done(null, false);
              // or you could create a new account 
          }
      });*/
  }));
};