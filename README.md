# omxdirector

Provide a simple interface to omxplayer, especially
for [the loop enabled version](https://github.com/pasky/omxplayer).


## Usage

    var omx = require('omxdirector');
    omx.play('video.avi');

### Enable loop

    omx.play('video.avi', {loop: true});

### Multiple files

    omx.play(['video.mp4', 'anothervideo.mp4', 'foo.mp4'], {loop: true});

### Status

    omx.getStatus()

Return an object with current status:

If process is not running:

    { loaded: false }

If process is running:

    {
      loaded: true,
      files: <Array>,     // files array passed to play(files, options)
      options: <Object>,  // options object passed to play(files, options)
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

### Events

    omx.on('load', function(files, options){}); // video successfully loaded (omxprocess starts)
    omx.on('play', function(){});  // when successfully started or resumed from pause
    omx.on('pause', function(){}); // when successfully paused
    omx.on('stop', function(){});  // when successfully stopped (omxplayer process ends)

## TODO

 - Emit event when each video start, stop etc...
 - Implement forward/backward.
 