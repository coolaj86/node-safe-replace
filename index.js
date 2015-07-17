'use strict';

var PromiseA = require('bluebird').Promise;
var fs = PromiseA.promisifyAll(require('fs'));

function noop() {
}

function create(options) {
  if (!options) {
    options = {};
  }
  if (!options.new) {
    options.new = 'new';
  }
  if (!options.bak) {
    options.bak = 'bak';
  }
  if (options.new === options.bak) {
    throw new Error("'new' and 'bak' suffixes cannot be the same... duh");
  }

  var newnamefn = options.newnamefn || function (pathname) {
    return pathname + '.' + options.new;
  };
  var baknamefn = options.baknamefn || function (pathname) {
    return pathname + '.' + options.bak;
  };
  var namefn = options.namefn || function (pathname) {
    return pathname;
  };

  var sfs = {
    writeFile: function (filename, data, options) {
      //console.log(newnamefn(filename));
      return fs.writeFileAsync(newnamefn(filename), data, options).then(function () {
        //console.log(namefn(filename));
        return sfs.commit(namefn(filename));
      });
    }
  , commit: function (filename) {
      // this may not exist
      return fs.unlinkAsync(baknamefn(filename)).then(noop, noop).then(function () {
        // this may not exist
        //console.log(namefn(filename), '->', baknamefn(filename));
        return fs.renameAsync(namefn(filename), baknamefn(filename)).then(function () {
          //console.log('created bak');
        }, noop);
      }).then(function () {
        // this must be successful
        //console.log(newnamefn(filename), '->', namefn(filename));
        return fs.renameAsync(newnamefn(filename), namefn(filename)).then(noop, function (err) {
          //console.error(err);
          return sfs.revert(filename).then(function () {
            return PromiseA.reject(err);
          });
        });
      });
    }
  , revert: function (filename) {
      return new PromiseA(function (resolve, reject) {
        var reader = fs.createReadStream(baknamefn(filename));
        var writer = fs.createWriteStream(namefn(filename));

        reader.on('error', reject);
        writer.on('error', reject);

        reader.pipe(writer);
        writer.on('close', resolve);
      });
    }
  };

  return sfs;
}

module.exports.create = create;
