User = SC.Application.create();

User.User = SC.Object.extend({
      type: "user"
    , name: null
    , roles: []
    , is_connected: false
});
