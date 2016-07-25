/*jslint plusplus: true, browser: true, devel: true */
/*global FileReaderJS, csvMapleTAToD2L, download*/
var fileInfo, assignmentNameText, outOf, colLength, parseCol, colNames;

(function () {

    "use strict";

    /*Validate the inputs*/
    function validateGo() {
        assignmentNameText = document.querySelectorAll('#assignmentName');
        outOf = document.querySelectorAll('#outOf');

        var pass = true,
            i;

        for (i = 0; i < assignmentNameText.length; i++) {
            if (assignmentNameText[i].value === "" && outOf[i].value === "") {
                pass = false;
            }
        }

        return pass;
    }

    /*Show to next part of the form*/
    function showGo() {
        var classList = document.querySelector('#go').classList;
        console.log(validateGo());
        if (validateGo()) {
            console.log('on');
            classList.add('on');
        } else {
            console.log('off');
            classList.remove('on');
        }
    }

    /*Load all the options for the conversion Brightspace CSV gradesheet.*/
    function getOptions() {
        var arrExport = [],
            i,
            objExport;

        for (i = 0; i < assignmentNameText.length; i++) {

            objExport = {
                nameOld: colNames[i],
                nameNew: assignmentNameText[i].value,
                pointsPossible: +outOf[i].value
            };

            arrExport.push(objExport);
        }

        return arrExport;
    }

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

                parseCol = csvMapleTAToD2L.parse(e.target.result);
                colNames = csvMapleTAToD2L.getGradeColNames(parseCol);

                var columnNameContainer = document.querySelector("#columnNameContainer"),
                    i,
                    labelContainer,
                    label1,
                    label2,
                    label1TextNode,
                    assignmentNameInput,
                    label2TextNode,
                    outOfInput;

                colLength = colNames.length;

                /*Dynamically create inputs for each
                gradable column on the CSV import*/
                for (i = 0; i < colLength; i++) {
                    labelContainer = document.createElement("div");
                    label1 = document.createElement("label");
                    label2 = document.createElement("label");
                    label1TextNode = document.createTextNode("What is the Brightspace column name for " + colNames[i] + "?");
                    assignmentNameInput = document.createElement("input");
                    label2TextNode = document.createTextNode("What is the total amount of points possible for column " + colNames[i] + "?");
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

    //Go button click logic
    document.querySelector('button').onclick = function () {

        var converted, time, date,
            arrExport;

        date = new Date();
        time = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '_' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        console.log("time:", time);

        //set the global values
        if (validateGo()) {
            arrExport = getOptions();

            //run the code
            console.log("fileInfo.text:", fileInfo.text);
            converted = csvMapleTAToD2L.convert(parseCol, arrExport);
            download(converted, "converted_" + fileInfo.nameNoExtention + '_' + time + '.csv', fileInfo.mimeType);

        } else {
            console.error("Must fill in all inputs!");
        }

    };

}());
