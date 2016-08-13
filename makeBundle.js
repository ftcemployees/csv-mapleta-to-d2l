/*jslint plusplus: true, node: true, devel: true */
/*global */
"use strict";

var fs = require('fs'),
    cheerio = require('cheerio'),
    browserify = require('browserify'),
    string = fs.readFileSync('../index.html', 'utf8'),
    $ = cheerio.load(string),
    guts = $('main').html(),
    encoded = encodeURI(guts),
    fileOut = '',
    fileName = 'makeUi.js';

fileOut += '$ = require("jquery");\n';
fileOut += '$("main").html(decodeURI("' + encoded + '"));';

//console.log("encoded:", encoded);
fs.writeFileSync('makeUi.js', fileOut);
console.log("Wrote:", fileName);

//wrap it up and ship it out
var awesome = browserify([
    'jqueryTry.js',
    'makeUI.js',
    '../main.js'
]).bundle();
var streamOut = fs.createWriteStream('dist/tryAll.js', 'utf8');
streamOut.on('error', function (e) {
    console.log(e);
});

awesome.pipe(streamOut);
console.log("Wrote: tryAll.js");
