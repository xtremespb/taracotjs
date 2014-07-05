var fs = require('fs');
var buffer = require('buffer').Buffer;

var istextorbinary = {
  check: function(filename) {
    var isText = true;
    if (fs.existsSync(filename)) {
      var stat = fs.statSync(filename);
      if (stat.isFile()) {
        var fd = fs.openSync(filename, 'r');
        if (fd) {
          var buffer = new Buffer(100, 'binary');
          var max = stat.size;
          if (max > 100) { max = 100; }
          var br = fs.readSync(fd, buffer, 0, max, 0);
          if (br) {
            fs.closeSync(fd);
            for (var i=0; i<br; i++) {
              if (buffer[i] < 32 && buffer[i] != 10 && buffer[i] != 13 && buffer[i] != 9) {
                isText = false;
                break;
              }
            }
          }
        }
      }
    }
    return isText;
  }
};

module.exports = istextorbinary;