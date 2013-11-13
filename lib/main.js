var spawn = require('child_process').spawn;
var util = require('util');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var omxdirector = function() {

  var that = Object.create(EventEmitter.prototype);

  var videoDir = './';
  var videoSuffix = '';

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

  var resolveFilePaths = function(files) {
    var ret = [];
    files.forEach(function(file) {
      file += videoSuffix;
      var realPath = path.resolve(videoDir, file);
      if (fs.existsSync(realPath)) {
        ret.push(realPath);
      } else {
        that.emit('error', 'File does not exist: ' + realPath);
      }
    });
    return ret;
  };

  var open = function(files, options) {
    var settings = options || {};
    var cmd = 'omxplayer';
    var args = [ '-o', 'local' ];
    if (settings.loop === true) {
      args.push('-L');
    }
    if (typeof files === 'string') {
      files = [ files ];
    }
    if (!util.isArray(files)) {
      // TODO: exception
    }
    var realfiles = resolveFilePaths(files);
    args.push.apply(args, realfiles);
    omxProcess = spawn(cmd, args, {
      stdio : [ 'pipe', null, null ]
    });
    omxProcess.on('exit', function(code, signal) {
      omxProcess = null;
      that.emit('stop');
    });
    that.emit('load', files, options);
  };

  var play = function(files, options) {
    if (omxProcess) {
      if (!paused) {
        return false;
      }
      sendAction('pause');
      paused = false;
      that.emit('play');
      return true;
    }
    if (!files) {
      throw new TypeError("No files specified");
    }
    if (typeof files != 'string' && !util.isArray(files)) {
      throw new TypeError("Incorrect value for files: " + files);
    }
    open(files, options);
    that.emit('play');
    return true;
  };

  var pause = function() {
    if (paused) {
      return false;
    }
    sendAction('pause');
    paused = true;
    that.emit('pause');
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

  var getStatus = function() {
    if (isLoaded()) {
      return {
        files : files,
        options : options,
        playing : isPlaying(),
        loaded : true
      };
    }
    return {
      loaded : false
    };
  };

  var setVideoDir = function(dir) {
    videoDir = dir;
  };
  
  var setVideoSuffix = function(suffix) {
    videoSuffix = suffix;
  };

  that.play = play;
  that.pause = pause;
  that.stop = stop;
  that.isPlaying = isPlaying;
  that.isLoaded = isLoaded;
  that.getStatus = getStatus;
  that.setVideoDir = setVideoDir;
  that.setVideoSuffix = setVideoSuffix;

  return that;
};

module.exports = omxdirector();
