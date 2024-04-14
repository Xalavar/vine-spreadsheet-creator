import * as pdfjsLib from "pdfjs-dist";
import {text} from "react-table/src/filterTypes";
import ExcelJS from 'exceljs';
import {columnIndexToLetter, DataTypes, IndividualColumns} from "./UniversalItems";
import JSZip from "jszip";
import Papa from 'papaparse';
import {PerformDbOperation} from "./IndexedDB_Functions";
import {checkSettingsTree} from "./SettingsTreeFunctions";

/**
 * All horizontal translations of parseable data for Itemized Reports generated for 2022 and earlier.
 *
 * orderStatusDate is Title Transfer Date.
 *
 * The only reason I'm not calling it Title Transfer Date is because the latter is only ever used in older PDFs.
 * Plus, its only use is determining when an order was REMOVED or CANCELLED.
 * @type {{"38": string, "445.94": string, "126.91": string, "519.16": string, "372.72": string}}
 */
const OldItemPositions = {
    '38': 'asin',
    '126.91': 'name',
    '372.72': 'orderDate',
    '445.94': 'orderStatusDate', // "Title Transfer Date"
    '519.16': 'etv'
}

/**
 * All horizontal translations of parseable data for Itemized Reports generated for 2023 and later
 *
 * Uses index 5 instead of 4.
 *
 * orderStatusDate is Cancelled Date. The reason is that this is used to determine when an order was REMOVED or CANCELLED.
 * @type {{"746.4": string, "592.4": string, "138.1": string, "38": string, "423": string, "669.4": string, "230.5": string, "515.4": string}}
 */
const NewItemPositions = {
    '38': 'orderID',
    '138.1': 'asin',
    '230.5': 'name',
    '423': 'orderStatus',
    '515.4': 'orderDate',
    '592.4': 'dateShipped',
    '669.4': 'orderStatusDate', // "Cancelled Date"
    '746.4': 'etv'
}

const errorMessages = {
    'NoDataFound': { 'shortMsg': 'No Vine data found.', 'longMsg': 'You likely imported a file with no discernible Vine data. Remember only to import Itemized Reports that you downloaded from your Vine Account tab.' },
    'InvalidPDFException': { 'shortMsg': 'Corrupted or invalid PDF.', 'longMsg': 'This PDF is either corrupted or contains broken data that cannot be parsed. The only supported PDFs are Itemized Reports.' },
    'InvalidFileType': { 'shortMsg': 'Invalid or unsupported file type.', 'longMsg': 'Email and spreadsheets are not supported yet. The only currently supported filetypes are: PDFs.' }
}

/**
 * The sheet name for the Orders sheet
 * @type {string}
 */
const mainSheet = 'My Sheet';

// Set worker source URL for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

function convertDateString(dateString) {
    // Parse date string in the format "MMM D, YYYY" (e.g., "Jan 1, 2024")
    const match1 = dateString.match(/^(\w{3}) (\d{1,2}), (\d{4})$/);
    if (match1) {
        const [, monthStr, dayStr, yearStr] = match1;
        const month = new Date(Date.parse(`${monthStr} 1, 2000`)).getMonth() + 1; // Convert month abbreviation to number
        const day = parseInt(dayStr);
        const year = parseInt(yearStr);
        return new Date(year, month - 1, day).getTime(); // Months are zero-based in JavaScript Date object
    }

    // Parse date string in the format "MM/DD/YYYY" (e.g., "09/03/2024")
    const match2 = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match2) {
        const [, monthStr, dayStr, yearStr] = match2;
        const month = parseInt(monthStr);
        const day = parseInt(dayStr);
        const year = parseInt(yearStr);
        return new Date(year, month - 1, day).getTime(); // Months are zero-based in JavaScript Date object
    }

    return null; // Return null if the date string does not match any supported format
}

/**
 * Converts a unix/epoch timestamp to a proper date with the correct timezone offset
 * @param unix
 * @returns {Date}
 */
function convertUnixToDate(unix) {
    const dateWithOffset = (new Date(unix).getTimezoneOffset() * 60 * 1000);
    const finalDate = new Date(unix - dateWithOffset)
    return finalDate;
}

async function extractDataFromFile(buffer, fileType) {

    const isSpreadsheet = /(xlsx|officedocument\.spreadsheet)/.test(fileType);

    if (/pdf/.test(fileType)) {
        return pdfHandler(buffer);
    } else if (/(xlsx|officedocument\.spreadsheet)/.test(fileType)) {
        console.log('This is a spreadsheet')
        await spreadsheetHandler(buffer);
    } else if (/(csv)/.test(fileType)) {
        console.log('This is a CSV')
        const test = await csvHandler(buffer);
        console.log(test);
    } else {
        return Promise.reject(errorMessages.InvalidFileType);
    }
    /*
    switch (fileType) {
        case 'application/pdf':
            return pdfHandler(buffer);
        case isSpreadsheet://'application/xlsx':
            return spreadsheetHandler(buffer);
            //return parseSpreadsheet(buffer);

        case 'application/zip':
            return parseEmails(buffer);
        default:
            return Promise.reject(errorMessages.InvalidFileType);
    }*/

}

// -- PDF extraction --
/**
 * Handles all Itemized Report PDFs, both the old version and the new one.
 * @param buffer
 * @returns {Promise<unknown>}
 */
