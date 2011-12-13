window.IFMAPI = {
    getView: function (view, options, callback){
        if (typeof options  === "function") callback = options, options = {};

        $.ajax("/api/_design/app/_view/" + view + "/?" + $.param(options), {
              dataType: "json"
            , type: "GET"
            , success: function (response){
                callback(null, response);
            }
            , error: function (response){
                callback(true, response);
            }
        });
    }
    , getSession: function (callback){
        $.ajax("/api/_session", {
              dataType: "json"
            , type: "GET"
            , success: function (response){
                callback(null, response);
            }
            , error: function (response){
                callback(true, response);
            }
        });
    }
    , startSession: function (name, pass, callback){
        $.ajax("/api/_session", {
              dataType: "json"
            , type: "POST"
            , data: {name: name, password: pass}
            , success: function (response){
                callback(null, response);
            }
            , error: function (response){
                callback(true, response);
            }
        });
    }
    , deleteSession: function (callback){
        $.ajax("/api/_session", {
              dataType: "json"
            , type: "DELETE"
            , success: function (response){
                callback(null, response);
            }
            , error: function (response){
                callback(true, response);
            }
        });

    }
    , getUUIDs: function (options, callback){
        if (typeof options  === "function") callback = options, options = {};

        $.ajax("/api/_uuids/?" + $.param(options), {
              dataType: "json"
            , type: "GET"
            , success: function (response){
                callback(null, response);
            }
            , error: function (response){
                callback(true, response);
            }
        });
    }
    , getDoc: function (id, options, callback){
        if (typeof options  === "function") callback = options, options = {};
        
        $.ajax("/api/" + id + "/?" + $.param(options), {
              dataType: "json"
            , type: "GET"
            , success: function (response){
                callback(null, response);
            }
            , error: function (response){
                callback(true, response);
            }
        });
    }
    , putDoc: function (id, doc, callback){
        $.ajax("/api/" + id, {
              dataType: "json"
            , type: "PUT"
            , data: JSON.stringify(doc)
            , contentType: "application/json"
            , success: function (response){
                callback(null, response);
            }
            , error: function (response){
                callback(true, response);
            }
        });
    } 
}
