/*jslint plusplus: true, node: true, nomen: true*/
/*global */
"use strict";

var converter = require('../CSVMapleTaToD2l.js'),
    fs = require('fs'),
    path = require('path'),
    test = require('tape'),
    csvStructMsg = {
        total: 'The CSV does not have "Total" as the LAST column.',
        id: 'The CSV does not have "Student ID" as one of the columns.',
        login: 'The CSV does not have "Login" as one of the columns.'
    };

/***************************************************************/
/********************* CSV STRUCTURE ***************************/
/***************************************************************/
test('none of the requried messages', function (t) {
    //get and do the stuff 
    try {
        var csvText = fs.readFileSync(path.join(__dirname, 'csvStructNone.csv'), 'utf8'),
            parsed = converter.parse(csvText);
    } catch (e) {
        //test
        t.equal(e.message, csvStructMsg.total + '\n' + csvStructMsg.id + '\n' + csvStructMsg.login, e.message);
    }

    t.end();
});

test('just missing total', function (t) {
    //get and do the stuff 
    try {
        var csvText = fs.readFileSync(path.join(__dirname, 'csvStructNoTotal.csv'), 'utf8'),
            parsed = converter.parse(csvText);
    } catch (e) {
        //test
        t.equal(e.message, csvStructMsg.total, e.message);
    }

    t.end();
});

test('just missing id', function (t) {
    //get and do the stuff 
    try {
        var csvText = fs.readFileSync(path.join(__dirname, 'csvStructNoId.csv'), 'utf8'),
            parsed = converter.parse(csvText);
    } catch (e) {
        //test
        t.equal(e.message, csvStructMsg.id, e.message);
    }

    t.end();
});

test('just missing login', function (t) {
    //get and do the stuff 
    try {
        var csvText = fs.readFileSync(path.join(__dirname, 'csvStructNoLogin.csv'), 'utf8'),
            parsed = converter.parse(csvText);
    } catch (e) {
        //test
        t.equal(e.message, csvStructMsg.login, e.message);
    }

    t.end();
});

test('total not on end', function (t) {
    //get and do the stuff 
    try {
        var csvText = fs.readFileSync(path.join(__dirname, 'csvStructTotalNotOnEnd.csv'), 'utf8'),
            parsed = converter.parse(csvText);
    } catch (e) {
        //test
        t.equal(e.message, csvStructMsg.total, e.message);
    }

    t.end();
});

test('Got the correct Cols 1 grade Col', function (t) {
    //get and do the stuff 
    var csvText, parsed;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
    } catch (e) {
        //should not get here
        t.fail(e.message);
    }

    t.deepEqual(parsed.columns, ["Login", "Student ID", "All Grades", "Total"], parsed.columns);

    t.end();
});

test('Got the correct Cols 3 grade Col', function (t) {
    //get and do the stuff 
    var csvText, parsed;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything3Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
    } catch (e) {
        //should not get here
        t.fail(e.message);
    }

    t.deepEqual(parsed.columns, ["Login", "Student ID", "All Grades1", "All Grades2", "All Grades3", "Total"], parsed.columns);

    t.end();
});

/***************************************************************/
/*************** Col Conversions Structure *********************/
/***************************************************************/
test('1/1', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades",
            nameNew: "MapleTA",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        //should not get here
        t.fail(e.message);
    }

    t.deepEqual(converted, 'OrgDefinedId,Username,MapleTA Points Grade,End-of-Line Indicator\n#123456,#name,75.00,#', converted);

    t.end();
});

test('0/1', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grade",
            nameNew: "MapleTA",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'The 1st grade column, named "All Grade", could not be found in the CSV.', e.message);
    }

    t.end();
});
test('2/1', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades",
            nameNew: "MapleTA",
            pointsPossible: 100
        }, {
            nameOld: "All Grade",
            nameNew: "MapleTA",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'The 2nd grade column, named "All Grade", could not be found in the CSV.', e.message);
    }

    t.end();
});

test('3/3', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything3Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades1",
            nameNew: "MapleTA1",
            pointsPossible: 100
        }, {
            nameOld: "All Grades2",
            nameNew: "MapleTA2",
            pointsPossible: 100
        }, {
            nameOld: "All Grades3",
            nameNew: "MapleTA3",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        //should not get here
        t.fail(e.message);
    }

    t.deepEqual(converted, 'OrgDefinedId,Username,MapleTA1 Points Grade,MapleTA2 Points Grade,MapleTA3 Points Grade,End-of-Line Indicator\n#123456,#name,75.00,75.00,75.00,#', converted.split('\n')[0]);

    t.end();
});

