function zeroPad(str, length){
        length = length || 2;
            
        if (str){
            str = "" + str;
        }
        else {
            str = "";
        }

        if (str.length >= length){
            return str;
        }
        else {
            while (str.length < length){
                str = "0" + str;
            }

            return str;
        }
}

function dateISOString(date){
    return  zeroPad(date.getUTCFullYear(), 4) + "-"
            + zeroPad(date.getUTCMonth() + 1, 2) + "-"
            + zeroPad(date.getUTCDate(), 2) + "T"
            + zeroPad(date.getUTCHours(), 2) + ":"
            + zeroPad(date.getUTCMinutes(), 2) + ":"
            + zeroPad(date.getUTCSeconds(), 2) + "Z";
}

window.SDConverter = new Showdown.converter();


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

        $.ajax("/session", {
              dataType: "json"
            , type: "POST"
            , data: {name: name, password: pass}
            , success: function (data){
                if (data.ok){
                    User.userController.checkLogin();
                    cb();
                }
                else {
                    cb(data);
                }
            }
        });
    }
    , logout: function (cb){
        if (typeof cb !== "function") cb = function (){};

        $.ajax("/session", {
              dataType: "json"
            , type: "DELETE"
            , success: function (data){
                if (data.ok){
                    User.currentUser.setProperties({name: null, roles: [], is_connected: false});
                    User.userController.checkLogin();
                    cb();
                }
                else {
                    cb(data);
                }
            }
        });
    }
    , checkLogin: function(cb){
        if (typeof cb !== "function") cb = function (){};

        $.ajax("/session", {
              dataType: "json"
            , type: "GET"
            , success: function (data){
                var userCtx = {
                      name: null
                    , roles: []
                    , is_connected: false
                }

                if (data.ok){
                    userCtx = data.userCtx;

                    //console.log(data);

                    if (data.info && data.info.authenticated){
                        userCtx.is_connected = true;
                    }
                }
                
                User.currentUser.setProperties(userCtx);
            }
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
