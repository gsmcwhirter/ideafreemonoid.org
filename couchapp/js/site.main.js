function zeroPad(str, length){
    length = length || 2;

    if (str){
        str = "" + str;
    }
    else {
        str = "";
    }

    if (str.length >= length){
        return str;
    }
    else {
        while (str.length < length){
            str = "0" + str;
        }

        return str;
    }
}

function dateISOString(date){
    if (typeof date.toISOString === "function"){
        return date.toISOString();
    }
    else {
        return  zeroPad(date.getUTCFullYear(), 4) + "-"
                + zeroPad(date.getUTCMonth() + 1, 2) + "-"
                + zeroPad(date.getUTCDate(), 2) + "T"
                + zeroPad(date.getUTCHours(), 2) + ":"
                + zeroPad(date.getUTCMinutes(), 2) + ":"
                + zeroPad(date.getUTCSeconds(), 2) + "."
                + zeroPad(date.getUTCMilliseconds(), 3) + "Z";
    }
}

var SDConverter = new Showdown.converter();

var App = Ember.Application.create({
    rootElement: $("#home")
});

App.Router = {
    index: function (){
        App.hideAll();
        this.get("rootElement").show();
        App.setTitle("Home");
        _gaq.push(["_trackPageview", "#"]);
    }
};

App.defaultPageTitle = "" + document.title;

App.hideAll = function (){
    App.get("rootElement").hide();
    Blog.get("rootElement").hide();
    CV.get("rootElement").hide();
    Gametheory.get("rootElement").hide();
    Portfolio.get("rootElement").hide();

    this.setTitle("");
};

App.setTitle = function (title){
    $("span#pagetitle").text(title);
    if (title){
        document.title = title + " - " + this.defaultPageTitle;
    }
    else {
        document.title = this.defaultPageTitle;
    }
};
