var spawn = require('child_process').spawn;
var util = require('util');
var path = require('path');
var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var LoopHelper = require('./loop_helper.js').LoopHelper;
var exec = require('child_process').exec;
var onlyOneProcess = require('./watchdog.js').onlyOneProcess;

/* keep compatibility with older versions of nodejs */
if (fs.existsSync) {
  path.existsSync = fs.existsSync;
} else {
  fs.existsSync = path.existsSync;
}

var omxdirector = function () {

  var that = Object.create(EventEmitter.prototype);

  var nativeLoop = false;
  var handleExitHang = false;

  var videoDir = './';
  var videoSuffix = '';

  var currentVideos = [];
  var currentSettings = {};

  var loopHelper = null;

  var commands = {
    'pause': 'p',
    'quit': 'q',
    'volup': '+',
    'voldown': '-'
  };

  var omxProcess = null;
  var paused = false;

  var sendAction = function (action) {
    if (commands[action] && omxProcess) {
      try {
        omxProcess.stdin.write(commands[action], function (err) {
          console.log(err);
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  var resolveFilePaths = function (videos) {
    /* reset currentFiles, it will contain only valid videos */
    currentVideos = [];
    var ret = [];
    videos.forEach(function (video) {
      var realPath = path.resolve(videoDir, video + videoSuffix);
      if (fs.existsSync(realPath)) {
        ret.push(realPath);
        currentVideos.push(video);
      } else {
        that.emit('error', new Error('File does not exist: ' + realPath));
      }
    });
    return ret;
  };

  /*
   * Get video length and check, after its duration, if
   * process is hanging. Correct a bug of omxplayer
   * https://github.com/popcornmix/omxplayer/issues/124
   * https://github.com/popcornmix/omxplayer/issues/12
   */
  var startWatchdog = function (filename, pid) {
    if (!handleExitHang) {
      return;
    }
    getVideoLength(filename, function (durationMs) {
      setTimeout(function () {
        if (pid === omxProcess.pid) {
          omxProcess.kill('SIGKILL');
        }
      }, durationMs + 10000);
    });
  };

  var open = function (videos, options) {
    var settings = options || {};
    currentSettings = settings;
    var cmd = 'omxplayer';

    var respawn = null;

    var args = [];
    if (settings.audioOutput && settings.audioOutput !== 'default') {
      args.push('-o');
      args.push(settings.audioOutput);
    }

    if (settings.loop === true) {
      if (nativeLoop) {
        args.push('--loop');
      }
    }

    if (typeof videos === 'string') {
      videos = [videos];
    }

    var realfiles = resolveFilePaths(videos);

    if (nativeLoop) {
      /* all files to omxplayer parameters */
      args.push.apply(args, realfiles);
    } else {
      /*
       * only first file to omxplayer parameter. following files are handled by
       * loopHelper
       */
      args.push(realfiles[0]);
    }

    if (!nativeLoop && ((realfiles.length > 1) || (settings.loop))) {
      /* no native loop support, enable helper */
      loopHelper = LoopHelper(realfiles, settings.loop);

      respawn = function () {
        if (!loopHelper) {
          /* respawn ignored, stop requested */
          that.emit('stop');
          return;
        }
        /* change file */
        var nextFile = loopHelper.getNext();
        if (!nextFile) {
          /* respawn ignored, loop ended */
          loopHelper = null;
          that.emit('stop');
        } else {
          /* respawn */
          args[args.length - 1] = nextFile;
          omxProcess = spawn(cmd, args, {
            stdio: ['pipe', null, null]
          });
          omxProcess.once('exit', respawn);
          /* check if omxplayer hangs when video should be finished */
          startWatchdog(nextFile, omxProcess.pid);
        }
      };
      omxProcess = spawn(cmd, args, {
        stdio: ['pipe', null, null]
      });
      omxProcess.once('exit', respawn);
    } else {
      /* native loop support enabled or not requested */

      omxProcess = spawn(cmd, args, {
        stdio: ['pipe', null, null]
      });

      omxProcess.once('exit', function (code, signal) {
        omxProcess = null;
        that.emit('stop');
      });
    }

    that.emit('load', videos, options);
  };

  var play = function (videos, options) {
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

  var pause = function () {
    if (paused) {
      return false;
    }
    sendAction('pause');
    paused = true;
    that.emit('pause');
    return true;
  };
  
    var volup = function () {
    sendAction('volup');
    that.emit('volup');
    return true;
  };
  
  var voldown = function () {
    sendAction('voldown');
    that.emit('voldown');
    return true;
  };

  var handleQuitTimeout = function (oldOmxProcess, timeout) {
    var timeoutHandle = setTimeout(function () {
      console.log('omxplayer still running. kill forced');
      oldOmxProcess.kill('SIGTERM');
    }, timeout);
    oldOmxProcess.once('exit', function () {
      clearTimeout(timeoutHandle);
    });
  };

  var stop = function () {
    if (!omxProcess) {
      /* ignore, no omxProcess to stop */
      return false;
    }
    loopHelper = null;
    sendAction('quit');
    handleQuitTimeout(omxProcess, 250);
    omxProcess = null;
    return true;
  };

  var isPlaying = function () {
    return omxProcess && !paused;
  };

  var isLoaded = function () {
    return omxProcess;
  };

  var getStatus = function () {
    if (isLoaded()) {
      return {
        videos: currentVideos,
        settings: currentSettings,
        playing: isPlaying(),
        loaded: true
      };
    }
    return {
      loaded: false
    };
  };

  var setVideoDir = function (dir) {
    videoDir = dir;
  };

  var setVideoSuffix = function (suffix) {
    videoSuffix = suffix;
  };

  var enableNativeLoop = function () {
    nativeLoop = true;
    return that;
  };

  setInterval(onlyOneProcess, 5000);

  that.play = play;
  that.pause = pause;
  that.stop = stop;
  that.volup = volup;
  that.voldown = voldown;
  that.isPlaying = isPlaying;
  that.isLoaded = isLoaded;
  that.getStatus = getStatus;
  that.setVideoDir = setVideoDir;
  that.setVideoSuffix = setVideoSuffix;
  that.enableNativeLoop = enableNativeLoop;

  return that;
};

module.exports = omxdirector();
