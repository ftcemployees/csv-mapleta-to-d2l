/*jslint plusplus: true, browser:true, node: true, devel: true */
/*global FileReaderJS, csvMapleTAToD2L, download*/

(function () {
    "use strict";

    var csvMapleTAToD2L = require('./csvMapleTAToD2L.js'),
        download = require('./thirdParty/download.js'),
        filereaderFAKE = require('./thirdParty/filereader.js'),
        FileReaderJS = window.FileReaderJS;

    //filereaderFAKE is fake because filereader.js adds FileReaderJS to window
    //its so it is included in the correct order with browserify

    /***************************************************/
    /****************** ERROR CHECKING *****************/
    /***************************************************/
    function ordinalNumber(numIn) {
        var onesPlace = numIn % 10,
            endings = ['th', 'st', 'nd', 'rd'],
            ending;
        if (onesPlace < 4) {
            ending = endings[onesPlace];
        } else {
            ending = endings[0];
        }

        return numIn + ending;
    }

    function displayErr(errors) {
        var errorPara = document.querySelector("#errorMessage"),
            errorMessage;

        errorPara.innerHTML = "";

        if (typeof errors === "string") {
            errorMessage = errors.replace(/\n/g, '<br/>');
        } else {
            errorMessage = errors.join('<br/>');
        }
        console.log("Error:\n", errorMessage);
        errorPara.innerHTML = errorMessage;
        errorPara.style.opacity = 1;
        window.setTimeout(function () {
            errorPara.style.opacity = 0;
        }, 5000);
    }

    /*Validate the inputs*/
    function validateGo() {
        var checkBoxes = document.querySelectorAll('td input[type="checkbox"]'),
            selects = document.querySelectorAll('select'),
            index,
            errorMessages = [],
            atLeastOneChecked = false;

        for (index = 0; index < checkBoxes.length; ++index) {
            //check if at least one is checked
            if (checkBoxes[index].checked === true) {
                atLeastOneChecked = true;
                //make sure it has something selected 
                if (selects[index].getAttribute('data-wasselectedindex') === '0') {
                    errorMessages.push('The ' + ordinalNumber(index + 1) + ' row is checked to be included but a Brightspace Grade Item is not selected.');
                }
            }
        }

        if (!atLeastOneChecked) {
            errorMessages.push('At least one grade item must be included.');
        }

        if (errorMessages.length !== 0) {
            throw new Error(errorMessages.join('\n'));
        }

    }

    function getOptions(gradeItems) {
        var i, objExport, row, queryString, selectedIndex,
            arrExport = [],
            table = document.getElementsByTagName("table")[0],
            length = document.querySelectorAll("table tr").length;

        for (i = 2; i <= length; i++) {
            row = document.querySelector("table tr:nth-child(" + i + ")");
            if (row.querySelectorAll('[type="checkbox"]:checked').length > 0) {
                //minus 1 becuause the 0 index is the option with a dash and gradeItems doen't have that
                selectedIndex = parseInt(row.querySelector("select").getAttribute('data-wasselectedindex'), 10) - 1;
                objExport = {
                    nameOld: row.querySelector("th").innerHTML,
                    nameNew: gradeItems[selectedIndex].name,
                    pointsPossible: gradeItems[selectedIndex].maxPoints
                };

                arrExport.push(objExport);
            }
        }

        return arrExport;
    }

    function makeTheTable(fileInfo, gradeItems) {
        var columnNameContainer = document.querySelector("#columnNameContainer"),
            table = document.createElement("table"),
            row,
            i;

        function addThingInCellToRow(thingToAdd, cellType, row) {
            var cell = document.createElement(cellType);
            cell.appendChild(thingToAdd);
            row.appendChild(cell);
        }

        function addTh(row, text) {
            var thingToAdd = document.createTextNode(text);
            addThingInCellToRow(thingToAdd, 'th', row);
        }

        function addTd(row, text) {
            var thingToAdd = document.createTextNode(text);
            addThingInCellToRow(thingToAdd, 'td', row);
        }

        function addTextInputCell(row) {
            var thingToAdd = document.createElement('input');
            thingToAdd.type = "text";

            addThingInCellToRow(thingToAdd, 'td', row);
        }

        function addCheckboxCell(row) {
            var thingToAdd = document.createElement('input');
            thingToAdd.type = "checkbox";
            //thingToAdd.checked = true;

            addThingInCellToRow(thingToAdd, 'td', row);
        }

        function addSelectAllCheckboxHeading(row, text) {
            var checkBox = document.createElement('input'),
                cell = document.createElement('th'),
                span = document.createElement('span'),
                textEl = document.createTextNode(text);

            checkBox.type = "checkbox";
            checkBox.addEventListener('change', function (e) {
                var rowBoxes = document.querySelectorAll('table td [type="checkbox"]'),
                    i;

                //check or uncheck the boxes as nessicary
                for (i = 0; i < rowBoxes.length; ++i) {
                    rowBoxes[i].checked = this.checked;
                }
            });

            span.appendChild(document.createTextNode('check all '));
            span.appendChild(checkBox);
            cell.appendChild(textEl);
            cell.appendChild(span);
            row.appendChild(cell);
        }

        function makeSelectsUnique(e) {
            var i,
                select = e.target,
                selectIndex = parseInt(select.getAttribute('data-rowindex'), 10),
                oldValue = parseInt(select.getAttribute('data-wasselectedindex'), 10),
                value = parseInt(select.value, 10),
                valueText = select[value].innerHTML,
                selects = document.querySelectorAll('table select');

            //console.log("selectIndex:", selectIndex);
            //console.log("oldValue:", oldValue);
            //console.log("value:", value);
            //fix the other selects
            for (i = 0; i < selects.length; ++i) {
                if (i !== selectIndex) {
                    //enable old val
                    selects[i][oldValue].removeAttribute('disabled');
                    //disable new val
                    if (value !== 0) {
                        selects[i][value].setAttribute('disabled', 'true');
                    }
                }
            }

            //save the new oldval
            select.setAttribute('data-wasselectedindex', value);

            //update the column to the right
            //document.querySelector('tr:nth-child(' + (selectIndex + 2) + ') td:nth-child(3)').innerHTML = valueText;
        }

        function addSelect(row, index) {
            var thingToAdd = document.createElement('select'),
                option = document.createElement('option');
            //need a blank at top
            option.appendChild(document.createTextNode('-'));
            option.setAttribute('value', '0');
            thingToAdd.appendChild(option);

            gradeItems.forEach(function (item, i) {
                option = document.createElement('option');
                option.appendChild(document.createTextNode(item.name + ': ' + item.maxPoints + 'p'));
                option.setAttribute('value', i + 1);
                thingToAdd.appendChild(option);
            });
            //record the current settings
            thingToAdd.setAttribute('data-rowindex', i);
            thingToAdd.setAttribute('data-wasselectedindex', 0);
            //add the change callback
            thingToAdd.addEventListener('change', makeSelectsUnique);

            //put it in the cell
            addThingInCellToRow(thingToAdd, 'td', row);
        }

        /************************ MAKE THE TABLE *****************************/
        //clean out the container
        columnNameContainer.innerHTML = '';

        row = document.createElement("tr");

        // Heading Cells
        addTh(row, "");
        addTh(row, "Brightspace Grade Item");
        //addTh(row, "Points Possible");
        //addTh(row, "Include in CSV out");
        addSelectAllCheckboxHeading(row, "Include in CSV?");

        table.appendChild(row);

        /*Dynamically create inputs for each gradable column on the CSV import*/
        for (i = 0; i < fileInfo.colNames.length; i++) {
            // Name of assignment
            row = document.createElement("tr");
            addTh(row, fileInfo.colNames[i]);

            // Input for brightspace name
            addSelect(row, i);

            // points possible
            //addTextInputCell(row);
            //addTd(row, '-');

            // Input for including the grade item
            addCheckboxCell(row);

            // Append the row to the table
            table.appendChild(row);
        }

        //add in the table guts
        columnNameContainer.appendChild(table);

    }

    function runAfterValence(gradeItems) {
        var fileInfo,
            parseCol,
            options;

        function onLoadFileEnd(e, file) {

            console.log("MapleTA CSV File In Text:\n", e.target.result);
            //console.log("MapleTA file info:", file);

            //parse the csv
            try {
                parseCol = csvMapleTAToD2L.parse(e.target.result);
            } catch (er) {
                //debugger;
                displayErr(er.message);
            }

            fileInfo = {
                text: e.target.result,
                name: file.name,
                nameNoExtention: file.extra.nameNoExtension,
                mimeType: file.type,
                colNames: csvMapleTAToD2L.getGradeColNames(parseCol)
            };

            makeTheTable(fileInfo, gradeItems);

            //add in the file name so the user can see what file they picked
            document.querySelector('#filename').innerHTML = "Filename: " + fileInfo.name;

            //show the rest of the ui
            document.querySelector('#options').classList.add('on');
        }
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
                return time;
            }

            var converted,
                arrExport,
                time = makeTime();

            try {
                validateGo();
                arrExport = getOptions(gradeItems);
                console.log('Options From Ui:\n', arrExport);

                //run the code
                console.log("File Convertion Stats:\n", fileInfo);
                converted = csvMapleTAToD2L.convert(parseCol, arrExport);

                console.log("CSV File Out Converted:\n", converted);
                download(converted, "converted_" + fileInfo.nameNoExtention + '_' + time + '.csv', fileInfo.mimeType);
            } catch (e) {
                displayErr(e.message);
                //debugger;
            }
        };
    }

    function getAssignments() {
        var jquery = require('jquery'),
            classId,
            gradeItems,
            useValence = false;

        function filterAndConvert(saveList, gradeItem) {
            if (gradeItem.GradeType === 'Numeric') {
                saveList.push(Object.freeze({
                    name: gradeItem.Name,
                    maxPoints: gradeItem.MaxPoints,
                    shortName: gradeItem.ShortName
                }));
            }
            return saveList;
        }

        function callback(error, data) {
            if (error) {
                console.log("Valence error:\n", error);
                console.log("Error Data?:\n", data);
                return;
            }

            gradeItems = data.reduce(filterAndConvert, []);

            //don't want to mess it up later
            Object.freeze(gradeItems);

            //console.log("gradeItemsData:", data);
            console.log("Grade Items From D2L:\n", gradeItems);
            runAfterValence(gradeItems);
        }

        if (useValence) {
            classId = window.location.search.match(/ou=(\d+)/)[1];
            //make the call
            jquery.ajax('/d2l/api/le/1.14/' + classId + '/grades/', {
                method: 'GET',
                headers: {
                    'X-Csrf-Token': localStorage['XSRF.Token']
                },
                success: function (data) {
                    callback(null, data);
                },
                error: function (jqXHR, errString, e) {
                    callback(errString, e);
                }
            });
        } else {
            callback(null, require('./gradeItems.js'));
            console.log('Not Using Valence.');
        }

    }

    /***************************************************/
    /********************** START **********************/
    /***************************************************/
    getAssignments();
}());