function pdfHandler(buffer) {
    return new Promise((resolve, reject) => {
        // -- Load the PDF using PDF.js --
        pdfjsLib.getDocument(buffer).promise.then(function (pdf) {
            // Initialize array to store extracted text objects
            const extractedText = [];

            // Iterate through each page of the PDF
            const numPages = pdf.numPages;
            const promises = [];
            for (let i = 1; i <= numPages; i++) {
                // Retrieve text content of each page
                promises.push(pdf.getPage(i).then(function (page) {
                    return page.getTextContent();
                }));
            }

            // Resolve all promises once text content of all pages is retrieved
            Promise.all(promises).then(function (textContents) {

                let tried2023Method = false;

                textContents.forEach(function (content) {

                    // Initialize object to store extracted text for this page
                    let textObject = {};
                    let previousXTranslation;
                    let counter = 0;

                    function createObjectFromRow(item, transformIndex, prodNameIndex) {

                        const horizontalTranslation = item.transform[transformIndex];
                        const formalName = (transformIndex === 4) ? OldItemPositions[horizontalTranslation.toString()] : NewItemPositions[horizontalTranslation.toString()];
                        // The 2023 pdf has a weird issue where it just ignores the last row of a page
                        const translationIndexMatches = (transformIndex === 4) ? [38].includes(horizontalTranslation) : [38, 546.66].includes(horizontalTranslation);

                        //console.log(defaultConfig);

                        if (counter > 3 && translationIndexMatches && Object.entries(textObject).length > 0) {
                            // We're at the beginning again, so time to create a new object to export
                            counter = 0;
                            // Add text object for this page to the extractedText array
                            extractedText.push(textObject);
                            //console.log('Finished: ', textObject);
                            textObject = {};
                        } else {
                            //console.log('Not finished: ', textObject);
                            //console.log('Horizontal translation: ', horizontalTranslation);
                        }

                        if (formalName) {

                            // Check if the current formal name matches the previous one
                            if (previousXTranslation === horizontalTranslation && horizontalTranslation === prodNameIndex) {
                                // Add a space between the previous and current string (only for product name)
                                textObject[formalName] += ' ' + item.str;
                            } else if (previousXTranslation === horizontalTranslation) {
                                // Concatenate the previous and current string without a space
                                textObject[formalName] += '' + item.str;
                            } else {
                                // Add string to the corresponding key in the text object
                                textObject[formalName] = item.str;
                            }
                            previousXTranslation = horizontalTranslation;
                        }

                        counter++;

                    }

                    // Process each defaultConfig in the content
                    // This only gets lines of text
                    content.items.forEach(function (item, index, array) {
                        //console.log(defaultConfig);
                        createObjectFromRow(item, 4, 126.91);
                    });

                    if (textObject.length > 0) {
                        // Export the last object to the array
                        extractedText.push(textObject);
                    } else {
                        // Try the 2023 method
                        content.items.forEach(function (item, index, array) {
                            //console.log('Trying 2023 method');
                            createObjectFromRow(item, 5, 230.5);
                        });
                        if (textObject.length > 0) {
                            //console.log(textObject);
                            // Export the object to the array
                            extractedText.push(textObject);
                        }
                    }

                });

                if (extractedText.length > 0) {
                    // Resolve with the extracted text object
                    resolve(extractedText);
                } else {
                    // Otherwise return an error if nothing was extracted
                    reject(errorMessages.NoDataFound);
                }

            }).catch(function (error) {
                console.log('Error at text promises');
                reject(translateError(error));
            });
        }).catch(function (error) {
            console.log('Pdfjslib error.');
            reject(translateError(error));
        });
    });
}

function csvHandler(buffer) {

    return new Promise((resolve, reject) => {

        const test = Papa.parse(buffer, {
            header: true,
            transformHeader: header => {
                // Convert headers before they're turned into object key names

                // -- Compare against custom headers specified in settings

                // -- Compare against base regex
                if (header === 'OriginalHeaderName') {
                    return 'NewHeaderName';
                } else {
                    return header;
                }
            },
            complete: (results) => {
                resolve(results.data);
            }
        });
    })
}

function spreadsheetHandler(buffer) {
    return new Promise((resolve, reject) => {

        // Create a new workbook object
        const workbook = new ExcelJS.Workbook();

        // -- Load the spreadsheet using ExcelJS --
        workbook.xlsx.load(buffer).then(function (file) {
            // Get the first worksheet in the workbook
            const worksheet = workbook.getWorksheet(1); // Assuming it's the first worksheet

            // Define an array to store the parsed data
            const rowsData = [];

            // Iterate over each row in the worksheet
            worksheet.eachRow((row, rowNumber) => {
                // Define an object to store cell values for the current row
                const rowData = {};

                // Iterate over each cell in the row
                row.eachCell((cell, colNumber) => {
                    // Store the value of the cell in the rowData object
                    rowData[`Column${colNumber}`] = cell.value;
                });

                // Push the rowData object to the rowsData array
                rowsData.push(rowData);
            });

            console.log(rowsData)

            // Return the parsed data
            if (rowsData.length > 0) {
                // Resolve with the extracted text object
                resolve(rowsData);
            } else {
                // Otherwise return an error if nothing was extracted
                reject(errorMessages.NoDataFound);
            }


        }).catch(function (error) {
            console.log('ExcelJS error.');
            reject(translateError(error));
        });
    });
}

