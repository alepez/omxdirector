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

### Other methods

    omx.pause(); // pause the video
    omx.play();  // resume video playing
    omx.stop();  // stop video playing and terminate omxplayer process
    omx.isLoaded();  // return true if omxprocess is running
    omx.isPlaying(); // return true if omxprocess is running and video is not paused

## TODO

 - Emit event when each video start, stop, pause etc...
 - Implement forward/backward.
 