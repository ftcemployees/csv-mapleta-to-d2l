/*jslint plusplus: true, browser: true, devel: true */
/*global FileReaderJS, csvMapleTAToD2L, download*/

(function () {
    "use strict";

    var fileInfo, colLength, parseCol, colNames, options;

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

    function onLoadFileEnd(e, file) {
        console.log(e.target.result);
        console.log(file);
        fileInfo = {
            text: e.target.result,
            name: file.name,
            nameNoExtention: file.extra.nameNoExtension,
            mimeType: file.type
        };

        try {
            parseCol = csvMapleTAToD2L.parse(e.target.result);
        } catch (er) {
            displayErr(er.message);
        }

        colNames = csvMapleTAToD2L.getGradeColNames(parseCol);

        var columnNameContainer = document.querySelector("#columnNameContainer"),
            table = document.createElement("table"),
            row,
            cell,
            i,
            labelContainer,
            label1,
            label2,
            label1TextNode,
            assignmentNameInput,
            label2TextNode,
            outOfInput,
            checkBox;

        columnNameContainer.innerHTML = '';

        colLength = colNames.length;

        // Heading Cells 'Blank Cell', 'Bright Space Name', 'Points Possible'
        row = document.createElement("tr");
        cell = document.createElement("th");
        row.appendChild(cell);

        cell = document.createElement("th");
        cell.innerHTML = "Bright Space Name";
        row.appendChild(cell);

        cell = document.createElement("th");
        cell.innerHTML = "Points Possible";
        row.appendChild(cell);

        cell = document.createElement("th");
        cell.innerHTML = "Include?";
        row.appendChild(cell);

        table.appendChild(row);

        /*Dynamically create inputs for each
        gradable column on the CSV import*/
        for (i = 0; i < colLength; i++) {
            // Name of assignment
            row = document.createElement("tr");
            cell = document.createElement("th");
            cell.innerHTML = colNames[i];
            row.appendChild(cell);

            // Input for brightspace name
            assignmentNameInput = document.createElement("input");
            assignmentNameInput.id = "assignmentName";
            assignmentNameInput.type = "text";
            assignmentNameInput.className = "columnIDLabel1" + [i];
            //assignmentNameInput.oninput = showGo;

            cell = document.createElement("td");
            cell.appendChild(assignmentNameInput);
            row.appendChild(cell);

            // Input for points possible
            outOfInput = document.createElement("input");
            outOfInput.id = "outOf";
            outOfInput.type = "number";
            outOfInput.className = "columnIDLabel2" + [i];
            //outOfInput.oninput = showGo;

            cell = document.createElement("td");
            cell.appendChild(outOfInput);
            row.appendChild(cell);

            // Input for including the grade item
            checkBox = document.createElement("input");
            checkBox.type = "checkbox";
            checkBox.checked = true;

            cell = document.createElement("td");
            cell.appendChild(checkBox);
            row.appendChild(cell);

            // Append the row to the table
            table.appendChild(row);
        }

        //add in the table guts
        columnNameContainer.appendChild(table);
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

        var converted, time, date,
            arrExport;

        date = new Date();
        time = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() + '_' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        console.log("time:", time);

        //set the global values
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