function addStatSheet(wb, years, dataTypeIndices) {
    const fb = false;

    let dataAsArray = [];
    let currYear = new Date().getFullYear();
    let t_gap = 4;
    // gap between tables


    // Add a worksheet
    const worksheet = wb.addWorksheet('Stats');
    /*
    // Create a new table with headers
    const temptable = worksheet.addTable({
        name: 'Stats1',
        ref: 'A2',
        headerRow: true,
        style: {
            theme: 'TableStyleMedium11', // Dark4 is just slathering the table in green
            showRowStripes: true,
        },
        columns: [
            { name: '$0', filterButton: fb },
            { name: '$0.01 - $100', filterButton: fb },
            { name: '$100+', filterButton: fb },
            { name: 'Cancelled', filterButton: fb },
            { name: 'Defective', filterButton: fb },
            { name: 'Other', filterButton: fb },
            { name: 'Daily', filterButton: fb },
            { name: 'Weekly', filterButton: fb },
            { name: 'Monthly', filterButton: fb }
        ],
        rows: dataAsArray
    });
*/

    /*
    function formulaeLoop(formula, expr1, expr2, expr3) {

    }
*/
    let cellFormula;

    //let etvTotalsRow = [];
    let monthRows = [];
    let weekdayRows = [];
    let hourRows = [];
    let etvRows = [];
    let etvCountRows = [];
    let totalEtvRows = [];
    let row = [];
    let c_Arr;
    let calcRowLength = 2;


    const odc = columnIndexToLetter(dataTypeIndices.indexOf('orderDate')+1); // "Order Date Column"
    const ec = columnIndexToLetter(dataTypeIndices.indexOf('etv')+1); // "ETV Column"
    const osc = columnIndexToLetter(dataTypeIndices.indexOf('orderStatus')+1); // "Order Status Column"

    /* Creating the tables by adding rows for each year */
    for (let y = currYear; y > 2006; y--) {
        // ascending order
        if (years.includes(y)) {
            // monthly
            row.push(y);
            // adds the first column with the year
            for (let i = 1; i < 13; i++) {
                cellFormula = (i === 12) ? `=COUNTIFS('${mainSheet}'!${odc}:${odc},">="&DATE(${y},${i},1),'${mainSheet}'!${odc}:${odc},"<"&DATE(${y + 1},1,1))` : `=COUNTIFS('${mainSheet}'!${odc}:${odc},">="&DATE(${y},${i},1),'${mainSheet}'!${odc}:${odc},"<"&DATE(${y},${i + 1},1))`;
                //cellFormula = `=COUNTIFS('${mainSheet}'!${odc}:${odc},">="&DATE(${y},${i},1),'${mainSheet}'!${odc}:${odc},"<="&DATE(${y},${i},31))`;

                row.push({
                    formula: cellFormula
                });
            }
            monthRows.push(row);
            row = [];
            // weekdays
            row.push(y);
            for (let i = 1; i < 8; i++) {
                cellFormula = `=SUMPRODUCT(('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))>=DATE(${y},1,1))*('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))<DATE(${y + 1},1,1))*(WEEKDAY('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc})),1)=${i}))`;
                //cellFormula = `=SUMPRODUCT(('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))>=DATE(${y},1,1))*('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))<=DATE(${y},12,31))*(WEEKDAY('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc})),1)=${d}))`;
                row.push({
                    formula: cellFormula
                });
            }
            weekdayRows.push(row);
            row = [];

            // by the hour
            row.push(y);
            for (let i = 0; i < 24; i++) {
                cellFormula = `=SUMPRODUCT(('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))>=DATE(${y},1,1))*('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))<DATE(${y + 1},1,1))*(HOUR('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc})))=${i}))`;
                //cellFormula = `=SUMPRODUCT(('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))>=DATE(${y},1,1))*('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))<=DATE(${y},12,31))*(WEEKDAY('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc})),1)=${d}))`;
                //cellFormula = `=SUMPRODUCT(('${mainSheet}'!${odc}2:${odc}>=DATE(2023,1,1))*('${mainSheet}'!${odc}2:${odc}<=DATE(2023,12,31))*(HOUR('${mainSheet}'!${odc}2:${odc})=1))`;
                row.push({
                    formula: cellFormula
                });
            }
            hourRows.push(row);
            row = [];

            // by etv range
            row.push(y);
            cellFormula = `=COUNTIFS('${mainSheet}'!${ec}:${ec},0,'${mainSheet}'!${odc}:${odc},">=1/1/${y}",'${mainSheet}'!${odc}:${odc},"<=12/31/${y}")`;
            row.push({
                formula: cellFormula
            });
            cellFormula = `=COUNTIFS('${mainSheet}'!${ec}:${ec},">=0.01",'${mainSheet}'!${ec}:${ec},"<=100",'${mainSheet}'!${odc}:${odc},">=1/1/${y}",'${mainSheet}'!${odc}:${odc},"<=12/31/${y}")`;
            row.push({
                formula: cellFormula
            });
            cellFormula = `=COUNTIFS('${mainSheet}'!${ec}:${ec},">100",'${mainSheet}'!${odc}:${odc},">=1/1/${y}",'${mainSheet}'!${odc}:${odc},"<=12/31/${y}")`;
            row.push({
                formula: cellFormula
            });

            etvRows.push(row);
            row = [];

            // ETV totals
            row.push(y);
            //cellFormula = `=COUNTIFS('${mainSheet}'!${osc}:${osc},"None",'${mainSheet}'!${odc}:${odc},">=1/1/${y}",'${mainSheet}'!${odc}:${odc},"<=12/31/${y}")`;
            cellFormula = `=SUMIFS('${mainSheet}'!${ec}:${ec}, '${mainSheet}'!${odc}:${odc}, ">=1/1/${y}", '${mainSheet}'!${odc}:${odc}, "<=12/31/${y}")`;
            row.push({
                formula: cellFormula
            });
            cellFormula = `=SUMIFS('${mainSheet}'!${ec}:${ec}, '${mainSheet}'!${osc}:${osc}, "Cancelled", '${mainSheet}'!${odc}:${odc}, ">=1/1/${y}", '${mainSheet}'!${odc}:${odc}, "<=12/31/${y}") * -1`;
            row.push({
                formula: cellFormula
            });
            cellFormula = `=SUMIFS('${mainSheet}'!${ec}:${ec}, '${mainSheet}'!${osc}:${osc}, "Defective", '${mainSheet}'!${odc}:${odc}, ">=1/1/${y}", '${mainSheet}'!${odc}:${odc}, "<=12/31/${y}") * -1`;
            row.push({
                formula: cellFormula
            });
            cellFormula = `=SUMIFS('${mainSheet}'!${ec}:${ec}, '${mainSheet}'!${osc}:${osc}, "<>*None", '${mainSheet}'!${osc}:${osc}, "<>*Cancelled", '${mainSheet}'!${osc}:${osc}, "<>*Defective", '${mainSheet}'!${odc}:${odc}, ">=1/1/${y}", '${mainSheet}'!${odc}:${odc}, "<=12/31/${y}") * -1`;
            row.push({
                formula: cellFormula
            });
            cellFormula = `=SUMIFS('${mainSheet}'!${ec}:${ec}, '${mainSheet}'!${osc}:${osc}, "None", '${mainSheet}'!${odc}:${odc}, ">=1/1/${y}", '${mainSheet}'!${odc}:${odc}, "<=12/31/${y}")`;
            row.push({
                formula: cellFormula
            });

            totalEtvRows.push(row);
            row = [];

            // Total items based on exclusion; i.e. # of cancelled, # of defective, etc.
            row.push(y);
            cellFormula = `=COUNTIFS('${mainSheet}'!${osc}:${osc},"None",'${mainSheet}'!${odc}:${odc},">=1/1/${y}",'${mainSheet}'!${odc}:${odc},"<=12/31/${y}")`;
            row.push({
                formula: cellFormula
            });
            cellFormula = `=COUNTIFS('${mainSheet}'!${osc}:${osc},"Cancelled",'${mainSheet}'!${odc}:${odc},">=1/1/${y}",'${mainSheet}'!${odc}:${odc},"<=12/31/${y}")`;
            row.push({
                formula: cellFormula
            });
            cellFormula = `=COUNTIFS('${mainSheet}'!${osc}:${osc},"Defective",'${mainSheet}'!${odc}:${odc},">=1/1/${y}",'${mainSheet}'!${odc}:${odc},"<=12/31/${y}")`;
            row.push({
                formula: cellFormula
            });
            cellFormula = `=COUNTIFS('${mainSheet}'!${osc}:${osc},"<>*None",'${mainSheet}'!${osc}:${osc},"<>*Cancelled",'${mainSheet}'!${osc}:${osc},"<>*Defective",'${mainSheet}'!${odc}:${odc},">=1/1/${y}",'${mainSheet}'!${odc}:${odc},"<=12/31/${y}")`;
            // accounts for anything else, like "Other" or a custom input
            row.push({
                formula: cellFormula
            });
            cellFormula = `=COUNTIFS('${mainSheet}'!${odc}:${odc},">=1/1/${y}",'${mainSheet}'!${odc}:${odc},"<=12/31/${y}")`;
            row.push({
                formula: cellFormula
            });

            etvCountRows.push(row);
            row = [];

            //`=SUMPRODUCT(('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))>=DATE(${y},1,1))*('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))<DATE(${y+1},1,1))*(HOUR('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc})))=None))`;
            /*for (let i=0; i<5; i++) {
                cellFormula = `=SUMPRODUCT(('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))>=DATE(${y},1,1))*('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))<DATE(${y+1},1,1))*(HOUR('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc})))=${i}))`;
                //cellFormula = `=SUMPRODUCT(('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))>=DATE(${y},1,1))*('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc}))<=DATE(${y},12,31))*(WEEKDAY('${mainSheet}'!${odc}2:INDEX('${mainSheet}'!${odc}:${odc},COUNTA('${mainSheet}'!${odc}:${odc})),1)=${d}))`;
                //cellFormula = `=SUMPRODUCT(('${mainSheet}'!${odc}2:${odc}>=DATE(2023,1,1))*('${mainSheet}'!${odc}2:${odc}<=DATE(2023,12,31))*(HOUR('${mainSheet}'!${odc}2:${odc})=1))`;
                row.push({ formula: cellFormula });
            }
            totalEtvRows.push(row);
            row = [];
*/

        }
    }

    function cFromN(n) {
        let columnName = '';
        const base = 26;

        while (n > 0) {
            const remainder = (n - 1) % base;
            columnName = String.fromCharCode(65 + remainder) + columnName;
            // 'A' corresponds to 65 in ASCII
            n = Math.floor((n - 1) / base);
        }

        return columnName;
    }

    // making titles for tables
    function t_title(sheet, c, r, title) {
        //const
        sheet.mergeCells(`B ${r}:${c}${r}`);
        sheet.getCell(`${c}${r}`).value = title;
        sheet.getCell(`${c}${r}`).font = {
            bold: true
        };
        sheet.getCell(`${c}${r}`).alignment = {
            horizontal: 'center'
        };
    }

    function c_addHeaders(c_List) {
        let columns = [{
            name: ' '
        }];

        for (let i = 0; i < c_List.length; i++) {
            columns.push({
                name: c_List[i],
                totalsRowFunction: 'sum'
            });
        }
        return columns;

    }

    //formulaeLoop(monthExpr
    /*

    worksheet.mergeCells('B1:N1');
    worksheet.getCell('N1').value = 'Number of Items Requested by Month';
    worksheet.getCell('N1').font = { bold: true };
    worksheet.getCell('N1').alignment = { horizontal: 'center' };
*/

    let c_Row = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
    c_Arr = c_addHeaders(c_Row);
    /*
    c_Arr = [
        { name: ' ' },
        { name: 'Jan', totalsRowFunction: 'sum' },
        { name: 'Feb', totalsRowFunction: 'sum' },
        { name: 'Mar', totalsRowFunction: 'sum' },
        { name: 'Apr', totalsRowFunction: 'sum' },
        { name: 'May', totalsRowFunction: 'sum' },
        { name: 'June', totalsRowFunction: 'sum' },
        { name: 'July', totalsRowFunction: 'sum' },
        { name: 'Aug', totalsRowFunction: 'sum' },
        { name: 'Sep', totalsRowFunction: 'sum' },
        { name: 'Oct', totalsRowFunction: 'sum' },
        { name: 'Nov', totalsRowFunction: 'sum' },
        { name: 'Dec', totalsRowFunction: 'sum' }
    ];

*/
    t_title(worksheet, cFromN(c_Arr.length + 1), 1, 'Number of Items Requested by Month');

    // Table with monthly item request stats
    const t_months = worksheet.addTable({
        name: 'MonthStats',
        ref: `B ${calcRowLength}`,
        headerRow: true,
        totalsRow: true,
        style: {
            theme: 'TableStyleMedium11',
            showFirstColumn: true
        },
        columns: c_Arr,
        rows: monthRows
    });

    calcRowLength += years.length + t_gap;

    /* Item count by day of week table */

    c_Row = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
    c_Arr = c_addHeaders(c_Row);
    /*
    c_Arr = [
        { name: ' ' },
        { name: 'Sun', totalsRowFunction: 'sum' },
        { name: 'Mon', totalsRowFunction: 'sum' },
        { name: 'Tues', totalsRowFunction: 'sum' },
        { name: 'Wed', totalsRowFunction: 'sum' },
        { name: 'Thur', totalsRowFunction: 'sum' },
        { name: 'Fri', totalsRowFunction: 'sum' },
        { name: 'Sat', totalsRowFunction: 'sum' }
    ];
*/
    t_title(worksheet, cFromN(c_Arr.length + 1), (calcRowLength - 1), 'Number of Items Requested by Weekday');

    const t_days = worksheet.addTable({
        name: 'DayStats',
        ref: `B ${calcRowLength}`,
        headerRow: true,
        totalsRow: true,
        style: {
            theme: 'TableStyleMedium11',
            showFirstColumn: true
        },
        columns: c_Arr,
        rows: weekdayRows
    });

    calcRowLength += years.length + t_gap;

    /* Item count by hour table */
    c_Arr = [{
        name: ' '
    }, {
        name: '12 AM',
        totalsRowFunction: 'sum'
    }];

    for (let i = 1; i < 24; i++) {
        (i < 12) ? c_Arr.push({
            name: `${i} AM`,
            totalsRowFunction: 'sum'
        }) : (i === 12) ? c_Arr.push({
            name: `${i} PM`,
            totalsRowFunction: 'sum'
        }) : c_Arr.push({
            name: `${i - 12} PM`,
            totalsRowFunction: 'sum'
        });
    }

    t_title(worksheet, cFromN(c_Arr.length + 1), (calcRowLength - 1), 'Number of Items Requested by Hour');

    const t_hours = worksheet.addTable({
        name: 'HourStats',
        ref: `B ${calcRowLength}`,
        headerRow: true,
        totalsRow: true,
        style: {
            theme: 'TableStyleMedium11',
            showFirstColumn: true
        },
        columns: c_Arr,
        rows: hourRows
    });

    calcRowLength += years.length + t_gap;

    /* Item count by ETV range */
    c_Arr = [{
        name: ' '
    }, {
        name: '$0',
        totalsRowFunction: 'sum'
    }, {
        name: '1¢ - $100',
        totalsRowFunction: 'sum'
    }, {
        name: '> $100',
        totalsRowFunction: 'sum'
    }];

    t_title(worksheet, cFromN(c_Arr.length + 1), (calcRowLength - 1), 'Number of Items Requested by ETV');

    /* Item count by ETV table */
    const t_etv = worksheet.addTable({
        name: 'ETVRanges',
        ref: `B ${calcRowLength}`,
        headerRow: true,
        totalsRow: true,
        style: {
            theme: 'TableStyleMedium11',
            showFirstColumn: true
        },
        columns: c_Arr,
        rows: etvRows
    });

    calcRowLength += years.length + t_gap;

    /* ETV totals based on exclusion and final total */
    c_Arr = [{
        name: ' '
    }, {
        name: 'Subtotal',
        totalsRowFunction: 'sum'
    }, {
        name: 'Cancelled',
        totalsRowFunction: 'sum'
    }, {
        name: 'Defective',
        totalsRowFunction: 'sum'
    }, {
        name: 'Other',
        totalsRowFunction: 'sum'
    }, {
        name: 'Final',
        totalsRowFunction: 'sum'
    }];

    t_title(worksheet, cFromN(c_Arr.length + 1), (calcRowLength - 1), 'ETV Totals');

    const t_etvTotal = worksheet.addTable({
        name: 'ETVTotals',
        ref: `B ${calcRowLength}`,
        headerRow: true,
        totalsRow: true,
        style: {
            theme: 'TableStyleMedium11',
            showFirstColumn: true,
            showLastColumn: true
        },
        columns: c_Arr,
        rows: totalEtvRows
    });

    calcRowLength += years.length + t_gap;

    /* Number of items based on exclusion */
    c_Arr = [{
        name: ' '
    }, {
        name: 'Included',
        totalsRowFunction: 'sum'
    }, {
        name: 'Cancelled',
        totalsRowFunction: 'sum'
    }, {
        name: 'Defective',
        totalsRowFunction: 'sum'
    }, {
        name: 'Other',
        totalsRowFunction: 'sum'
    }, {
        name: 'Total',
        totalsRowFunction: 'sum'
    }];

    t_title(worksheet, cFromN(c_Arr.length + 1), (calcRowLength - 1), 'Total Number of Items Requested');

    const t_itemCounts = worksheet.addTable({
        name: 'ItemTotals',
        ref: `B ${calcRowLength}`,
        headerRow: true,
        totalsRow: true,
        style: {
            theme: 'TableStyleMedium11',
            showFirstColumn: true,
            showLastColumn: true
        },
        columns: c_Arr,
        rows: etvCountRows
    });

    /* base formula for # of items by ETV:
    $0: =COUNTIFS('${mainSheet}'!${ec}:${ec},0,'${mainSheet}'!${odc}:${odc},">=1/1/2023",'${mainSheet}'!${odc}:${odc},"<=12/31/2023")

    base formula FOR # OF EXCLUDED ORDERS:

    Cancelled: =COUNTIFS('${mainSheet}'!${osc}:${osc},"Cancelled",'${mainSheet}'!${odc}:${odc},">=1/1/2023",'${mainSheet}'!${odc}:${odc},"<=12/31/2023")

    NOTE: Replace 2023 with the actual year in the row

    */

}