test('2/3', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything3Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades1",
            nameNew: "MapleTA1",
            pointsPossible: 100
        }, {
            nameOld: "All Grades2",
            nameNew: "MapleTA2",
            pointsPossible: 100
        }, {
            nameOld: "All Grade",
            nameNew: "MapleTA3",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'The 3rd grade column, named "All Grade", could not be found in the CSV.', e.message);
    }
    t.end();
});

test('4/3', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything3Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades1",
            nameNew: "MapleTA1",
            pointsPossible: 100
        }, {
            nameOld: "All Grades2",
            nameNew: "MapleTA2",
            pointsPossible: 100
        }, {
            nameOld: "All Grades3",
            nameNew: "MapleTA3",
            pointsPossible: 100
        }, {
            nameOld: "All Grade",
            nameNew: "MapleTA3",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'The 4th grade column, named "All Grade", could not be found in the CSV.', e.message);
    }
    t.end();
});

test('1/3', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything3Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades1",
            nameNew: "MapleTA1",
            pointsPossible: 100
        }, {
            nameOld: "All Grade2",
            nameNew: "MapleTA2",
            pointsPossible: 100
        }, {
            nameOld: "All Grade3",
            nameNew: "MapleTA3",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'The 2nd grade column, named "All Grade2", could not be found in the CSV.\nThe 3rd grade column, named "All Grade3", could not be found in the CSV.', e.message);
    }
    t.end();
});

test('colConversion is empty', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything3Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'colConversions is not an array or is an empty array.', e.message);
    }

    t.end();
});

test('colConversion is not an array', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything3Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = '';
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'colConversions is not an array or is an empty array.', e.message);
    }

    t.end();
});

test('missing nameOld in colConversion', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOlds: "All Grade",
            nameNew: "MapleTA",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'In the colConversions array, the 1st object does not have a nameOld property or is not a string.', e.message);
    }

    t.end();
});

test('nameOld in colConversion is not a string', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: 1,
            nameNew: "MapleTA",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'In the colConversions array, the 1st object does not have a nameOld property or is not a string.', e.message);
    }

    t.end();
});

test('missing nameNew in colConversion', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades",
            nameNews: "MapleTA",
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'In the colConversions array, the 1st object does not have a nameNew property or is not a string.', e.message);
    }

    t.end();
});

test('nameOld in colConversion is not a string', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades",
            nameNew: 1,
            pointsPossible: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'In the colConversions array, the 1st object does not have a nameNew property or is not a string.', e.message);
    }

    t.end();
});

test('missing pointsPossible in colConversion', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades",
            nameNew: "MapleTA",
            pointsPossibless: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'In the colConversions array, the 1st object does not have a pointsPossible property or is not a number.', e.message);
    }

    t.end();
});

test('pointsPossible in colConversion is not a number', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grades",
            nameNew: "MapleTA",
            pointsPossible: Math.sqrt(-1)
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'In the colConversions array, the 1st object does not have a pointsPossible property or is not a number.', e.message);
    }

    t.end();
});

test('colConversion obj missing everything', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{}];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'In the colConversions array, the 1st object does not have a nameOld property or is not a string.\nIn the colConversions array, the 1st object does not have a nameNew property or is not a string.\nIn the colConversions array, the 1st object does not have a pointsPossible property or is not a number.', e.message);
    }

    t.end();
});

test('colConversion obj missing nameNew, and pointsPossible and nameOld can\'t be found', function (t) {
    //get and do the stuff 
    var csvText, parsed, colConversions, converted;
    try {
        csvText = fs.readFileSync(path.join(__dirname, 'csvStructEverything1Col.csv'), 'utf8');
        parsed = converter.parse(csvText);
        colConversions = [{
            nameOld: "All Grade",
            nameNews: "MapleTA",
            pointsPossibles: 100
        }];
        converted = converter.convert(parsed, colConversions);
    } catch (e) {
        t.equal(e.message, 'In the colConversions array, the 1st object does not have a nameNew property or is not a string.\nIn the colConversions array, the 1st object does not have a pointsPossible property or is not a number.\nThe 1st grade column, named "All Grade", could not be found in the CSV.', e.message);
    }

    t.end();
});
