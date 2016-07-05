/*jslint plusplus: true, node: true */
/*global d3:true*/
"use strict";
var CSVMapleTAtoD2L = (function () {

   var parseCsv, makeCsv, d3,
      inNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

   /************** SETUP *****************/

   //for node testing
   if (inNode) {
      d3 = require('d3-dsv');
   } else {
      d3 = window.d3;
   }

   parseCsv = d3.csvParse;
   makeCsv = d3.csvFormat;


   /************** FUNCTION *****************/
   function CSVMapleTAtoD2L(csvText, d2lGradeName, d2lGradeTotalPossible) {
      var csv, converted;

      csv = parseCsv(csvText, function (row) {
         console.log("row:", row);
         var tempObj = {
            "OrgDefinedId": row['Student ID'],
            "Username": row.Login,
            "End-of-Line Indicator": "#"
         };

         //add the grade
         tempObj[d2lGradeName + ' Points Grade'] = (parseInt(row.Total, 10) / 100 * d2lGradeTotalPossible).toFixed(2);

         return tempObj;
      });

      //back to csv text with the columns we want
      converted = makeCsv(csv, ["OrgDefinedId", "Username", d2lGradeName + ' Points Grade', "End-of-Line Indicator"]);

      console.log("csv:", csv);
      console.log("converted:", converted);

      return converted;
   }


   /************** RETURN *****************/
   //for node testing
   if (inNode) {
      module.exports = CSVMapleTAtoD2L;
   }

   //for Broswer
   return CSVMapleTAtoD2L;
}());
