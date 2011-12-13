window.CV = Ember.Application.create({
    rootElement: $("#cv")
});

CV.Router = {
    index: function (){
        App.hideAll();
        CV.sectionsController.reloadData();
        this.get("rootElement").show();
        App.setTitle("CV");
        _gaq.push(["_trackPageview", "#!/cv"]);
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
    }.property("type","title","content_raw","order","created_at","last_updated","_id","_rev")
    , save: function (callback){
        if (User.userController.isConnected()){
            var self = this;

            if (!this.get("_id")){
                var first = function (second){
                    IFMAPI.getUUIDs(function (err, response){
                        if (err){
                            callback(err, response);
                        }
                        else if (response && response.uuids){
                            self.set("_id", response.uuids[0]);
                            second();
                        }
                        else {
                            callback(true, response)
                        }
                    });
                }
            }
            else {
                first = function (second){
                    second();
                }
            }

            first(function (){
                IFMAPI.putDoc(this.get("_id"), this.get("_doc"), function (err, response){
                    if (err){
                        callback(err, response);
                    }
                    else if (response && response.ok){
                        self.set("_rev", response.rev);

                        CV.sectionsController.resort();

                        callback(false, self);
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
});

CV.sectionsController = Ember.ArrayController.create({
      content: []

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
                  type: "cv-section"
                , title: title
                , content_raw: content || "\n"
                , order: order || ((_(this.get("content")).chain().map(function (doc){return doc.get('order')}).max().value() || 0) + 1)
                , created_at: now
                , last_updated: now
                , isEditing: true
            };

            this.pushObject(CV.Section.create(section));
            this.resort();

            callback(false, section);
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
    , submit: function (){
        this.get("content").set("isEditing", false);

        if (User.userController.isConnected()){
            this.get("content").set("last_updated", dateISOString(new Date()));
        }
        else {
            console.log("Not Connected!");
        }

        console.log(this.get("content").get("title"));

        return false;
    }
});
