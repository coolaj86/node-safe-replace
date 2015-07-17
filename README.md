safe-replace
============

A micro-module for safely replacing a file.

Commandline Reference
---------------------

If I want to safely replace a file with a new version, I would do so like this:

```bash
# create the new version
touch keep.txt.new

# remove the previous backup
rm -f keep.txt.bak

# move the current version to the backup
mv keep.txt keep.txt.bak

# move the new version to the current
mv keep.txt.new keep.txt
```

If `keep.txt` became corrupt and I wanted to use the backup,
I would do this:

```bash
# copy the backup to the new version
rsync keep.txt.bak keep.txt
```

In Node
-------

I ported that proccess to node.

```js
// default behavior is to concat (filename + '.' + 'new')
var safeReplace = require('safe-replace').create({ new: 'new', bak: 'bak' });

var data = new Buffer('A priceless document');
safeReplace.writeFile('keep.txt', data, 'ascii').then(function () {
  fs.readdir('.', function (nodes) {
    console.log('file system nodes', nodes);
    // keep.txt
    // keep.txt.bak
  });
});

// let's say I wrote keep.txt.new with my own mechanism
safeReplace.commit('keep.txt').then(function () {
  fs.readdir('.', function (nodes) {
    console.log('file system nodes', nodes);
    // keep.txt
    // keep.txt.bak
  });
});

// let's say I want to revert the file from the '.bak'
safeReplace.revert('keep.txt').then(function () {
  fs.readdir('.', function (nodes) {
    console.log('file system nodes', nodes);
    // keep.txt
    // keep.txt.bak
  });
});
```
