(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
            totalIndex = cols.indexOf('Total'),
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
            endIndex = cols.indexOf('Total'),
            colsOut = cols.slice(startIndex, endIndex);

        //console.log("cols:", cols);
        //console.log("startIndex:", startIndex);
        //console.log("endIndex:", endIndex);
        //console.log("colsOut:", colsOut);
        return colsOut;
    }

    function parse(csvText) {
        var csv = parseCsv(csvText);

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
                //                "OrgDefinedId": row['Student ID'],
                "Username": row.Login,
                "End-of-Line Indicator": "#"
            };

            //add in the grade cols
            colConversions.forEach(function (col) {
                if (row[col.nameOld].indexOf('%') > -1) {
                    rowOut[col.nameNew + ' Points Grade'] = (parseInt(row[col.nameOld], 10) / 100 * col.pointsPossible).toFixed(2);
                } else {
                    throw new Error("CSV file contains number scores and not percentages");
                }
            });

            return rowOut;
        });

        //back to csv text with the columns we want
        //colsWeWant = ["OrgDefinedId", "Username"];
        colsWeWant = ["Username"];

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

},{"d3-dsv":4}],2:[function(require,module,exports){
/*jslint plusplus: true, browser:true, node: true, devel: true */
/*global FileReaderJS, csvMapleTAToD2L, download*/

(function () {
    "use strict";

    var fileInfo, parseCol, options,
        csvMapleTAToD2L = require('./csvMapleTAToD2L.js'),
        download = require('./thirdParty/download.js'),
        filereaderFAKE = require('./thirdParty/filereader.js'),
        FileReaderJS = window.FileReaderJS;

    //filereaderFAKE is fake because filereader.js adds FileReaderJS to window
    //its so it is included in the correct order with browserify

    /***************************************************/
    /****************** ERROR CHECKING *****************/
    /***************************************************/
    function displayErr(errors) {
        var errorPara = document.querySelector("#errorMessage"),
            errorMessage;

        errorPara.innerHTML = "";

        if (typeof errors === "string") {
            errorMessage = document.createTextNode(errors);
        } else {
            errorMessage = document.createTextNode(errors.join('\n'));
        }

        errorPara.appendChild(errorMessage);
        errorPara.style.opacity = 1;
        window.setTimeout(function () {
            errorPara.style.opacity = 0;
        }, 5000);
    }

    /*Validate the inputs*/
    function validateGo() {
        var inputs = document.getElementsByTagName('input'),
            index,
            atLeastOneChecked = false;

        for (index = 0; index < inputs.length; ++index) {
            if (inputs[index].type.toLowerCase() === "checkbox" && inputs[index].checked === true) {
                atLeastOneChecked = true;
            }
        }

        if (!atLeastOneChecked) {
            throw new Error("At least one grade item must be included.");
        }
    }

    /*Load all the options for the conversion Brightspace CSV gradesheet.*/
    function getOptions() {
        var arrExport = [],
            i,
            objExport,
            table = document.getElementsByTagName("table")[0],
            queryString,
            length = document.querySelectorAll("table tr").length;

        for (i = 1; i < length; i++) {
            queryString = "table tr:nth-of-type(" + (i + 1) + ") ";
            if (document.querySelectorAll(queryString + ":checked").length > 0) {
                objExport = {
                    nameOld: document.querySelector(queryString + "th").innerHTML,
                    nameNew: document.querySelector(queryString + "td:nth-of-type(1) input").value,
                    pointsPossible: parseFloat(document.querySelector(queryString + "td:nth-of-type(2) input").value)
                };

                arrExport.push(objExport);
            }
        }

        console.log(arrExport);

        return arrExport;
    }

    function makeTheTable(fileInfo) {
        var columnNameContainer = document.querySelector("#columnNameContainer"),
            table = document.createElement("table"),
            row,
            i;

        function addTr(row, text) {
            var cell = document.createElement("th"),
                textEle = document.createTextNode(text);
            cell.appendChild(textEle);
            row.appendChild(cell);
        }

        function addTextInputCell(row) {
            var cell = document.createElement("td"),
                textInput = document.createElement('input');

            textInput.type = "text";
            cell.appendChild(textInput);
            row.appendChild(cell);
        }

        function addCheckboxCell(row) {
            var cell = document.createElement("td"),
                checkbox = document.createElement('input');

            checkbox.type = "checkbox";
            checkbox.checked = true;
            cell.appendChild(checkbox);
            row.appendChild(cell);
        }

        /************************ MAKE THE TABLE *****************************/
        //clean out the container
        columnNameContainer.innerHTML = '';

        row = document.createElement("tr");

        // Heading Cells
        addTr(row, "");
        addTr(row, "Bright Space Name");
        addTr(row, "Points Possible");
        addTr(row, "Include?");

        table.appendChild(row);

        /*Dynamically create inputs for each gradable column on the CSV import*/
        for (i = 0; i < fileInfo.colNames.length; i++) {
            // Name of assignment
            row = document.createElement("tr");
            addTr(row, fileInfo.colNames[i]);

            // Input for brightspace name
            addTextInputCell(row);

            // Input for points possible
            addTextInputCell(row);

            // Input for including the grade item
            addCheckboxCell(row);

            // Append the row to the table
            table.appendChild(row);
        }

        //add in the table guts
        columnNameContainer.appendChild(table);

    }

    function onLoadFileEnd(e, file) {

        console.log(e.target.result);
        console.log(file);

        //parse the csv
        try {
            parseCol = csvMapleTAToD2L.parse(e.target.result);
        } catch (er) {
            displayErr(er.message);
        }

        fileInfo = {
            text: e.target.result,
            name: file.name,
            nameNoExtention: file.extra.nameNoExtension,
            mimeType: file.type,
            colNames: csvMapleTAToD2L.getGradeColNames(parseCol)
        };

        makeTheTable(fileInfo);

        //add in the file name so the user can see what file they picked
        document.querySelector('#filename').innerHTML = "Filename: " + fileInfo.name;

        //show the rest of the ui
        document.querySelector('#options').classList.add('on');
    }

    /***************************************************/
    /********************** START **********************/
    /***************************************************/
    options = {
        readAsDefault: "Text",
        dragClass: "dropping",
        on: {
            loadend: onLoadFileEnd
        }
    };

    //add file listeners
    FileReaderJS.setupInput(document.querySelector('#file input'), options);
    FileReaderJS.setupDrop(document.querySelector('#drop'), options);

    //Go button click logic
    document.querySelector('button').onclick = function () {
        function makeTime() {
            var time, date;
            date = new Date();
            time = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '_' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
            console.log("time:", time);
            return time;
        }

        var converted,
            arrExport,
            time = makeTime();

        try {
            validateGo();
            arrExport = getOptions();

            //run the code
            console.log("fileInfo.text:", fileInfo.text);
            converted = csvMapleTAToD2L.convert(parseCol, arrExport);
            download(converted, "converted_" + fileInfo.nameNoExtention + '_' + time + '.csv', fileInfo.mimeType);
        } catch (e) {
            displayErr(e.message);
        }
    };

}());

},{"./csvMapleTAToD2L.js":1,"./thirdParty/download.js":5,"./thirdParty/filereader.js":6}],3:[function(require,module,exports){
document.querySelector("main").innerHTML = decodeURI("%0D%0A%20%20%20%20%20%20%20%20%3Cp%20id=%22errorMessage%22%3E%3C/p%3E%0D%0A%20%20%20%20%20%20%20%20%3Cdiv%20id=%22file%22%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Ch1%3EMapleTA%20Gradesheet%20Converter%3C/h1%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Ch2%3EInstructions%3C/h2%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cp%3EUpload%20to%20this%20application%20the%20CSV%20file%20from%20MapleTA.%20Once%20uploaded,%20follow%20the%20instructions%20below.%3C/p%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Ch2%3E1.%20Click%20&apos;Choose%20File&apos;%20to%20read%20file%3C/h2%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Clabel%3E%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20Maple%20TA%20File:%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cinput%20type=%22file%22%3E%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3C/label%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Ch2%3EOr%3C/h2%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id=%22drop%22%3EDrop%20CSV%20here%3C/div%3E%0D%0A%20%20%20%20%20%20%20%20%3C/div%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%3Cdiv%20id=%22options%22%3E%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id=%22filename%22%3E%3C/div%3E%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Ch2%3E2.%20Answer%20these%20Questions%3C/h2%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cdiv%20id=%22columnNameContainer%22%3E%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3C!--%20%20%20%20%20%20%20%20%20%20%20%20Column%20names%20with%20appear%20here.%20%20%20%20%20%20%20%20%20%20%20%20--%3E%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3C/div%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Ch2%3E3.%20Click%20Go%20to%20convert%20the%20CSV%20sheet.%3C/h2%3E%0D%0A%0D%0A%20%20%20%20%20%20%20%20%20%20%20%20%3Cbutton%3EGo%3C/button%3E%0D%0A%20%20%20%20%20%20%20%20%3C/div%3E%0D%0A%0D%0A%20%20%20%20");
},{}],4:[function(require,module,exports){
// https://d3js.org/d3-dsv/ Version 1.0.1. Copyright 2016 Mike Bostock.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.d3 = global.d3 || {})));
}(this, function (exports) { 'use strict';

  function objectConverter(columns) {
    return new Function("d", "return {" + columns.map(function(name, i) {
      return JSON.stringify(name) + ": d[" + i + "]";
    }).join(",") + "}");
  }

  function customConverter(columns, f) {
    var object = objectConverter(columns);
    return function(row, i) {
      return f(object(row), i, columns);
    };
  }

  // Compute unique columns in order of discovery.
  function inferColumns(rows) {
    var columnSet = Object.create(null),
        columns = [];

    rows.forEach(function(row) {
      for (var column in row) {
        if (!(column in columnSet)) {
          columns.push(columnSet[column] = column);
        }
      }
    });

    return columns;
  }

  function dsv(delimiter) {
    var reFormat = new RegExp("[\"" + delimiter + "\n]"),
        delimiterCode = delimiter.charCodeAt(0);

    function parse(text, f) {
      var convert, columns, rows = parseRows(text, function(row, i) {
        if (convert) return convert(row, i - 1);
        columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
      });
      rows.columns = columns;
      return rows;
    }

    function parseRows(text, f) {
      var EOL = {}, // sentinel value for end-of-line
          EOF = {}, // sentinel value for end-of-file
          rows = [], // output rows
          N = text.length,
          I = 0, // current character index
          n = 0, // the current line number
          t, // the current token
          eol; // is the current token followed by EOL?

      function token() {
        if (I >= N) return EOF; // special case: end of file
        if (eol) return eol = false, EOL; // special case: end of line

        // special case: quotes
        var j = I, c;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.slice(j + 1, i).replace(/""/g, "\"");
        }

        // common case: find next delimiter or newline
        while (I < N) {
          var k = 1;
          c = text.charCodeAt(I++);
          if (c === 10) eol = true; // \n
          else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
          else if (c !== delimiterCode) continue;
          return text.slice(j, I - k);
        }

        // special case: last token before EOF
        return text.slice(j);
      }

      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && (a = f(a, n++)) == null) continue;
        rows.push(a);
      }

      return rows;
    }

    function format(rows, columns) {
      if (columns == null) columns = inferColumns(rows);
      return [columns.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
        return columns.map(function(column) {
          return formatValue(row[column]);
        }).join(delimiter);
      })).join("\n");
    }

    function formatRows(rows) {
      return rows.map(formatRow).join("\n");
    }

    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }

    function formatValue(text) {
      return text == null ? ""
          : reFormat.test(text += "") ? "\"" + text.replace(/\"/g, "\"\"") + "\""
          : text;
    }

    return {
      parse: parse,
      parseRows: parseRows,
      format: format,
      formatRows: formatRows
    };
  }

  var csv = dsv(",");

  var csvParse = csv.parse;
  var csvParseRows = csv.parseRows;
  var csvFormat = csv.format;
  var csvFormatRows = csv.formatRows;

  var tsv = dsv("\t");

  var tsvParse = tsv.parse;
  var tsvParseRows = tsv.parseRows;
  var tsvFormat = tsv.format;
  var tsvFormatRows = tsv.formatRows;

  exports.dsvFormat = dsv;
  exports.csvParse = csvParse;
  exports.csvParseRows = csvParseRows;
  exports.csvFormat = csvFormat;
  exports.csvFormatRows = csvFormatRows;
  exports.tsvParse = tsvParse;
  exports.tsvParseRows = tsvParseRows;
  exports.tsvFormat = tsvFormat;
  exports.tsvFormatRows = tsvFormatRows;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],5:[function(require,module,exports){
//download.js v4.2, by dandavis; 2008-2016. [CCBY2] see http://danml.com/download.html for tests/usage
// v1 landed a FF+Chrome compat way of downloading strings to local un-named files, upgraded to use a hidden frame and optional mime
// v2 added named files via a[download], msSaveBlob, IE (10+) support, and window.URL support for larger+faster saves than dataURLs
// v3 added dataURL and Blob Input, bind-toggle arity, and legacy dataURL fallback was improved with force-download mime and base64 support. 3.1 improved safari handling.
// v4 adds AMD/UMD, commonJS, and plain browser support
// v4.1 adds url download capability via solo URL argument (same domain/CORS only)
// v4.2 adds semantic variable names, long (over 2MB) dataURL support, and hidden by default temp anchors
// https://github.com/rndme/download

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.download = factory();
  }
}(this, function () {

	return function download(data, strFileName, strMimeType) {

		var self = window, // this script is only for browsers anyway...
			defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
			mimeType = strMimeType || defaultMime,
			payload = data,
			url = !strFileName && !strMimeType && payload,
			anchor = document.createElement("a"),
			toString = function(a){return String(a);},
			myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
			fileName = strFileName || "download",
			blob,
			reader;
			myBlob= myBlob.call ? myBlob.bind(self) : Blob ;
	  
		if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
			payload=[payload, mimeType];
			mimeType=payload[0];
			payload=payload[1];
		}


		if(url && url.length< 2048){ // if no filename and no mime, assume a url was passed as the only argument
			fileName = url.split("/").pop().split("?")[0];
			anchor.href = url; // assign href prop to temp anchor
		  	if(anchor.href.indexOf(url) !== -1){ // if the browser determines that it's a potentially valid url path:
        		var ajax=new XMLHttpRequest();
        		ajax.open( "GET", url, true);
        		ajax.responseType = 'blob';
        		ajax.onload= function(e){ 
				  download(e.target.response, fileName, defaultMime);
				};
        		setTimeout(function(){ ajax.send();}, 0); // allows setting custom ajax headers using the return:
			    return ajax;
			} // end if valid url?
		} // end if url?


		//go ahead and download dataURLs right away
		if(/^data\:[\w+\-]+\/[\w+\-]+[,;]/.test(payload)){
		
			if(payload.length > (1024*1024*1.999) && myBlob !== toString ){
				payload=dataUrlToBlob(payload);
				mimeType=payload.type || defaultMime;
			}else{			
				return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
					navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
					saver(payload) ; // everyone else can save dataURLs un-processed
			}
			
		}//end if dataURL passed?

		blob = payload instanceof myBlob ?
			payload :
			new myBlob([payload], {type: mimeType}) ;


		function dataUrlToBlob(strUrl) {
			var parts= strUrl.split(/[:;,]/),
			type= parts[1],
			decoder= parts[2] == "base64" ? atob : decodeURIComponent,
			binData= decoder( parts.pop() ),
			mx= binData.length,
			i= 0,
			uiArr= new Uint8Array(mx);

			for(i;i<mx;++i) uiArr[i]= binData.charCodeAt(i);

			return new myBlob([uiArr], {type: type});
		 }

		function saver(url, winMode){

			if ('download' in anchor) { //html5 A[download]
				anchor.href = url;
				anchor.setAttribute("download", fileName);
				anchor.className = "download-js-link";
				anchor.innerHTML = "downloading...";
				anchor.style.display = "none";
				document.body.appendChild(anchor);
				setTimeout(function() {
					anchor.click();
					document.body.removeChild(anchor);
					if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(anchor.href);}, 250 );}
				}, 66);
				return true;
			}

			// handle non-a[download] safari as best we can:
			if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
				url=url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
				if(!window.open(url)){ // popup blocked, offer direct download:
					if(confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")){ location.href=url; }
				}
				return true;
			}

			//do iframe dataURL download (old ch+FF):
			var f = document.createElement("iframe");
			document.body.appendChild(f);

			if(!winMode){ // force a mime that will download:
				url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
			}
			f.src=url;
			setTimeout(function(){ document.body.removeChild(f); }, 333);

		}//end saver




		if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
			return navigator.msSaveBlob(blob, fileName);
		}

		if(self.URL){ // simple fast and modern way using Blob and URL:
			saver(self.URL.createObjectURL(blob), true);
		}else{
			// handle non-Blob()+non-URL browsers:
			if(typeof blob === "string" || blob.constructor===toString ){
				try{
					return saver( "data:" +  mimeType   + ";base64,"  +  self.btoa(blob)  );
				}catch(y){
					return saver( "data:" +  mimeType   + "," + encodeURIComponent(blob)  );
				}
			}

			// Blob but not URL support:
			reader=new FileReader();
			reader.onload=function(e){
				saver(this.result);
			};
			reader.readAsDataURL(blob);
		}
		return true;
	}; /* end download() */
}));
},{}],6:[function(require,module,exports){
/*I made one tiny change to this file, the last line had 
    })(this, document);
I changed it to 
    })(window, document);
so it could work in browserify,
Well I also added the full MIT license that follows below.
*/

/*MIT License

Copyright (c) 2014 Brian Grinstead

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

/*!
FileReader.js - v0.99
A lightweight wrapper for common FileReader usage.
Copyright 2014 Brian Grinstead - MIT License.
See http://github.com/bgrins/filereader.js for documentation.
*/

(function (window, document) {

    var FileReader = window.FileReader;
    var FileReaderSyncSupport = false;
    var workerScript = "self.addEventListener('message', function(e) { var data=e.data; try { var reader = new FileReaderSync; postMessage({ result: reader[data.readAs](data.file), extra: data.extra, file: data.file})} catch(e){ postMessage({ result:'error', extra:data.extra, file:data.file}); } }, false);";
    var syncDetectionScript = "onmessage = function(e) { postMessage(!!FileReaderSync); };";
    var fileReaderEvents = ['loadstart', 'progress', 'load', 'abort', 'error', 'loadend'];
    var sync = false;
    var FileReaderJS = window.FileReaderJS = {
        enabled: false,
        setupInput: setupInput,
        setupDrop: setupDrop,
        setupClipboard: setupClipboard,
        setSync: function (value) {
            sync = value;

            if (sync && !FileReaderSyncSupport) {
                checkFileReaderSyncSupport();
            }
        },
        getSync: function () {
            return sync && FileReaderSyncSupport;
        },
        output: [],
        opts: {
            dragClass: "drag",
            accept: false,
            readAsDefault: 'DataURL',
            readAsMap: {},
            on: {
                loadstart: noop,
                progress: noop,
                load: noop,
                abort: noop,
                error: noop,
                loadend: noop,
                skip: noop,
                groupstart: noop,
                groupend: noop,
                beforestart: noop
            }
        }
    };

    // Setup jQuery plugin (if available)
    if (typeof (jQuery) !== "undefined") {
        jQuery.fn.fileReaderJS = function (opts) {
            return this.each(function () {
                if (jQuery(this).is("input")) {
                    setupInput(this, opts);
                } else {
                    setupDrop(this, opts);
                }
            });
        };

        jQuery.fn.fileClipboard = function (opts) {
            return this.each(function () {
                setupClipboard(this, opts);
            });
        };
    }

    // Not all browsers support the FileReader interface. Return with the enabled bit = false.
    if (!FileReader) {
        return;
    }

    // makeWorker is a little wrapper for generating web workers from strings
    function makeWorker(script) {
        var URL = window.URL || window.webkitURL;
        var Blob = window.Blob;
        var Worker = window.Worker;

        if (!URL || !Blob || !Worker || !script) {
            return null;
        }

        var blob = new Blob([script]);
        var worker = new Worker(URL.createObjectURL(blob));
        return worker;
    }

    // setupClipboard: bind to clipboard events (intended for document.body)
    function setupClipboard(element, opts) {

        if (!FileReaderJS.enabled) {
            return;
        }
        var instanceOptions = extend(extend({}, FileReaderJS.opts), opts);

        element.addEventListener("paste", onpaste, false);

        function onpaste(e) {
            var files = [];
            var clipboardData = e.clipboardData || {};
            var items = clipboardData.items || [];

            for (var i = 0; i < items.length; i++) {
                var file = items[i].getAsFile();

                if (file) {

                    // Create a fake file name for images from clipboard, since this data doesn't get sent
                    var matches = new RegExp("/\(.*\)").exec(file.type);
                    if (!file.name && matches) {
                        var extension = matches[1];
                        file.name = "clipboard" + i + "." + extension;
                    }

                    files.push(file);
                }
            }

            if (files.length) {
                processFileList(e, files, instanceOptions);
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    // setupInput: bind the 'change' event to an input[type=file]
    function setupInput(input, opts) {

        if (!FileReaderJS.enabled) {
            return;
        }
        var instanceOptions = extend(extend({}, FileReaderJS.opts), opts);

        input.addEventListener("change", inputChange, false);
        input.addEventListener("drop", inputDrop, false);

        function inputChange(e) {
            processFileList(e, input.files, instanceOptions);
        }

        function inputDrop(e) {
            e.stopPropagation();
            e.preventDefault();
            processFileList(e, e.dataTransfer.files, instanceOptions);
        }
    }

    // setupDrop: bind the 'drop' event for a DOM element
    function setupDrop(dropbox, opts) {

        if (!FileReaderJS.enabled) {
            return;
        }
        var instanceOptions = extend(extend({}, FileReaderJS.opts), opts);
        var dragClass = instanceOptions.dragClass;
        var initializedOnBody = false;

        // Bind drag events to the dropbox to add the class while dragging, and accept the drop data transfer.
        dropbox.addEventListener("dragenter", onlyWithFiles(dragenter), false);
        dropbox.addEventListener("dragleave", onlyWithFiles(dragleave), false);
        dropbox.addEventListener("dragover", onlyWithFiles(dragover), false);
        dropbox.addEventListener("drop", onlyWithFiles(drop), false);

        // Bind to body to prevent the dropbox events from firing when it was initialized on the page.
        document.body.addEventListener("dragstart", bodydragstart, true);
        document.body.addEventListener("dragend", bodydragend, true);
        document.body.addEventListener("drop", bodydrop, false);

        function bodydragend(e) {
            initializedOnBody = false;
        }

        function bodydragstart(e) {
            initializedOnBody = true;
        }

        function bodydrop(e) {
            if (e.dataTransfer.files && e.dataTransfer.files.length) {
                e.stopPropagation();
                e.preventDefault();
            }
        }

        function onlyWithFiles(fn) {
            return function () {
                if (!initializedOnBody) {
                    fn.apply(this, arguments);
                }
            };
        }

        function drop(e) {
            e.stopPropagation();
            e.preventDefault();
            if (dragClass) {
                removeClass(dropbox, dragClass);
            }
            processFileList(e, e.dataTransfer.files, instanceOptions);
        }

        function dragenter(e) {
            e.stopPropagation();
            e.preventDefault();
            if (dragClass) {
                addClass(dropbox, dragClass);
            }
        }

        function dragleave(e) {
            if (dragClass) {
                removeClass(dropbox, dragClass);
            }
        }

        function dragover(e) {
            e.stopPropagation();
            e.preventDefault();
            if (dragClass) {
                addClass(dropbox, dragClass);
            }
        }
    }

    // setupCustomFileProperties: modify the file object with extra properties
    function setupCustomFileProperties(files, groupID) {
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            file.extra = {
                nameNoExtension: file.name.substring(0, file.name.lastIndexOf('.')),
                extension: file.name.substring(file.name.lastIndexOf('.') + 1),
                fileID: i,
                uniqueID: getUniqueID(),
                groupID: groupID,
                prettySize: prettySize(file.size)
            };
        }
    }

    // getReadAsMethod: return method name for 'readAs*' - http://www.w3.org/TR/FileAPI/#reading-a-file
    function getReadAsMethod(type, readAsMap, readAsDefault) {
        for (var r in readAsMap) {
            if (type.match(new RegExp(r))) {
                return 'readAs' + readAsMap[r];
            }
        }
        return 'readAs' + readAsDefault;
    }

    // processFileList: read the files with FileReader, send off custom events.
    function processFileList(e, files, opts) {

        var filesLeft = files.length;
        var group = {
            groupID: getGroupID(),
            files: files,
            started: new Date()
        };

        function groupEnd() {
            group.ended = new Date();
            opts.on.groupend(group);
        }

        function groupFileDone() {
            if (--filesLeft === 0) {
                groupEnd();
            }
        }

        FileReaderJS.output.push(group);
        setupCustomFileProperties(files, group.groupID);

        opts.on.groupstart(group);

        // No files in group - end immediately
        if (!files.length) {
            groupEnd();
            return;
        }

        var supportsSync = sync && FileReaderSyncSupport;
        var syncWorker;

        // Only initialize the synchronous worker if the option is enabled - to prevent the overhead
        if (supportsSync) {
            syncWorker = makeWorker(workerScript);
            syncWorker.onmessage = function (e) {
                var file = e.data.file;
                var result = e.data.result;

                // Workers seem to lose the custom property on the file object.
                if (!file.extra) {
                    file.extra = e.data.extra;
                }

                file.extra.ended = new Date();

                // Call error or load event depending on success of the read from the worker.
                opts.on[result === "error" ? "error" : "load"]({
                    target: {
                        result: result
                    }
                }, file);
                groupFileDone();
            };
        }

        Array.prototype.forEach.call(files, function (file) {

            file.extra.started = new Date();

            if (opts.accept && !file.type.match(new RegExp(opts.accept))) {
                opts.on.skip(file);
                groupFileDone();
                return;
            }

            if (opts.on.beforestart(file) === false) {
                opts.on.skip(file);
                groupFileDone();
                return;
            }

            var readAs = getReadAsMethod(file.type, opts.readAsMap, opts.readAsDefault);

            if (syncWorker) {
                syncWorker.postMessage({
                    file: file,
                    extra: file.extra,
                    readAs: readAs
                });
            } else {

                var reader = new FileReader();
                reader.originalEvent = e;

                fileReaderEvents.forEach(function (eventName) {
                    reader['on' + eventName] = function (e) {
                        if (eventName == 'load' || eventName == 'error') {
                            file.extra.ended = new Date();
                        }
                        opts.on[eventName](e, file);
                        if (eventName == 'loadend') {
                            groupFileDone();
                        }
                    };
                });
                reader[readAs](file);
            }
        });
    }

    // checkFileReaderSyncSupport: Create a temporary worker and see if FileReaderSync exists
    function checkFileReaderSyncSupport() {
        var worker = makeWorker(syncDetectionScript);
        if (worker) {
            worker.onmessage = function (e) {
                FileReaderSyncSupport = e.data;
            };
            worker.postMessage({});
        }
    }

    // noop: do nothing
    function noop() {

    }

    // extend: used to make deep copies of options object
    function extend(destination, source) {
        for (var property in source) {
            if (source[property] && source[property].constructor &&
                source[property].constructor === Object) {
                destination[property] = destination[property] || {};
                arguments.callee(destination[property], source[property]);
            } else {
                destination[property] = source[property];
            }
        }
        return destination;
    }

    // hasClass: does an element have the css class?
    function hasClass(el, name) {
        return new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)").test(el.className);
    }

    // addClass: add the css class for the element.
    function addClass(el, name) {
        if (!hasClass(el, name)) {
            el.className = el.className ? [el.className, name].join(' ') : name;
        }
    }

    // removeClass: remove the css class from the element.
    function removeClass(el, name) {
        if (hasClass(el, name)) {
            var c = el.className;
            el.className = c.replace(new RegExp("(?:^|\\s+)" + name + "(?:\\s+|$)", "g"), " ").replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        }
    }

    // prettySize: convert bytes to a more readable string.
    function prettySize(bytes) {
        var s = ['bytes', 'kb', 'MB', 'GB', 'TB', 'PB'];
        var e = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
    }

    // getGroupID: generate a unique int ID for groups.
    var getGroupID = (function (id) {
        return function () {
            return id++;
        };
    })(0);

    // getUniqueID: generate a unique int ID for files
    var getUniqueID = (function (id) {
        return function () {
            return id++;
        };
    })(0);

    // The interface is supported, bind the FileReaderJS callbacks
    FileReaderJS.enabled = true;

})(window, document);

},{}]},{},[3,2]);
