window.Gametheory = SC.Application.create({
    rootElement: $("#gametheory")
});

Gametheory.Router = {
    index: function (params){
        App.hideAll();
        this.get("rootElement").show();
    }
}