function findKeysMatchingRegex(obj, regex) {
    const matchingKeys = [];
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            if (regex.test(key)) {
                matchingKeys.push(key);
            }
        }
    }
    return matchingKeys;
}

async function ejsSheet() {

    const DELETED_PLACEHOLDER = "Deleted Product";
    // Create a new worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(mainSheet);

    const userSettings = JSON.parse(localStorage.getItem('VSE_settings'));

    const dataTypeIndexes = {};
    const dataTypeIndices = userSettings['columnManagement'].map((item) => {
        return item.dataType;
    })

    const orderDateIndex = dataTypeIndices.indexOf('orderDate');// TODO: Get this from settings
    /*
        userSettings.forEach((item, index) => {
            dataTypeIndexes[item.dataType] = index;
        })*/

    const AMZ_COLOR = "007185";
    const AMZ_DARK_COLOR = "00A9C7";
    const DEFAULT_HYPERLINK = "0000EE";

    const exportOnlyCurrentYear = false; // TODO: Set this to reflect user setting

    // TODO: Update this to make it optional
    const range = (exportOnlyCurrentYear) ? [new Date().getFullYear()] : [2021, 2022, 2023];//GM_getValue("config").years_to_export;

    // -- Pull the necessary data from the database --
    const database = await PerformDbOperation('getAll');

    let dbToExport = database;

    // -- Returns an array with the datatypes in the correct order (as indicated in settings by the user) --
    const RowFormatting = (row) => {
        return dataTypeIndices.map(index => row[index]);
        //return [row.photo, row.asin, row.name, row.orderID, new Date(parseInt(row.orderDate - getOffset(row.orderDate))), row.etv, row.excluded, row.reason, row.deleted];
    }

    // -- Going to make necessary changes before exporting (i.e. converting dates, parsing numbers, etc.) --
    dbToExport = database.map((row) => {
        //console.log('Row: ', row)
        let modifiedRow = row;

        // Converting unix to dates
        findKeysMatchingRegex(modifiedRow, /(date)/i).forEach((keyName) => {
            modifiedRow[keyName] = convertUnixToDate(parseInt(modifiedRow[keyName]));
        });

        // Converting etvs to float
        findKeysMatchingRegex(modifiedRow, /(etv)/i).forEach((keyName) => {
            modifiedRow[keyName] = parseFloat(modifiedRow[keyName]);
        });

        const convertedDate = new Date(parseInt(row.orderDate)).getFullYear();
        const dateCheck = range.includes(convertedDate);

        // Only exporting row if:
        // a) exportCurrentYear is not enabled OR
        // b) exportCurrentYear is enabled and the order date falls within the current year
        if (!exportOnlyCurrentYear || (exportOnlyCurrentYear && dateCheck !== -1)) {
            return RowFormatting(row);
        }
    });

    // -- Sort the database by order date in descending order --
    dbToExport.sort((a, b) => b[orderDateIndex] - a[orderDateIndex]);

    console.log('db before export:', dbToExport)

    // -- Create the spreadsheet --
    createExcelSheet(dbToExport);

    function createExcelSheet(dataAsArray) {

        const settings = JSON.parse(localStorage.getItem('VSE_settings'));
        const dataColumnConfigs = userSettings['columnManagement'];

        const tableColumns = dataColumnConfigs.map((item, index) => {
            // only adding filter buttons to specific columns
            const test = DataTypes.find(subitem => subitem.value === item.dataType);
            const headerName = (item?.['displayName']) ? item['displayName'] : DataTypes.find(subitem => subitem.value === item.dataType)['name'];//DataTypes.find(subitem => subitem.dataType === item.dataType);
            const fbSetting = !!(item.dataType.match(/(product name|date|etv)/i));
            return {name: headerName, filterButton: fbSetting};
        })

        // Create a new table with headers
        const table = worksheet.addTable({
            name: 'Orders',
            ref: 'A1',
            headerRow: true,
            style: {
                theme: (userSettings?.['tableTheme']) ? userSettings['tableTheme'] : null,
                showRowStripes: true,
            },
            columns: tableColumns,
            rows: dataAsArray
        });

        // TODO: Revise this after adding in "Apply to custom columns" button
        function returnSetting(path, index, resultIfNull) {
            let result = null;
            // Split the string into individual keys
            const keys = path.split('.');

            const defaultSetting = keys.reduce((obj, key) => obj && obj[key], userSettings['columnDefaults']);

            // Returning default settings if override is enabled
            if (userSettings['columnDefaults']['overrideCustomColumns'] === true) {
                return defaultSetting;
            } else {

                // Access the nested property using bracket notation
                result = keys.reduce((obj, key) => obj && obj[key], dataColumnConfigs[index]);

                if (!result) {
                    result = defaultSetting;

                    if (!result) {
                        result = resultIfNull;
                    }
                }
                return result;
            }
        }

        // TODO: Needs major improvements
        dataColumnConfigs.forEach((columnSettings, index) => {
            const i = index+1;

            // Setting column to hidden based on setting
            worksheet.getColumn(i).hidden = returnSetting('isHidden', index, false);

            // Setting column width
            worksheet.getColumn(columnIndexToLetter(i)).width = (columnSettings?.['colWidth']) ? columnSettings['colWidth'] : 12;

            worksheet.getColumn(columnIndexToLetter(i)).eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                if (cell.value) {

                    let url, tooltip;
                    let cellType;
                    if (rowNumber > 1) {
                        // Apply Body formatting
                        cellType = 'body';

                        if (columnSettings.dataType.match(/(date)/i)) {
                            // Apply date formatting to dates
                            cell.numFmt = '[$-en-US]m/d/yyyy h:mm AM/PM;@';

                        } else if (columnSettings.dataType === "etv") {
                            // Format "etv" column as currency
                            cell.numFmt = '$#,##0.00';

                        } else if (columnSettings.dataType === "photo") {
                            // For photos
                            if (!cell.value.includes('amazon')) {
                                const base64Img = cell.value;
                                const imageId = workbook.addImage({
                                    base64: base64Img,
                                    extension: 'jpeg',
                                });
                                //const url = `https://www.amazon.com/dp/${cell.value}`;
                                worksheet.addImage(imageId, {
                                    tl: { col: 0, row: rowNumber-1 }, // need to figure out how to discern column later
                                    ext: { width: 79, height: 79 }
                                });
                            }

                            // Adjust the height to match img
                            // ExcelJS doesn't support inserting images directly into cells
                            table.getRow(rowNumber).height = 60;
                            cell.value = null;

                        } else if (columnSettings.dataType === "orderID") {

                            tooltip = 'View your order on Amazon';
                            // Add correct hyperlinks to Order ID
                            if (cell.value.includes("-")) {
                                // default order page
                                url = `https://www.amazon.com/gp/your-account/order-details?orderID=${cell.value}`;
                            } else if (cell.value.length > 0) {
                                // the unique Vine order page
                                //let asin = worksheet.getCell(`B ${rowNumber}`);
                                const c = columnIndexToLetter(dataColumnConfigs.findIndex(item => item.asin === "asin"));
                                let asin = worksheet.getCell(`${c} ${rowNumber}`);
                                url = `https://www.amazon.com/vine/orders/${cell.value}?enrollment-asin=${asin}`;
                            }
                            /*
                            if (url) {
                                const currCol = columnIndexToLetter(i);
                                const text = cell.value.text;
                                console.log(' HERE IS TEXT',text)
                                worksheet.getCell(`${currCol}${rowNumber}`).value = {
                                    text: text,
                                    hyperlink: url,
                                    tooltip: 'View your order on Amazon',
                                }
                            }*/


                        } else if (columnSettings.dataType === "excluded") {
                            // Add dropdowns for Exclude column
                            cell.dataValidation = {
                                type: 'list',
                                allowBlank: false,
                                formulae: ['"FALSE, TRUE"']
                            };
                        } else if (columnSettings.dataType === "orderStatus") {
                            // Add dropdowns for Order Status (formerly Exclude Reason) column
                            cell.dataValidation = {
                                type: 'list',
                                allowBlank: false,
                                formulae: ['"None, Cancelled, Removed, Defective, Other"']
                            };
                        }


                        if (url && cell.value) {
                            const text = cell.value;
                            cell.value = {
                                text: text,
                                hyperlink: url,
                                tooltip: tooltip,
                            };
                        } else {
                            /*
                            cell.value = {
                                text: cell.value
                            };*/
                        }

                    } else {
                        // Apply Header formatting
                        cellType = 'header';
                    }

                    function createFontSettings(cell, options) {
                        for (const obj in options) {
                            cell[obj] = options[obj];
                        }

                    }

                    /**
                     * Another bug with ExcelJS:
                     *
                     * Applying any kind of font setting overrides the font color of the table theme
                     */

                    // Testing if it works without affecting font color
                    const test = {bold: true, italic: true, underline: false};

                    if (cellType === 'header') {
                        for (const obj in test) {
                            cell.obj = test[obj];
                        }
                        //createFontSettings(cell, test);
                    }

                    const correctedColor = returnSetting(cellType+'.fontColor', index, null)
                    cell.font = {
                        bold: returnSetting(cellType+'.bold', index, false),
                        italic: returnSetting(cellType+'.italics', index, false),
                        underline: returnSetting(cellType+'.underline', index, false),
                        size: returnSetting(cellType+'.fontSize', index, 11),
                        color: {
                            argb: (correctedColor) ? correctedColor.slice(1) : null
                        }
                    };

                    cell.alignment = {
                        vertical: returnSetting(cellType+'.vertical', index, 'top'),
                        horizontal: returnSetting(cellType+'.horizontal', index, 'left'),
                        //wrapText: returnSetting('header.horizontal', index, false),
                        //shrinkToFit: returnSetting('header.horizontal', index, false),
                        //textRotation: returnSetting('header.horizontal', index, 0),
                    }

                }
            })
        })

        /*
        // Total ETV cell
        worksheet.getCell('J1').value = {
            formula: '"Total ETV: $"&TEXT(SUMIF(G:G, FALSE(), F:F),"#,##0.00")'
        };
        worksheet.columns[9].width = 24;
        */


        /*
        // adds an expression to cross out ETVs that are excluded
        worksheet.addConditionalFormatting({
            ref: 'E2:E',
            rules: [
                {
                    type: 'expression',
                    formulae: ['$F2=TRUE'],
                    style: {strike: true },
                }
            ]
        })
        */

        // Freeze header row
        worksheet.views = [{
            state: 'frozen',
            xSplit: 0,
            ySplit: 1
        }];

        /* Other stats to add:
    * Total ETV - while ignoring excluded items
    * Total # of products - maybe something like <# of products not excluded>/<total # of products REQUESTED> (e.g. 30/54

    Other stats I'm interested in adding:

    * # of $0 ETV products / all products
    * Average ETV per week/month?
    * Average number of items requested per week/month?
    * Days, weeks, months of most/least activity?
    * Times throughout the day you requested more items
    * Total cost of excluded orders

    Other stats that could be included but require more data:

    * How many orders you cancelled throughout the year.
    *

    */
        /* optional add-ons */
        if (userSettings['enableStatsSheet']) {
            addStatSheet(workbook, range, dataTypeIndices);
        }

        // set name of download
        const defaultName = 'ETV Spreadsheet';
        const newName = defaultName;
        // might concatenate the years to the spreadsheet name

        // generate blob
        workbook.xlsx.writeBuffer().then(function(buffer) {
            const blob = new Blob([buffer],{
                type: 'application/octet-stream'
            });
            const url = URL.createObjectURL(blob);

            // create a new anchor element and click it to download the blob
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = newName + '.xlsx';
            downloadLink.click();

            // clean up the object URL to free memory
            URL.revokeObjectURL(url);
        });

    }

}

