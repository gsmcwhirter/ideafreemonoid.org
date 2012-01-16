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
    , last_build: {}
    , origin: null
    , status: null
    , license: null
    , classifiers: []
    , description: null
    , type: "buildset"
    , _id: null
    , _rev: null

    , lastSuccessfulBuild: function (){
        var builds = this.get("builds");
        var ct = builds.length;

        for (var i = ct-1; i >=0; i--){
            if (builds[i] && builds[i].status === "ok"){
                return {
                      build: builds[i].build
                    , version: builds[i].version
                    , build_report: builds[i]
                };
            }
        }

        return {
            build: 0
        };
    }.property("builds").cacheable()

    , lastSuccessfulBuildDate: function (){
        var lsb = this.get("lastSuccessfulBuild");

        if (lsb.build > 0){
            return (new Date(lsb.build_report.date)).toLocaleString();
        }
        else {
            return "never";
        }
    }.property("lastSuccessfulBuild").cacheable()

    , hasSuccessfulBuild: function (){
        return this.get("lastSuccessfulBuild").build > 0;
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
        var lsb = this.get("lastSuccessfulBuild") || {};
        return this.get("permalink") + "/v" + lsb.version + "b" + lsb.build;
    }.property("permalink", "lastSuccessfulBuild").cacheable()

    , allFormattedBuilds: function (){
        var builds = (this.get("builds") || []).slice();

        return _(builds).map(function (build){
            build.version = build.version === "unknown" ? null : build.version;
            build.build = build.build === "unknown" ? null : build.build;
            build.date = (new Date(build.date)).toLocaleString();
            build.successful = (build.status === "ok");
            build.downloadLink = "/files/" + build.download_dir + "/" + build.download_file;
            return build;
        }).reverse();
    }.property("builds").cacheable()

    , shortFormattedBuilds: function (){
        var b = this.get("allFormattedBuilds");

        return b.slice(0,5);
    }.property("allFormattedBuilds").cacheable()

    , formattedDescription: function (){
        return SDConverter.makeHtml(this.get("description") || "\n");
    }.property("description").cacheable()

    , formattedLicense: function (){
        var lstring = this.get("license");

        if (lstring){
            return "<a href='http://http://www.opensource.org/licenses/" + lstring + "'>" + lstring + "</a>";
        }
        else {
            return "closed source, all rights reserved";
        }
    }.property("license").cacheable()

    , hasClassifiers: function (){
        var c = this.get("classifiers");
        if (c && c.length > 0){
            return true;
        }
        else {
            return false;
        }
    }.property("classifiers").cacheable()
});

Gametheory.buildsetsController = Ember.ArrayController.create({
      content: []
    , showBuild: null
    , onlyOneBuildset: false

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
                    self.set("onlyOneBuildset", true);
                    self.set("showBuild", build || null);
                    self.set("content", [Gametheory.Buildset.create(response)]);
                }
                else {
                    //TODO: error handling
                }
            });
        }
        else {
            IFMAPI.getView("buildsets", {include_docs: true}, function (err, response){
                if (!err){
                    self.set("onlyOneBuildset", false);
                    self.set("showBuild", null);
                    self.set("content", _(response.rows || []).chain().pluck('doc').map(function (doc){return Gametheory.Buildset.create(doc);}).value());
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
    , tagName: 'li'
    , showBuildBinding: "Gametheory.buildsetsController.showBuild"
    , onlyOneBuildsetBinding: "Gametheory.buildsetsController.onlyOneBuildset"

    , didInsertElement: function (){
        this._super();

        if (this.get("onlyOneBuildset") && this.get("showBuild")){
            var sb = this.get("showBuild");
            var matches = /v([^b]+)b(.+)/i.exec(sb);
            if (matches){
                var matchto = "v" + matches[1] + " build " + matches[2];
                this.$("ol.builds li dd.build-string").each(function(i, o){
                    console.log($(o).text());
                    console.log(matchto);
                    if ($(o).text() === matchto){
                        var target = $(o).parents("li:first").position().top || 0;
                        console.log("Scrolling to " + target);
                        $(window).scrollTo(target);
                        return;
                    }
                });
            }
        }
    }
});

Gametheory.BuildView = Ember.View.extend({
      templateName: 'build'
    , tagName: 'li'
});

Gametheory.ClassifierView = Ember.View.extend({
      templateName: 'classifier'
    , tagName: 'li'
});