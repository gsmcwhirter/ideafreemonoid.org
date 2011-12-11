window.CV = SC.Application.create({
    rootElement: $("#cv")
});

CV.Router = {
    index: function (params){
        App.hideAll();
        this.get("rootElement").show();
    }
}

CV.Section = SC.Object.extend({
      type: "cv-section"
    , title: null
    , content_raw: null
    ,
});