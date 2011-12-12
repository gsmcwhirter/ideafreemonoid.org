window.User = Ember.Application.create({
    rootElement: $("#userbox")
});

User.User = Ember.Object.extend({
      name: null
    , roles: []
    , is_connected: false
});

User.currentUser = User.User.create();

User.userController = Ember.Object.create({
    currentUserBinding: "User.currentUser"

    , login: function (name, pass, cb){
        if (typeof name === "function") cb = name, name = null;
        if (typeof cb !== "function") cb = function (){};

        if (!name || !pass){
            name = $("#login-username").val();
            pass = $("#login-password").val();
        }

        var self = this;
        IFMAPI.startSession(name, pass, function (err, response){
            if (err){
                //TODO: error handling
            }

            if (response.ok){
                self.checkLogin();
                cb();
            }
            else {
                cb(data);
            }
        });
    }
    , logout: function (cb){
        if (typeof cb !== "function") cb = function (){};

        var self = this;
        IFMAPI.deleteSession(function (err, response){
            if (err){
                //TODO: error handling
            }

            if (response.ok){
                self.get('currentUser').setProperties({name: null, roles: [], is_connected: false});
                self.checkLogin();
                cb();
            }
            else {
                cb(response);
            }
        });
    }
    , checkLogin: function(cb){
        if (typeof cb !== "function") cb = function (){};

        var self = this;
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

            self.get('currentUser').setProperties(userCtx);
        });
    }
});

User.UserView = Ember.View.extend({
    currentUserBinding: "User.currentUser"
});

User.UsernameEntry = Ember.TextField.extend({
    insertNewline: function (){
        User.userController.login(function (){
        });
    }
});

User.PasswordEntry = Ember.TextField.extend({
    type: "password"
    , insertNewline: function (){
        User.userController.login(function (){
        });
    }
});

User.userController.checkLogin();