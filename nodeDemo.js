/*jslint plusplus: true, node: true */
/*global */
"use strict";

var converter = require('./CSVMapleTaToD2l.js'),
   fs = require('fs'),
   csv,
   converted;

csv = fs.readFileSync('mapleTAOutMore.csv', 'utf8');

converted = converter(csv, "CSVIn", 10);

fs.writeFileSync('converted.csv', converted, 'utf8');