function testSheet() {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

// Generate cells with formatting
    const cellData = [
        { value: 'Value 1', font: { bold: true } },
        { value: 'Value 2', font: { italic: true } },
        // Add more cells with formatting as needed
    ];

// Insert the cells into the table
    worksheet.addRows(cellData);

// Save the workbook
    workbook.xlsx.writeFile('example.xlsx')
        .then(() => {
            console.log('Workbook created successfully.');
        })
        .catch((error) => {
            console.error('Error creating workbook:', error);
        });
}


/**
 * For translating errors into layman's terms for the user
 * @param error
 * @returns {*|{shortMsg: string, longMsg}}
 */
function translateError(error) {

    console.log(error);
    if (errorMessages[error.name]) {
        return errorMessages[error.name];
    } else {
        const formattedError = {'shortMsg': 'Unknown error.', 'longMsg': error.message};
        return formattedError;
    }
}

/**
 * Use this for cleaning up object data that is compiled from extractDataFromFile()
 * This should work universally with all file types due to it only handling objects
 */
function cleanUpObjectData(parsedData, fileType){

    const uniqueObjects = [];
    const asinMap = new Map();

    // Remove header objects if the data was parsed from a PDF
    let removedHeaders = (/pdf/.test(fileType)) ? parsedData.filter(obj => obj['asin'] !== 'ASIN') : parsedData;

    // Converting all date/time values to Epoch timestamps
    let extractedText = removedHeaders.map(obj => {
        // Iterate over the keys of each object
        Object.keys(obj).forEach(key => {
            // Check if the value is a string and can be parsed as a date
            if (typeof obj[key] === 'string' && key.match(/date/i)) {
                // Convert the date string to a Unix timestamp and replace the value
                obj[key] = convertDateString(obj[key]);
            }

        });
        return obj;
    });

    // Now begin adding/updating objects to/in the map
    extractedText.forEach(object => {
        let obj = object;
        const { asin, orderDate, orderStatusDate, etv } = obj;

        // Note about orderStatus: It's probably best to just assume the order was cancelled if its corresponding orderStatusDate is less than 24 hours from the time of orderDate.


        if (!asinMap.has(asin)) {
            // ASIN data is NEW
            if (obj['orderStatusDate'] === obj['orderDate'] && parseInt(obj['etv']) < 0) {
                // Title transfer date and order date match, so this MUST be a CANCELLED order
                obj['orderStatus'] = 'Cancelled';
            } else if (parseInt(obj['etv']) < 0) {
                // negative ETV could mean anything
                obj['orderStatus'] = 'Removed';
            }

            if (parseInt(obj['etv']) < 0) {
                // use the original etv if the current one is negative
                obj.etv = String(parseInt(obj['etv']) * -1);
            }

        } else {
            // ASIN data ALREADY EXISTS in the map
            const existingObj = asinMap.get(asin);
            const isDifferentDate = existingObj.orderStatusDate !== orderStatusDate;
            const isNegativeEtv = etv < 0;

            // We automatically assume duplicate means order was removed
            obj['orderStatus'] = 'Removed';

            if (existingObj.orderStatusDate !== existingObj.orderDate) {
                // use the original title transfer date if it's different
                obj.orderStatusDate = existingObj.orderStatusDate;
            }

            if (obj.orderStatusDate === obj.orderDate && parseInt(obj['etv']) <= 0) {
                // Dates aren't different, but etv is negative, which means it's a CANCELLED order
                obj['orderStatus'] = 'Cancelled';
            }

            if (parseInt(obj['etv']) < 0) {
                // use the original etv if the current one is negative
                obj.etv = existingObj.etv;
            }

        }

        if (obj.orderDate) {
            obj.orderDate = obj.orderDate.toString();
        }

        // TODO: Need to look over this. It's possibly causing issues with items that appear in 2 pdfs to not list the orderStatus and date correctly
        if (obj.orderStatusDate || obj.orderStatus) {
            //console.log('THIS IS UPDATED ORDER STATUS');
            (obj.orderStatusDate) ? obj.orderStatusDate = obj.orderStatusDate.toString() : obj.orderStatusDate = obj.orderDate.toString();
        }

        // Add object to map if 'asin' is not already present
        asinMap.set(asin, obj);

    });

    // Extract unique objects from the map
    for (const obj of asinMap.values()) {

        // Cleaning up objects that have: orderStatus of "ORDER" OR an orderStatusDate but no orderStatus
        if ((obj.orderStatus && obj.orderStatus === "ORDER") || (obj.hasOwnProperty('orderStatusDate') && !obj.hasOwnProperty('orderStatus'))) {
            // Remove order status keys that just say "ORDER"
            // "ORDER" is just the default for any non-removed orders
            delete obj.orderStatus;
            delete obj.orderStatusDate;
        }

        uniqueObjects.push(obj);
    }

    return uniqueObjects;


    /*
        Decide what to overwrite:
        * Product name - the order sheet usually contains the info from the time it was ordered, so its accuracy is dependable.

        Don't overwrite:
        * Order date - this only has month/day/year
    *
    * */


}

