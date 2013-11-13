var spawn = require('child_process').spawn;
var util = require('util');

var commands = {
  'pause' : 'p',
  'quit' : 'q'
};

var omxProcess = null;
var paused = false;

var sendAction = function(action) {
  if (commands[action] && omxProcess) {
    omxProcess.stdin.write(commands[action]);
  }
};

var open = function(files, options) {
  var settings = options || {};
  var cmd = 'omxplayer';
  var args = [ '-o', 'local' ];
  if (settings.loop === true) {
    args.push('-L');
  }
  if (typeof files === 'string') {
    args.push(files);
  } else if (util.isArray(files)) {
    args.push.apply(args, files);
  } else {
    /* ignora */
  }
  omxProcess = spawn(cmd, args, {
    stdio : [ 'pipe', null, null ]
  });
};

var play = function(files, options) {
  if (omxProcess) {
    if (!paused) {
      return false;
    }
    sendAction('pause');
    paused = false;
    return true;
  }
  if (!files) {
    throw new TypeError("No files specified");
  }
  if (typeof files != 'string' && !util.isArray(files)) {
    throw new TypeError("Incorrect value for files: " + files);
  }
  open(files, options);
  return true;
};

var pause = function() {
  if (paused) {
    return false;
  }
  sendAction('pause');
  paused = true;
  return true;
};

var stop = function() {
  if (!omxProcess) {
    return false;
  }
  sendAction('quit');
  omxProcess = null;
  return true;
};

var isPlaying = function() {
  return omxProcess && !paused;
};

var isLoaded = function() {
  return omxProcess;
};

module.exports = {
  play : play,
  pause : pause,
  stop : stop,
  isPlaying : isPlaying,
  isLoaded : isLoaded
};
