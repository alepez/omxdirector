var spawn = require('child_process').spawn;

var LoopHelper = function(files, loop) {
  var that = {};
  var current = 0;

  var getNext = function() {
    current += 1;
    if (current === files.length) {
      if (loop) {
        current = 0;
      } else {
        that.emit('end');
        return null;
      }
    }
    return files[i];
  };

  that.getNext = getNext;

  return that;
};

module.exports.LoopHelper = LoopHelper;
