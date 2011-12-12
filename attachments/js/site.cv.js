window.CV = SC.Application.create({
    rootElement: $("#cv")
});

CV.Router = {
    index: function (params){
        App.hideAll();
        this.get("rootElement").show();
        App.setTitle("CV");
    }
}

CV.Section = SC.Object.extend({
      type: "cv-section"
    , title: null
    , content_raw: null
    , order: 1
    , created_at: null
    , last_updated: null
    , _id: null
    , _rev: null
});

CV.sectionsController = SC.ArrayProxy.create({
    content: []

    , createSection: function (title, content, order){
        var now = dateISOString(new Date());

        var section = {
              type: "cv-section"
            , title: title
            , content_raw: content || "\n"
            , order: order || ((_(this.get("content")).chain().map(function (doc){return doc.get('order')}).max().value() || 0) + 1)
            , created_at: now
            , last_updated: now
        };

        console.log(section);

        var self = this;

        IFMAPI.getUUIDs(function (err, response){
            if (err){
                //TODO: error handling
                console.log(response);
            }

            if (response && response.uuids){
                section._id = response.uuids[0];

                IFMAPI.putDoc(section._id, section, function (err, response){
                    if (err){
                        //TODO: error handling
                        console.log(response);
                    }

                    console.log(response);

                    if (response && response.ok){
                        section._rev = response.rev;

                        self.pushObject(CV.Section.create(section));
                        self.resort();
                    }
                });
            }
        });

    }
    , resort: function (){
        this.set('content', _(this.get('content')).sortBy(function (section){return section.get('order');}));
    }
});

IFMAPI.getView("cvsections", {include_docs: true}, function (err, response){
    if (err){
        //TODO: error handling
        console.log(response);
    }

    if (response && response.rows){
        CV.sectionsController.set('content', _(response.rows).chain().pluck('doc').map(function (doc){return CV.Section.create(doc);}).value());
    }
});