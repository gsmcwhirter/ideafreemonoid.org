var fs = require("fs")
  , cleancss = require("clean-css")
  , stylus = require("stylus")
  ;

namespace("css", function (){
    desc("Default way to create production css.");
    task("make", function (){
        jake.Task["css:couchapp/css/layout.css"].invoke();
        jake.Task["css:couchapp/attachments/ifm-min.css"].invoke();
    });

    desc("Creates the production css.");
    file("couchapp/attachments/ifm-min.css", ["css:couchapp/css/layout-min.css"], function (){
        console.log("Concatenating minified css files...");
        var reset = fs.readFileSync("couchapp/css/reset-min.css");
        var base = fs.readFileSync("couchapp/css/base-min.css");
        var fonts = fs.readFileSync("couchapp/css/fonts-min.css");
        var layout = fs.readFileSync("couchapp/css/layout-min.css");

        fs.writeFileSync("couchapp/attachments/ifm-min.css", reset + base + fonts + layout);
    });

    desc("Minifies the layout.css");
    file("couchapp/css/layout-min.css", ["css:couchapp/css/layout.css"], function (){
        console.log("Minifiying layout.css...");
        var source = fs.readFileSync("couchapp/css/layout.css");

        fs.writeFileSync("couchapp/css/layout-min.css", cleancss.process(source));
    });

    desc("Generates the layout.css file from stylus");
    file("couchapp/css/layout.css", function (){
        console.log("Generating layout.css from stylus.");

        var source = fs.readFileSync("couchapp/css/layout.styl");

        stylus.render(source, {filename: 'couchapp/css/layout.styl'}, function (err, css){
            if (err) throw err;

            fs.writeFileSync("couchapp/css/layout.css", css);

            complete();
        });
    }, {async: true});
});

namespace("notifier", function (){
    desc("Starts the notifier backend.");
    task("start", function (){

    });

    desc("Stops the notifier backend.");
    task("stop", function (){

    });

    desc("Gives a status update for the notifier backend.");
    task("status", function (){

    });

    desc("Restarts the notifier backend.");
    task("restart", ["notifier:stop", "notifier:start", "notifier:status"], function (){
        console.log("done.")
    });
});

namespace("worker", function (){
    desc("Starts the worker backend.");
    task("start", function (){

    });

    desc("Stops the worker backend.");
    task("stop", function (){

    });

    desc("Gives a status update for the worker backend.");
    task("status", function (){

    });

    desc("Restarts the worker backend.");
    task("restart", ["worker:stop", "worker:start", "worker:status"], function (){
        console.log("done.");
    });
});
