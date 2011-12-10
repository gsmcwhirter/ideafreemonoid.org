User = SC.Application.create({
    rootElement: $("#userbox")
});

User.User = SC.Object.extend({
      type: "user"
    , name: null
    , roles: []
    , is_connected: false
});
