"use strict";

var pdfjsLib = _interopRequireWildcard(require("pdfjs-dist"));
var _document$getElementB, _document$getElementB2;
/* -- PDF Import related stuff -- */
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
(_document$getElementB = document.getElementById('pdf-import')) === null || _document$getElementB === void 0 || _document$getElementB.addEventListener('change', function () {
  this.files && this.files.length > 0 ? document.getElementById('pdf-import-button').disabled = false : document.getElementById('pdf-import-button').disabled = true;
  this.files && this.files.length > 0 ? document.getElementById('pdf-import-button').classList.remove('disabled') : document.getElementById('pdf-import-button').classList.add('disabled');
});
(_document$getElementB2 = document.getElementById('pdf-import-button')) === null || _document$getElementB2 === void 0 || _document$getElementB2.addEventListener('click', function () {
  const file = document.getElementById('pdf-import').files[0];
  extractTextFromPDF(file).then(function (text) {
    // Assuming extractedText is the array containing objects, remove header objects
    var extractedText = text.filter(obj => obj['asin'] !== 'ASIN');
    console.log('Extracted text:', extractedText);

    // -- Now save the data to the IndexedDB --
  }).catch(function (error) {
    console.error('Error extracting text:', error);
  });
});

// All horizontal translations of parseable data
// For Itemized Reports generated for 2023 and earlier
const OldItemPositions = {
  '38': 'asin',
  '126.91': 'name',
  '372.72': 'orderDate',
  '445.94': 'titleTransferDate',
  '519.16': 'etv'
};

// All horizontal translations of parseable data
// For Itemized Reports generated for 2024 and later
/*
const NewItemPositions = {
    '38': 'orderID',
    '38': 'asin',
    '126.91': 'name',
    '126.91': 'orderStatus',
    '372.72': 'orderDate',
    '445.94': 'dateShipped',
    '445.94': 'dateShipped',
    '519.16': 'etv'
}*/

function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    // Create a new FileReader object
    const reader = new FileReader();

    // Set up FileReader onload event
    reader.onload = function (event) {
      // Get the ArrayBuffer of the uploaded file
      const buffer = event.target.result;

      // Load the PDF using PDF.js
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
          textContents.forEach(function (content) {
            // Initialize object to store extracted text for this page
            var textObject = {};
            var previousXTranslation;
            var counter = 0;

            // Process each item in the content
            content.items.forEach(function (item, index, array) {
              const horizontalTranslation = item.transform[4];
              const formalName = OldItemPositions[horizontalTranslation.toString()];
              if (counter > 3 && horizontalTranslation == 38) {
                // begin creating a new object to export
                counter = 0;
                // Add text object for this page to the extractedText array
                extractedText.push(textObject);
                textObject = {};
              }
              if (formalName) {
                // Check if the current formal name matches the previous one
                if (previousXTranslation === horizontalTranslation) {
                  // Append the string to the last string that was added
                  textObject[formalName] += ' ' + item.str;
                } else {
                  // Add string to the corresponding key in the text object
                  textObject[formalName] = item.str;
                }
                previousXTranslation = horizontalTranslation;
              }
              counter++;
            });
            // Export the last object to the array
            extractedText.push(textObject);
          });

          // Resolve with the extracted text object
          resolve(extractedText);
        }).catch(function (error) {
          reject(error);
        });
      }).catch(function (error) {
        reject(error);
      });
    };

    // Read the uploaded file as ArrayBuffer
    reader.readAsArrayBuffer(file);
  });
}
//# sourceMappingURL=data-management.js.map