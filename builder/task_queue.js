var TaskQueue = function (tasks, action){
    this._tasks = tasks;
    this._action = action;
};

TaskQueue.prototype.execute = function (callback){
    var self = this;

    //console.log("Task queue length: %s", this._tasks.length);

    var task = this._tasks.shift();

    if (task){
        console.log("Executing task...");
        this._action.call(this, task, function (err){
            if (err){
                callback(err, task);
            }
            else {
                self.execute(callback);
            }
        });

    }
    else {
        //console.log("Callback time...");
        callback();
    }
};

function task_queue(tasks, action, callback){
    var tqueue = new TaskQueue(tasks, action);

    tqueue.execute(callback);
}

exports.task_queue = task_queue;
exports.TaskQueue = TaskQueue;