var spawn = require("child_process").spawn
    ;

function _gitExec(args, ignoreExitCode, callback){
    if (typeof ignoreExitCode === "function"){
        callback = ignoreExitCode;
        ignoreExitCode = false;
    }

    var stdout = [],
        stderr = [],
        proc = spawn("git", args);

        proc.stdout.setEncoding('utf8');
        proc.stderr.setEncoding('utf8');

        proc.stdout.on('data', function (data){
            stdout.push(data);
        });

        proc.stderr.on('data', function (data){
            stderr.push(data);
        });

        proc.on('exit', function (code){
            callback(ignoreExitCode ? 0 : code, stdout, stderr);
        });
}

var Repo = function (options){
    if (typeof options === "string"){
        options = {path: options};
    }

    options.remotes = options.remotes || {};

    if (options.origin){
        options.remotes.origin = options.origin;
        delete options.origin;
    }

    for (var i in options){
        this[i] = options[i];
    }

    this._existCheck = false;
    this._exists = false;

};

Repo.prototype._git = function (args, options, callback){
    if (typeof options === "function"){
        callback = options;
        options = {};
    }

    var ignoreExistsCheck = options.ignoreExistsCheck;
    var ignoreExitCode = options.ignoreExitCode;
    var ignorePathArgs = options.ignorePathArgs;

    delete options.ignoreExistsCheck;

    if (!this._existCheck && !ignoreExistsCheck){
        var self = this;
        this.checkExists(function (err){
            if (!err){
                self._git(args, options, callback);
            }
        });
    }

    if ((this._exists || ignoreExistsCheck) && this.path){
        args = (ignorePathArgs ? [] : ["--git-dir=" + this.path + "/.git", "--work-tree=" + this.path]).concat(args);
        _gitExec(args, ignoreExitCode, callback);
    }
    else {
        callback(-1);
    }
};

Repo.prototype.checkExists = function (attemptClone, callback){
    if (typeof attemptClone === "function"){
        callback = attemptClone;
        attemptClone = false;
    }
    else if (attemptClone === true){
        attemptClone = "origin";
    }

    if (this.path){
        var self = this;
        this.status(function (err){
            self._existCheck = true;

            if (!err){
                self._exists = true;
                callback();
            }
            else if (attemptClone){
                self.clone(attemptClone, function (err) {
                    if (!err){
                        self._exists = true;
                        callback();
                    }
                    else {
                        self._exists = false;
                        callback(err);
                    }
                });
            }
        });
    }
    else {
        this._existCheck = true;
        this._exists = false;
        callback("no such repository");
    }
};

Repo.prototype.addRemote = function (name, remote, args, callback){
    if (typeof args === "function"){
        callback = args;
        args = [];
    }

    args = args || [];
    callback = callback || function (){};

    if (typeof name === "string" && typeof remote === "string"){
        var self = this;
        this._git(["remote", "add"].concat(args).concat([name, remote]), function (code, stdout, stderr){
            if (code === 0){
                self.remotes[name] = remote;
                callback();
            }
            else {
                callback(code || true, stderr.join("\n"));
            }
        });
    }
    else {
        callback("missing name or remote");
    }
};

Repo.prototype.clone = function (source, target, args, callback){
    if (typeof target === "function"){
        callback = target;
        target = this.path || "";
        args = [];
    }
    else if (typeof args === "function"){
        callback = args;
        args = [];
    }
    else {
        args = args || [];
        callback = callback || function (){};
    }

    if (this.remotes[source]){
        this._git(["clone"].concat(args).concat([this.remotes[source], target]), {ignorePathArgs: true, ignoreExistsCheck: true}, function (code, stdout, stderr){
            if (code === 0){
                callback();
            }
            else {
                callback(code || true, stderr.join("\n"));
            }
        });
    }
    else {
        callback("unknown source");
    }
};

Repo.prototype.status = function (args, callback){
    if (typeof args === "function"){
        callback = args;
        args = [];
    }
    else {
        args = args || [];
        callback = callback || function (){};
    }

    this._git(["status"].concat(args), {ignoreExistsCheck: true}, function (code, stdout, stderr){
        if (code === 0 || code === 1){
            callback(null, stdout.join("\n"));
        }
        else {
            callback(code || true, stderr.join("\n"));
        }
    });
};

Repo.prototype.checkout = function (branch, opts, args, callback){
    if (typeof opts === "function"){
        callback = opts;
        opts = {};
        args = [];
    }
    else if (typeof args === "function"){
        callback = args;
        args = [];
    }
    else {
        args = args || [];
        callback = callback || function (){};
    }

    var first = function (cb){cb();}
    var self = this;

    if (opts.notBackwards && opts.last_head){
        var last_head;

        if (typeof opts.last_head === "function"){
            last_head = opts.last_head();
        }
        else {
            last_head = opts.last_head;
        }

        first = function (cb){
            self.revlist([last_head + ".." + branch], function (code, stdout, stderr){
                if (code === 0 && stdout.length > 0){
                    cb();
                }
                else if (code === 0){
                    cb("backwards");
                }
                else {
                    cb(stderr.join("\n"));
                }
            });
        };
    }

    first(function (err){
        if (!err){
            self._git(["checkout"].concat(args).concat(branch), function (code, stdout, stderr){
                if (code === 0){
                    callback();
                }
                else {
                    callback(code || true, stderr.join("\n"));
                }
            });
        }
    });
};

Repo.prototype.pull = function (args, callback){
    if (typeof args === "function"){
        callback = args;
        args = [];
    }
    else {
        args = args || [];
        callback = callback || function (){};
    }

    this._git(["pull"].concat(args), function (code, stdout, stderr){
        if (code === 0){
            callback(null, stdout.join("\n"));
        }
        else {
            callback(code || true, stderr.join("\n"));
        }
    });
};

Repo.prototype.revlist = function (args, callback){
    args = args || [];
    callback = callback || function (){};

    this._git(["rev-list"].concat(args), function (code, stdout, stderr){
        if (code === 0){
            callback(null, stdout.join("\n"));
        }
        else {
            callback(code || true, stderr.join("\n"));
        }
    });
};

Repo.prototype.revparse = function (args, callback){
    if (typeof args === "function"){
        callback = args;
        args = [];
    }
    else {
        args = args || [];
        callback = callback || function (){};
    }

    this._git(["rev-parse"].concat(args), function (code, stdout, stderr){
        if (code === 0){
            callback(null, stdout.join("\n"));
        }
        else {
            callback(code || true, stderr.join("\n"));
        }
    });
};

Repo.prototype.reset = function (args, callback){
    if (typeof args === "function"){
        callback = args;
        args = [];
    }
    else {
        args = args || [];
        callback = callback || function (){};
    }

    this._git(["reset"].concat(args), function (code, stdout, stderr){
        if (code === 0){
            callback();
        }
        else {
            callback(code || true, stderr.join("\n"));
        }
    });
};

exports.Repo = Repo;