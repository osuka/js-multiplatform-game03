'use strict';

// see http://jshint.com/docs/reporters/
// and https://github.com/jshint/jshint/blob/master/examples/reporter.js

module.exports = {
  reporter: function (res) {
    var len = res.length;
    var str = '';
    if (!len) {
      return;
    }
    var exec = require('child_process').exec;
    var phrases = [
      'You are but a fool.', 'Why are you doing this to me.',
      'Come on you should know better.', 'What are you doing',
      'There must be more than this to life.'
    ];
    var whichOne = Math.floor(Math.random() * phrases.length);
    exec('say "There is a syntax error. "' + phrases[whichOne]);
    process.stdout.write('\n ************************************\n');
    process.stdout.write('Errors during validation detected:\n');

    res.forEach(function (r) {
      var file = r.file;
      var err = r.error;

      str += file + ': line ' + err.line + ', col ' +
              err.character + ', ' + err.reason + '\n';
    });

    if (str) {
      process.stdout.write(str + '\n' + len + ' error' +
              ((len === 1) ? '' : 's') + '\n');
    }
  }
};
