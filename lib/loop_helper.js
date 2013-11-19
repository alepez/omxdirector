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
        return null;
      }
    }
    return files[current];
  };
  that.getNext = getNext;
  return that;
};

module.exports.LoopHelper = LoopHelper;
