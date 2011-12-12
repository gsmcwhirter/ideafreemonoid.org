window.Gametheory = SC.Application.create({
    rootElement: $("#gametheory")
});

Gametheory.Router = {
    index: function (){
        App.hideAll();
        this.get("rootElement").show();
        App.setTitle("Game Theory");
    }
};