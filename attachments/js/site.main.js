$(function(){
    // Fill this with your database information.
    // `ddoc_name` is the name of your couchapp project.
    Backbone.couch_connector.config.db_name = "taotecraft";
    Backbone.couch_connector.config.ddoc_name = "app";

    // If set to true, the connector will listen to the changes feed
    Backbone.couch_connector.config.global_changes = true;
  
    var User = Backbone.Model.extend({
      
    });
  
    var UserEditView = Backbone.View.extend({
      
    });
  
    var AppRouter = Backbone.Router.extend({
        initialize: function (options){
          
        }
        , routes: {
          
        }
    });
  
    new AppRouter();
});
