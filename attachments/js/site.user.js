window.User = SC.Application.create({
    rootElement: $("#userbox")
});

User.User = SC.Object.extend({
      name: null
    , roles: []
    , is_connected: false
});

User.currentUser = User.User.create();

User.userController = SC.Object.create({
    currentUser: function (){
        return User.currentUser;
    }.property("User.currentUser")

    , login: function (name, pass, cb){
        if (typeof name === "function") cb = name, name = null;
        if (typeof cb !== "function") cb = function (){};

        if (!name || !pass){
            name = $("#login-username").val();
            pass = $("#login-password").val();
        }

        IFMAPI.startSession(name, pass, function (err, response){
            if (err){
                //TODO: error handling
            }

            if (response.ok){
                User.userController.checkLogin();
                cb();
            }
            else {
                cb(data);
            }
        });
    }
    , logout: function (cb){
        if (typeof cb !== "function") cb = function (){};

        IFMAPI.deleteSession(function (err, response){
            if (err){
                //TODO: error handling
            }

            if (response.ok){
                User.currentUser.setProperties({name: null, roles: [], is_connected: false});
                User.userController.checkLogin();
                cb();
            }
            else {
                cb(response);
            }
        });
    }
    , checkLogin: function(cb){
        if (typeof cb !== "function") cb = function (){};

        IFMAPI.getSession(function (err, response){
            var userCtx = {
                  name: null
                , roles: []
                , is_connected: false
            }

            if (err){
                //TODO: error handling
            }

            if (response.ok){
                userCtx = response.userCtx;

                if (response.info && response.info.authenticated){
                    userCtx.is_connected = true;
                }
            }

            User.currentUser.setProperties(userCtx);
        });
    }
});

User.UserView = SC.View.extend({
    currentUser: function (){
        return User.currentUser;
    }.property("User.currentUser")
});

User.UsernameEntry = SC.TextField.extend({
    insertNewline: function (){
        var self = this;
        User.userController.login(function (err){
        });
    }
});

User.PasswordEntry = SC.TextField.extend({
    type: "password"
    , insertNewline: function (){
        var self = this;
        User.userController.login(function (err){
        });
    }
});

User.userController.checkLogin();