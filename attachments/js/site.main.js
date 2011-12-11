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

App.hideAll = function (){
    Blog.get("rootElement").hide();
    CV.get("rootElement").hide();
    Gametheory.get("rootElement").hide();
};

SC.routes.add('', Blog, Blog.Router.index);
SC.routes.add('cv', CV, CV.Router.index);
SC.routes.add('gametheory', Gametheory, Gametheory.Router.index);
//SC.routes.ping();
