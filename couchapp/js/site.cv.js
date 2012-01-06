var CV = Ember.Application.create({
    rootElement: $("#cv")
});

CV.Router = {
    index: function (){
        App.hideAll();
        CV.sectionsController.reloadData();
        this.get("rootElement").show();
        App.setTitle("CV");
        _gaq.push(["_trackPageview", "#!cv"]);
    }
};

CV.Section = Ember.Object.extend({
      type: "cv-section"
    , title: null
    , content_raw: null
    , order: 1
    , created_at: null
    , last_updated: null
    , _id: null
    , _rev: null
    , isEditing: false

    , _doc: function (){
        return this.getProperties("type","title","content_raw","order","created_at","last_updated","_id","_rev");
    }.property("type","title","content_raw","order","created_at","last_updated","_id","_rev").cacheable()

    , formattedDate: function (){
        var val = this.get("last_updated");
        if (val) return (new Date(val)).toLocaleString();
        else return "";
    }.property("last_updated").cacheable()

    , formattedContent: function (){
        return SDConverter.makeHtml(this.get("content_raw") || "\n");
    }.property("content_raw").cacheable()
});

CV.sectionsController = Ember.ArrayController.create({
      content: []

    , contentSorted: function (){
        return _(this.get("content")).sortBy(function (section){
            return section.get("order") || 0;
        });
    }.property("content").cacheable()

    , createSection: function (title, content, order, callback){
        if (typeof title === "function"){
            callback = title;
            title = null;
            content = null;
            order = null;
        }
        else if (typeof content === "function"){
            callback = content;
            content = null;
            order = null;
        }
        else if (typeof order === "function"){
            callback = order;
            order = null;
        }

        if (typeof callback !== "function"){
            callback = function (){};
        }

        if (User.userController.isConnected()){

            var now = dateISOString(new Date());

            var section = {
                  title: title
                , content_raw: content || "\n"
                , order: order || ((_(this.get("content")).chain().map(function (doc){return doc.get('order')}).max().value() || 0) + 1)
                , created_at: now
                , last_updated: now
                , isEditing: true
            };

            section = CV.Section.create(section);
            this.pushObject(section);
            this.resort();

            callback(false, section);
        }
        else {
            callback({error: "not connected"}, User.userController.get("currentUser"));
        }
    }
    , reloadData: function (callback){
        if (typeof callback !== "function"){
            callback = function (){};
        }

        var self = this;
        IFMAPI.getView("cvsections", {include_docs: true}, function (err, response){
            if (err){
                callback(err, response);
            }

            else if (response && response.rows){
                self.set('content', _(response.rows).chain().pluck('doc').map(function (doc){return CV.Section.create(doc);}).value());
                self.resort();
                callback(false, response);
            }

            else {
                callback(true, response);
            }
        });
    }
    , resort: function (){
        this.set('content', _(this.get('content')).sortBy(function (section){return section.get('order');}));
    }

    , saveSection: function (section, callback){
        if (typeof callback !== "function") callback = function (){};

        if (User.userController.isConnected()){

            section.set("last_updated", dateISOString(new Date()));

            var first;
            if (!section.get("_id")){
                console.log("Saving new...");
                first = function (second){
                    IFMAPI.getUUIDs(function (err, response){
                        if (err){
                            callback(err, response);
                        }
                        else if (response && response.uuids){
                            section.set("_id", response.uuids[0]);
                            second();
                        }
                        else {
                            callback(true, response);
                        }
                    });
                };
            }
            else {
                console.log("Saving existing...");
                first = function (second){
                    second();
                };
            }

            first(function (){
                var doc = section.get("_doc");

                if (!doc._rev){
                    delete doc._rev;
                }

                IFMAPI.putDoc(section.get("_id"), doc, function (err, response){
                    if (err){
                        callback(err, response);
                    }
                    else if (response && response.ok){
                        section.set("_rev", response.rev);

                        callback(false, section);
                    }
                    else {
                        callback(true, response);
                    }
                });
            });
        }
        else {
            callback({error: "not connected"}, User.userController.get("currentUser"));
        }
    }

    , sectionForm: function (content, callback){
        if (typeof callback !== "function") callback = function (){};

        if (User.userController.isConnected()){
            var cview = CV.CreateView.create();
            cview.set("content", content);
            cview.appendTo(CV.rootElement);
            callback(false, cview);
        }
        else {
            callback({error: "not connected"}, User.userController.get("currentUser"));
        }
    }
});

CV.CVView = Ember.View.extend({
        templateName: "cv"
});

CV.AddSectionLink = Ember.View.extend({
      templateName: "cv-add-section-link"
    , currentUserBinding: "User.userController.currentUser"
    , click: function (event){
        event.preventDefault();
        CV.sectionsController.createSection(function (err, result){
            if (err){
                //TODO: error handling
            }
        });
        return false;
    }
});

CV.SectionView = Ember.View.extend({
      templateName: "cv-section"
    , doubleClick: function (){
        if (User.userController.isConnected()){
            this.get("content").set("isEditing", true);
        }
        return false;
    }
});

CV.SectionDisplayView = Ember.View.extend({
      templateName: "cv-section-display"
});

CV.EditFormView = Ember.View.extend({
      templateName: "cv-section-form"
    , saveButton: Ember.Button.extend({
          target: null
        , action: null
        , click: function (event){
            event.preventDefault();

            this.get("content").set("isEditing", false);

            if (User.userController.isConnected()){
                CV.sectionsController.saveSection(this.get("content"), function (err, resp){
                    if (err){
                        //TODO: error handling
                        console.log(err);
                        console.log(resp);
                    }
                });
            }
            else {
                console.log("Not Connected!");
            }

            console.log(this.get("content").get("title"));

            return false;
        }
    })
});
