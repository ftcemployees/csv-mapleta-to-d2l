/*jslint plusplus: true, node: true, devel: true */
/*global */
"use strict";
var fs = require('fs'),
    cheerio = require('cheerio'),
    browserify = require('browserify');

function constructMakeUI() {
    var string = fs.readFileSync('indexTemplate.html', 'utf8'),
        $ = cheerio.load(string),
        guts = $('main').html(),
        encoded = encodeURI(guts),
        fileOut = '',
        fileName = 'makeUi.js';

    //fileOut += 'var $ = require("jquery");\n';
    //fileOut += '$("main").html(decodeURI("' + encoded + '"));';

    fileOut += 'document.querySelector("main").innerHTML = decodeURI("' + encoded + '");';

    fs.writeFileSync('makeUi.js', fileOut);
    console.log("Wrote:", fileName);
}

//make the UI file 
constructMakeUI();

//browserify it up and ship it out
var browserifyed = browserify([
    'makeUI.js',
    'main.js'
]).bundle();

var streamOut = fs.createWriteStream('dist/bundled.js', 'utf8');
streamOut.on('error', function (e) {
    console.log(e);
});

browserifyed.pipe(streamOut);
console.log("Wrote: bundled.js");
