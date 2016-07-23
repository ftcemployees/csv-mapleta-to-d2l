/*jslint plusplus: true, browser: true, devel: true */
/*global FileReaderJS, csvMapleTAToD2L, download*/
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

                var parseCol = csvMapleTAToD2L.parse(e.target.result),
                    colNames = csvMapleTAToD2L.getGradeColNames(parseCol),
                    columnNameContainer = document.querySelector("#columnNameContainer");

                console.log(colNames);

                for (var i = 0; i < colNames.length; i++) {
                    var labelContainer = document.createElement("div"),
                        label1 = document.createElement("label"),
                        label2 = document.createElement("label"),
                        label1TextNode = document.createTextNode("Insert the D2L grade column name for " + colNames[i]),
                        assignmentNameInput = document.createElement("input"),
                        label2TextNode = document.createTextNode("Insert the total amount of points for " + colNames[i]),
                        outOfInput = document.createElement("input");


                    assignmentNameInput.id = "assignmentName";
                    assignmentNameInput.type = "text";
                    assignmentNameInput.className = "columnIDLabel1" + [i];
                    assignmentNameInput.oninput = showGo;

                    outOfInput.id = "outOf";
                    outOfInput.type = "number";
                    outOfInput.className = "columnIDLabel2" + [i];
                    outOfInput.oninput = showGo;

                    label1.appendChild(label1TextNode);
                    label1.appendChild(assignmentNameInput);

                    label2.appendChild(label2TextNode);
                    label2.appendChild(outOfInput);

                    labelContainer.appendChild(label1);
                    labelContainer.appendChild(label2);
                    labelContainer.id = "labelID" + [i];

                    columnNameContainer.appendChild(labelContainer);
                }

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

    //Go button click logic
    document.querySelector('button').onclick = function () {
        var converted, time, date;
        date = new Date();
        time = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '_' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        console.log("time:", time);

        //set the global values
        getOptions();

        //run the code
        console.log("fileInfo.text:", fileInfo.text);
        converted = csvMapleTAToD2L(fileInfo.text, assignmentNameText, outOf);
        download(converted, "converted_" + fileInfo.nameNoExtention + '_' + time + '.csv', fileInfo.mimeType);
    };

}());
