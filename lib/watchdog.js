var exec = require('child_process').exec;

/*
 * Check that only one process of omxplayer is running
 * Fixes problems with omxplayer not exiting.
 */
var onlyOneProcess = function () {
  exec('ps xa | grep "[o]mxplayer.bin" | wc -l', function (error, stdout, stderr) {
    var processCount = parseInt(stdout);
    if (processCount > 1) {
      exec('killall -9 omxplayer.bin');
    }
  });
};

module.exports.onlyOneProcess = onlyOneProcess;