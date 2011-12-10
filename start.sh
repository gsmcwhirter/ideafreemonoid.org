notifier(){
    echo "NoHup'ing notifier...";
    NODE_ENV=production nohup node buildnotifier.js > nohup_bnotifier.out &
}

worker(){
    echo "NoHup'ing working...";
    NODE_ENV=production nohup node buildworker.js > nohup_bworker.out &
}

#NODE_ENV=production nohup node changes/lib/main.js > nohup_changes.out &

if [ -z $1 ]
then
    echo "You must provide the name of a service.";
else
    echo "Starting $1.";
    $1
fi
