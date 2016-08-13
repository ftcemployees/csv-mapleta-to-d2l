/*jslint plusplus: true, browser:true, node: true, devel: true */
/*global FileReaderJS, csvMapleTAToD2L, download*/

(function () {
    "use strict";

    var fileInfo, parseCol, options;

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
