var Gametheory = Ember.Application.create({
    rootElement: $("#gametheory")
});

Gametheory.Router = {
    index: function (){
        _gaq.push(["_trackPageview", "#!gametheory"]);

        App.hideAll();

        //load content
        Gametheory.buildsetsController.loadPage();

        this.get("rootElement").show();
        App.setTitle("Game Theory");
    }
    , show_buildset: function (params){
        if (!params.buildset){
            Ember.routes.set('location', '!gametheory');
        }
        else {
            _gaq.push(["_trackPageview", "#!gametheory/" + params.buildset]);

            App.hideAll();

            //load content
            Gametheory.buildsetsController.loadPage(params.buildset, params.build);

            this.get("rootElement").show();
            App.setTitle("Game Theory");
        }
    }
};

Gametheory.Buildset = Ember.Object.extend({
      builds: []
    , last_build: -1
    , origin: null
    , status: null
    , type: "buildset"
    , _id: null
    , _rev: null

    , lastSuccessfulBuild: function (){
        var builds = this.get("builds");
        var ct = builds.length;

        for (var i = ct-1; i >=0; i--){
            if (builds[i] && builds[i].status === "ok"){
                return {
                      build: i
                    , build_report: builds[i]
                };
            }
        }

        return {
            build: -1
        };
    }.property("builds").cacheable()

    , lastSuccessfulBuildDate: function (){
        var lsb = this.get("lastSuccessfulBuild");

        if (lsb.build > -1){
            return (new Date(lsb.build_report.date)).toLocaleString();
        }
        else {
            return "never";
        }
    }.property("lastSuccessfulBuild").cacheable()

    , hasSuccessfulBuild: function (){
        return this.get("lastSuccessfulBuild").build > -1;
    }.property("lastSuccessfulBuild").cacheable()

    , packageName: function (){
        var id = this.get("_id");
        var parts = (id || "").split(":");

        return parts[2] + "." + parts[4];
    }.property("_id").cacheable()

    , permalink: function (){
        var id = this.get("_id");
        var parts = (id || "").split(":");

        parts.shift();

        return "#!gametheory/" + parts.join(":");
    }.property("_id").cacheable()

    , lastSuccessfulBuildLink: function (){
        return this.get("permalink") + "/" + this.get("lastSuccessfulBuild");
    }.property("permalink", "lastSuccessfulBuild").cacheable()

    , formattedBuilds: function (){
        var builds = (this.get("builds") || []).slice();

        return _(builds).map(function (build){
            build.date = (new Date(build.date)).toLocaleString();
            build.successful = (build.status === "ok");
            build.failure = !build.successful;
            build.downloadLink = "/files/" + build.download_dir + "/" + build.download_file;
            return build;
        });
    }.property("builds").cacheable()
});

Gametheory.buildsetsController = Ember.ArrayController.create({
      content: []
    , showBuild: null

    , orderedContent: function (){
        var content = this.get("content").slice();

        content.sort(function (a, b){
            var a_data = a._id.split(":");
            var b_data = b._id.split(":");

            var a_is_base = (a_data[4] === "base");
            var b_is_base = (b_data[4] === "base");

            if (a_is_base && b_is_base){
                return 0;
            }
            else if (a_is_base){
                return -1;
            }
            else if (b_is_base){
                return 1;
            }
            else if (a_data[4] < b_data[4]){
                return -1;
            }
            else if (a_data[4] > b_data[4]){
                return 1;
            }
            else {
                return 0;
            }
        });

        return content;
    }.property("content").cacheable()

    , loadPage: function (buildset, build){
        var self = this;
        if (buildset){
            IFMAPI.getDoc("buildset:" + buildset, function (err, response){
                if (!err && !response.error){
                    self.set("showBuild", build || null);
                    self.set("content", [response]);
                }
                else {
                    //TODO: error handling
                }
            });
        }
        else {
            IFMAPI.getView("buildsets", {include_docs: true}, function (err, response){
                if (!err){
                    self.set("showBuild", null);
                    self.set("content", _(response.rows || []).pluck('doc'));
                }
                else {
                    //TODO: error handling
                }
            });
        }
    }
});

Gametheory.BuildsetListView = Ember.View.extend({
      templateName: 'buildset-list'
    , buildsetsBinding: "Gametheory.buildsetsController.orderedContent"
});

Gametheory.BuildsetView = Ember.View.extend({
      templateName: 'buildset'
    , showBuildBinding: "Gametheory.buildsetsController.showBuild"
});