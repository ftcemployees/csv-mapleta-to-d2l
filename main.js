/*jslint plusplus: true, browser: true, devel: true */
/*global FileReaderJS, csvMapleTAtoD2L*/
var fileInfo, assignmentNameText, outOf;

(function () {
   "use strict";
   var options = {
      readAsDefault: "Text",
      dragClass: "dropping",
      on: {
         loadend: function (e, file) {
            console.log(e.target.result);
            console.log(file);
            fileInfo = {
               text: e.target.result,
               name: file.name,
               nameNoExtention: file.extra.nameNoExtension,
               mimeType: file.type
            };
            document.querySelector('#options').classList.add('on');
            document.querySelector('#filename').innerHTML = fileInfo.name;
         }
      }
   };
   //add file listeners
   FileReaderJS.setupInput(document.querySelector('#file input'), options);
   FileReaderJS.setupDrop(document.querySelector('#drop'), options);

   function getOptions() {
      assignmentNameText = document.querySelector('#assignmentName').value;
      outOf = parseInt(document.querySelector('#outOf').value, 10);
   }

   function optionsAreOK() {
      return assignmentNameText.length > 0 && !isNaN(outOf);
   }

   function showGo() {
      var classList = document.querySelector('#go').classList;
      getOptions();
      if (optionsAreOK()) {
         console.log('on');
         classList.add('on');
      } else {
         console.log('off');
         classList.remove('on');
      }
   }
   //onchange Logic
   document.querySelector('#assignmentName').addEventListener('input', showGo);
   document.querySelector('#outOf').addEventListener('input', showGo);
   //Go button click logic
   document.querySelector('button').addEventListener('click', function () {
      var converted, time, date;
      date = new Date();
      time = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '_' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
      console.log("time:", time);
      //set the global values
      getOptions();
      //run the code
      console.log("fileInfo.text:", fileInfo.text);
      converted = csvMapleTAtoD2L(fileInfo.text, assignmentNameText, outOf);
      download(converted, "converted_" + fileInfo.nameNoExtention + '_' + time + '.csv', fileInfo.mimeType);
   });

}())