const exportSettingsToJson = (type) => {
    try {
        // TODO: Include options for exporting column configs, default config, or ALL settings.
        let localStorageData = JSON.parse(localStorage.getItem('VSE_settings'));
        let output;
        //const { tableTheme, columnManagement, columnDefaults } = localStorageData;

        switch (type) {
            case 'all': // export everything
                //output = localStorageData;
                break;
            case 'style': // export only spreadsheet styling-related settings
                const { tableTheme, columnManagement, columnDefaults } = localStorageData;
                output = { tableTheme, columnManagement, columnDefaults };
                break;
            default:
                output = localStorageData;
                break;

        }
        //console.log(output);
        return output;
        /*
        try {
            const parsedData = JSON.parse(localStorageData);
            const jsonData = JSON.stringify(parsedData, null, 2); // Indentation level of 2 spaces
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'VSE Settings.json'; // Default file name

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting settings:', error);
        }
        */
    } catch (error) {
        console.error(error);
        //console.error('Strange, you don\'t have any settings...');
    }
}

function parseZipFile(file) {

    // Use JSZip to parse the contents of the zip file
    const zip = new JSZip();
    zip.loadAsync(file)
        .then(function(contents) {
            console.log('Zip file loaded successfully');

            // Iterate through each file in the zip
            contents.forEach(function(relativePath, file) {
                // Display the file name and content
                file.async('string').then(function(content) {
                    console.log('File:', relativePath);
                    console.log('Content:', content);

                    // You can perform further processing with the content here
                    document.getElementById('output').innerHTML += `<p>${relativePath}: ${content}</p>`;
                });
            });
        })
        .catch(function(error) {
            console.error('Error reading zip file:', error);
        });
}



export { extractDataFromFile, cleanUpObjectData, exportSettingsToJson, ejsSheet }