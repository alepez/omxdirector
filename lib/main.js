var spawn = require('child_process').spawn;
var util = require('util');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var omxdirector = function() {

  var that = Object.create(EventEmitter.prototype);

  var nativeLoop = false;

  var videoDir = './';
  var videoSuffix = '';

  var currentVideos = [];
  var currentSettings = {};

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

  var resolveFilePaths = function(videos) {
    /* reset currentFiles, it will contain only valid videos */
    currentVideos = [];
    var ret = [];
    videos.forEach(function(video) {
      var realPath = path.resolve(videoDir, video + videoSuffix);
      if (fs.existsSync(realPath)) {
        ret.push(realPath);
        currentVideos.push(video);
      } else {
        that.emit('error', 'File does not exist: ' + realPath);
      }
    });
    return ret;
  };

  var open = function(videos, options) {
    var settings = options || {};
    currentSettings = settings;
    var cmd = 'omxplayer';
    var args = [];
    if (settings.audioOutput && settings.audioOutput !== 'default') {
      args.push('-o');
      args.push(settings.audioOutput);
    }
    if (settings.loop === true) {
      if (nativeLoop) {
        args.push('-L');
      } else {
        throw new Error('Native loop is not enabled');
      }
    }
    if (typeof videos === 'string') {
      videos = [ videos ];
    }
    if (videos.length > 1 && !nativeLoop) {
      throw new Error('Multiple files is not supported if native loop is disabled');
    }
    var realfiles = resolveFilePaths(videos);
    args.push.apply(args, realfiles);
    omxProcess = spawn(cmd, args, {
      stdio : [ 'pipe', null, null ]
    });
    omxProcess.on('exit', function(code, signal) {
      omxProcess = null;
      that.emit('stop');
    });
    that.emit('load', videos, options);
  };

  var play = function(videos, options) {
    if (omxProcess) {
      if (!paused) {
        return false;
      }
      sendAction('pause');
      paused = false;
      that.emit('play');
      return true;
    }
    if (!videos) {
      throw new TypeError("No files specified");
    }
    if (typeof videos !== 'string' && !util.isArray(videos)) {
      throw new TypeError("Incorrect value for videos: " + videos);
    }
    open(videos, options);
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

  var handleQuitTimeout = function(oldOmxProcess, timeout) {
    var timeoutHandle = setTimeout(function() {
      console.log('omxplayer still running. kill forced');
      oldOmxProcess.kill('SIGTERM');
    }, timeout);
    oldOmxProcess.on('exit', function() {
      clearTimeout(timeoutHandle);
    });
  };

  var stop = function() {
    if (!omxProcess) {
      return false;
    }
    sendAction('quit');
    handleQuitTimeout(omxProcess, 250);
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
        videos : currentVideos,
        settings : currentSettings,
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

  var enableNativeLoop = function() {
    nativeLoop = true;
    return that;
  };

  that.play = play;
  that.pause = pause;
  that.stop = stop;
  that.isPlaying = isPlaying;
  that.isLoaded = isLoaded;
  that.getStatus = getStatus;
  that.setVideoDir = setVideoDir;
  that.setVideoSuffix = setVideoSuffix;
  that.enableNativeLoop = enableNativeLoop;

  return that;
};

module.exports = omxdirector();
