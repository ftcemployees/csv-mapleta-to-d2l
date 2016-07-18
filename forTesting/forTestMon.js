/*jslint plusplus: true, node: true, nomen: true*/
/*global */
"use strict";

var nodemon = require('nodemon'),
   tapDiff = require('tap-diff'),
   path = require('path'),
   settings = {
      script: './forTesting/testCSVMapleTAToD2L.js',
      stdout: false,
      ext: 'js json'
   };

nodemon(settings)
   .on('readable', function () { // the `readable` event indicates that data is ready to pick up
      this.stdout.pipe(tapDiff()).pipe(process.stdout);
   })
   .on('restart', function (files) {
      var fileText = files.map(function (file) {
         return '    ' + path.relative(__dirname + '/..', file);
      });

      console.log('App restarted due to: ');
      console.log(fileText.join('\n'));
   });
