module.exports = {
      forever: {
          env: "development"
        , port: 7060
        , host: '127.0.0.1'
        , logDir: "/var/log/node/ifm"
        , uid: "gmcwhirt"
    }
    , builder: {
          path: '/path/to/area'
        , python: '/path/to/python'
        , redis_channel: "build tasks"
        , repo_name: "gametheory"
        , repo_owner: "gsmcwhirter"
    }
    , couchdb: {
          host: "http://localhost:5984"
        , db: "ideafreemonoid"
        , use_authentication: false
        , user: ""
        , pass: ""
    }
    , system: {
          name: "IdeaFreeMonoid"
        , error_email: "greg@ideafreemonoid.org"
    }
    , smtp: {
          host: "smtp.example.com"
        , port: 465
        , auth_required: true
        , user: "webmaster@example.com"
        , pass: "don't list the real one in the repo..."
        , from_addr: "webmaster@example.com"
        , secure: true
        , debug: true
    }
}