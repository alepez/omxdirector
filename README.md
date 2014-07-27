# omxdirector

Nodejs module providing a simple interface to omxplayer.

Supports multiple files playing and loops. It's capable of seamless
loops if `omxplayer` supports it natively. When `omxplayer` doesn't
support loops, this module handles loops respawning omxplayer
process.

## Usage

### Basic usage

    var omx = require('omxdirector');
    omx.play('video.avi');

### Multiple files

    omx.play(['video.mp4', 'anothervideo.mp4', 'foo.mp4'], {loop: true});

**WARNING:** at this time, multiple files playing is not supported by *official* **omxplayer**.
If using with a fork version, you must enable native loop support (see below).

### Options

 - **audioOutput** `"local"` or `"hdmi"` as `-o` omxplayer argument. If not specified or `"default"` is system default.
 - **loop** `true` to enable `--loop` omxplayer argument. Default is `false`.

**WARNING:** at this time, loop is not supported by *official* **omxplayer**.
If using with a fork version, you must enable native loop support. 

#### Example

    omx.play('video.mp4', {loop: true}); // enables loop
    omx.play('video.mp4', {audioOutput: 'local'}); // analog audio output

### Native loop support

If you have a versione of `omxplayer` supporting native loop with `--loop` flag,
you can enable it by calling:

    var omx = require('omxdirector').enableNativeLoop();

### Loop fallback

If using with standard omxplayer, a fallback is provided: once a video is finished,
another process of omxplayer is launched. It support multiple files and infinite loop.
Although this works fine, native support is better because there's no gap between video.

### Status

    omx.getStatus()

Return an object with current status:

If process is not running:

    { loaded: false }

If process is running:

    {
      loaded: true,
      videos: <Array>,    // videos array passed to play(videos, options)
      settings: <Object>,  // default settings or options object passed to play(videos, options)
      playing: <boolean>  // true if not paused, false if paused
    }

### Video directory

    omx.setVideoDir(path);

Set where to look for videos. Useful when all videos are in the same directory.

Instead of this:

    omx.play(['/home/pi/videos/foo.mp4', '/home/pi/videos/bar.mp4', '/home/pi/videos/asdasd.mp4']);

It's possible to use this shortcut:

    omx.setVideoDir('/home/pi/videos/');
    omx.play(['foo.mp4', 'bar.mp4', 'asdasd.mp4']);

### Video suffix

    omx.setVideoSuffix(suffix);

Set a suffix for videos. Useful when all videos share the same format.

Instead of this:

    omx.play(['foo.mp4', 'bar.mp4', 'asdasd.mp4']);

It's possible to use this shortcut:

    omx.setVideoSuffix('.mp4');
    omx.play(['foo', 'bar', 'asdasd']);

### Other methods

    omx.pause();     // pause the video
    omx.play();      // resume video playing
    omx.stop();      // stop video playing and terminate omxplayer process
    omx.isLoaded();  // return true if omxprocess is running
    omx.isPlaying(); // return true if omxprocess is running and video is not paused
    omx.volup();     // Increases the volume one notch
    omx.voldown();   // Decreases the volume one notch

### Events

    omx.on('load', function(files, options){}); // video successfully loaded (omxprocess starts)
    omx.on('play', function(){});  // when successfully started or resumed from pause
    omx.on('pause', function(){}); // when successfully paused
    omx.on('stop', function(){});  // when successfully stopped (omxplayer process ends)

## TODO

 - Emit event when each video start, stop etc...
 - Implement forward/backward.
 - Enable a fallback for loop and multiple files when native support is disabled.
 
