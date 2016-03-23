var Portfolio = Ember.Application.create({
    rootElement: $("#portfolio")
});

Portfolio.Router = {
    index: function (){
        App.hideAll();
        this.get("rootElement").show();
        App.setTitle("Portfolio");
        _gaq.push(["_trackPageview", "#!portfolio"]);
    }
};
