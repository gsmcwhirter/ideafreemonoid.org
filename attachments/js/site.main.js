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
                + zeroPad(date.getUTCSeconds(), 2) + "Z";
    }
}

window.SDConverter = new Showdown.converter();

window.App = SC.Application.create({
    rootElement: $("h1#title")
});

App.defaultPageTitle = "" + document.title;

App.hideAll = function (){
    Blog.get("rootElement").hide();
    CV.get("rootElement").hide();
    Gametheory.get("rootElement").hide();

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

SC.Handlebars.registerHelper("formatDate", function (property){
    var val = SC.getPath(this, property);
    if (val){
        var date = new Date(val);
        return date.toLocaleString();
    }
    else {
        return "";
    }
});

SC.Handlebars.registerHelper("parseMarkdown", function (property){
    var val = SC.getPath(this, property);
    return SDConverter.makeHtml(val || "\n");
});
