window.User = Ember.Application.create({
      rootElement: $("#userbox")
    , ready: function (){
        this._super();
        User.userController.checkLogin();
    }
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
        console.log("Logging in...");
        if (typeof name === "function") cb = name, name = null;
        if (typeof cb !== "function") cb = function (){};

        if (!name || !pass){
            name = $("#login-username").val();
            pass = $("#login-password").val();
            //console.log(name);
            //console.log(pass);
        }

        var self = this;
        IFMAPI.startSession(name, pass, function (err, response){
            if (err){
                //TODO: error handling
                console.log("Error!");
                console.log(err)
                console.log(response);
            }

            if (response && response.ok){
                self.checkLogin();
                cb();
            }
            else {
                console.log(response);
                cb(response);
            }
        });
    }
    , logout: function (){

        var cb;
        console.log("Logging out...");
        if (typeof cb !== "function") cb = function (){};

        var self = this;
        IFMAPI.deleteSession(function (err, response){
            if (err){
                //TODO: error handling
                console.log("Error!");
                console.log(err)
                console.log(response);
            }

            if (response && response.ok){
                self.get('currentUser').setProperties({name: null, roles: [], is_connected: false});
                self.checkLogin();
                cb();
            }
            else {
                console.log(response);
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
                console.log("Error!");
                console.log(err)
                console.log(response);
            }

            if (response && response.ok){
                userCtx = response.userCtx;

                if (response.info && response.info.authenticated){
                    userCtx.is_connected = true;
                }
            }
            else {
                //TODO: error handling
                console.log("Error!");
                console.log(err)
                console.log(response);
            }

            var user = self.get('currentUser');
            if (user){
                user.setProperties(userCtx);
            }
            else {
                console.log("currentUser not registered.");
                //TODO: handle
            }
        });
    }
    , isConnected: function (){
        return this.get("currentUser").get("is_connected");
    }
});

User.UserView = Ember.View.extend({
      templateName: "user"
    , currentUserBinding: "User.userController.currentUser"

    , userLoginView: Ember.View.extend({
        templateName: "user-login"

        , usernameView: Ember.TextField.extend({
              placeholder: "Username"
            , insertNewline: function (){
                User.userController.login()
            }
        })
        , passwordView: Ember.TextField.extend({
              placeholder: "Password"
            , type: "password"
            , insertNewline: function (){
                User.userController.login();
            }
        })
        , loginButton: Ember.Button.extend({
              classBinding: "isActive"
            , target: "User.userController"
            , action: "login"
        })
    })
    , userLogoutView: Ember.View.extend({
        templateName: "user-logout"

    })
});

User.LogoutButton = Ember.Button.extend({
      classBinding: "isActive"
    , target: "User.userController"
    , action: "logout"
});

