/*jslint plusplus: true, node: true */
/*global d3:true*/
"use strict";
var csvMapleTAToD2L = (function () {

    var parseCsv, makeCsv, d3, objOut,
        inNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

    /************** SETUP *****************/

    //for node testing
    if (inNode) {
        d3 = require('d3-dsv');
    } else {
        d3 = window.d3;
    }

    //abstraction
    parseCsv = d3.csvParse;
    makeCsv = d3.csvFormat;

    function ordinalNumber(numIn) {
        var onesPlace = numIn % 10,
            ending;
        switch (onesPlace) {
            case 1:
                ending = 'st';
                break;
            case 2:
                ending = 'nd';
                break;
            case 3:
                ending = 'rd';
                break;
            default:
                ending = 'th';
        }

        return numIn + ending;
    }

    function colConversionsHasCorrectFormat(csvObj, colConversions) {
        var errors = [];

        //check if colConversion is an array
        if (!Array.isArray(colConversions) || colConversions.length === 0) {
            errors.push('colConversions is not an array or is an empty array.');
        } else {

            colConversions.forEach(function (col, colIndex) {
                var hasNameOld = true;
                //check if the colConversions obj has all the right parts
                if (typeof col.nameOld !== 'string') {
                    errors.push('In the colConversions array, the ' + ordinalNumber(colIndex + 1) + ' object does not have a nameOld property or is not a string.');
                    hasNameOld = false;
                }

                if (typeof col.nameNew !== 'string') {
                    errors.push('In the colConversions array, the ' + ordinalNumber(colIndex + 1) + ' object does not have a nameNew property or is not a string.');
                }

                if (typeof col.pointsPossible !== 'number' || isNaN(col.pointsPossible)) {
                    errors.push('In the colConversions array, the ' + ordinalNumber(colIndex + 1) + ' object does not have a pointsPossible property or is not a number.');
                }

                //check the col is in the csv
                if (hasNameOld && csvObj.columns.indexOf(col.nameOld) === -1) {
                    errors.push('The ' + ordinalNumber(colIndex + 1) + ' grade column, named "' + col.nameOld + '", could not be found in the CSV.');
                }
            });

        }
        //see if we made it
        if (errors.length > 0) {
            //concat message and throw error
            throw new Error(errors.join('\n'));
        }
    }

    function csvHasCorrectColumns(d3ParsedCSV) {
        var errors = [],
            cols = d3ParsedCSV.columns,
            totalIndex = cols.indexOf('MapleTA Calculated Total'),
            idIndex = cols.indexOf('Student ID'),
            loginIndex = cols.indexOf('Login');

        //does it have Total as last column

        if (totalIndex === -1 || totalIndex !== cols.length - 1) {
            errors.push('The CSV does not have "Total" as the LAST column.');
        }

        //does it have a Student ID column
        if (idIndex === -1) {
            errors.push('The CSV does not have "Student ID" as one of the columns.');
        }

        //does it have a Login column
        if (loginIndex === -1) {
            errors.push('The CSV does not have "Login" as one of the columns.');
        }

        //see if we made it
        if (errors.length > 0) {
            //concat message and throw error
            throw new Error(errors.join('\n'));
        }

    }

    /***************************************************/
    /******************** FUNCTIONS ********************/
    /***************************************************/
    function getGradeColNames(csvObj) {
        var cols = csvObj.columns,
            startIndex = cols.indexOf('Student ID') + 1,
            endIndex = cols.indexOf('MapleTA Calculated Total') + 1,
            colsOut = cols.slice(startIndex, endIndex);

        //console.log("cols:", cols);
        //console.log("startIndex:", startIndex);
        //console.log("endIndex:", endIndex);
        //console.log("colsOut:", colsOut);
        
        return colsOut;
    }

    function parse(csvText) {
        // TODO(GRANT): If  "" exists in first line first everything, put a title
        var csv = parseCsv(csvText);

        // TODO(GRANT): Create a function to filter the rows that don't equal "" if the first Object is named
        /*csv = csv.filter(function(item){
            return item.col1 === '' || typeof item.col1 === 'undefined';
        });*/
        //check if we have all the columns we need
        //this will throw an error if we don't have all the columns we need.
        //the message will be a '\n' delimited string that has the approate feed back to the user in it.
        //We do not catch it here to make this modular
        csvHasCorrectColumns(csv);

        //we made it!
        return csv;
    }

    //the colConversions is an array full of objects that look like this
    /*{
          nameOld: "My Name In CSV",
          nameNew: "My Name Out",
          pointsPossible: 52
       }*/
    function convert(csvObj, colConversions) {
        var dataOut,
            colsWeWant,
            converted;
        //error check if colConversions match in the csvObj.cols
        //this will throw an error if every  colConversion.nameOld is not found in csvObj.columns.
        //the message will be a '\n' delimited string that has the approate feed back to the user in it.
        //We do not catch it here to make this modular
        colConversionsHasCorrectFormat(csvObj, colConversions);
        //we made it

        //Convert the csvObj to have the new col names and the ones we want
        dataOut = csvObj.map(function (row) {
            var rowOut = {
                "OrgDefinedId": '#' + row['Student ID'],
                "Username": '#' + row.Login,
                "End-of-Line Indicator": "#"
            };

            //add in the grade cols
            colConversions.forEach(function (col) {
		if (col.nameOld == "MapleTA Calculated Total") {
		    row[col.nameOld] += "%";
		}
		
                if (row[col.nameOld].indexOf('%') > -1) {
                    rowOut[col.nameNew + ' Points Grade'] = (parseInt(row[col.nameOld], 10) / 100 * col.pointsPossible).toFixed(2);
                } else if (row[col.nameOld].length == 0) {
                    rowOut[col.nameNew + ' Points Grade'] = "";
                } else {
                    throw new Error("CSV file contains number scores and not percentages");
                }
            });

            return rowOut;
        });

        //back to csv text with the columns we want
        colsWeWant = ["OrgDefinedId", "Username"];

        //add in the new cols in the order they gave us
        colConversions.forEach(function (col) {
            colsWeWant.push(col.nameNew + ' Points Grade');
        });

        //D2L wants this
        colsWeWant.push('End-of-Line Indicator');

        return makeCsv(dataOut, colsWeWant);
    }

    /************** RETURN *****************/
    objOut = {
        parse: parse,
        convert: convert,
        getGradeColNames: getGradeColNames
    };

    //for node testing
    if (inNode) {
        module.exports = objOut;
    }

    //for Broswer
    return objOut;
}());
