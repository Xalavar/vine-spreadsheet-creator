"use strict";

var _jszip = _interopRequireDefault(require("jszip"));
var pdfjsLib = _interopRequireWildcard(require("pdfjs-dist"));
var _UniversalItems = require("./UniversalItems");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 *
 */
(function () {
  //'use strict';

  var sidebar = document.querySelector('.sidebar');
  var sidebarToggles = document.querySelectorAll('#sidebarToggle, #sidebarToggleTop');

  /* Inject Bootstrap and other libraries */
  /**
   * This loads everything
   * @param src
   * @returns {Promise<unknown>}
   */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      let script = document.createElement('script');
      if (!src.includes('https')) {
        script.textContent = src;
      } else {
        script.src = src;
      }
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  function loadCSS(href) {
    return new Promise(function (resolve, reject) {
      let link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  Promise.all([
  // Waiting for all the JS libraries to load in
  //loadScript("https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"), 
  loadScript("https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"), loadScript("https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js"), loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"), loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js"), loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js"),
  //loadScript(themeSwapper),
  loadCSS("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css")
  //loadCSS("https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"),
  ]).then(function () {
    // Scripts have finished loading
    console.log('All libraries have finished loading');
    //initializeBootstrapJs();
    beginScript();
  }).catch(function (error) {
    // One or both scripts failed to load
    console.error('Error loading scripts:', error);
  });
  function beginScript() {
    var _document$getElementB;
    /* Column Order Dropdowns */

    /* Delete Data Modal */
    var erasureType = document.getElementById('erasure-type');
    var yearSelection = document.getElementById('year-selection');

    // Toggle data type to delete
    if (erasureType) {
      erasureType.addEventListener('change', function () {
        // Check if the selected value is "picked-years"
        if (this.value === 'individual-years') {
          // Show the grid of checkboxes for specific years
          yearSelection.style.display = 'block';
        } else {
          // Hide the grid of checkboxes for specific years
          yearSelection.style.display = 'none';
        }
      });
    }

    //var year
    var yearsToExport = document.getElementById('years-to-export');
    var yearSelection = document.getElementById('exportSpecificYears');

    // Toggle extra buttons
    if (yearSelection) {
      yearSelection.addEventListener('change', function () {
        // Check if the selected value is "picked-years"
        if (this.checked) {
          // Show the grid of checkboxes for specific years
          yearsToExport.style.display = 'flex';
        } else {
          // Hide the grid of checkboxes for specific years
          yearsToExport.style.display = 'none';
          // Add !important to ensure it takes precedence
          yearsToExport.style.setProperty('display', 'none', 'important');
        }
      });
    }
    function columnIndexToLetter(index) {
      let dividend = index;
      let columnName = '';
      let modulo;
      while (dividend > 0) {
        modulo = (dividend - 1) % 26;
        columnName = String.fromCharCode(65 + modulo) + columnName;
        dividend = Math.floor((dividend - modulo) / 26);
      }
      return columnName;
    }

    // Load settings from local storage
    if (!localStorage.getItem('VSE_settings')) {
      localStorage.setItem('VSE_settings', JSON.stringify({}));
    }
    function updateLocalStorage(targetElement, draggedElement) {
      var local = JSON.parse(localStorage.getItem('VSE_settings'));
      var elemA = targetElement.parentElement;
      var elemB = draggedElement.parentElement;
      // We'll swap the values of the two affected columns
      var colAData = extractDataToObject(elemA);
      var colBData = extractDataToObject(elemB);
      console.log(colAData);
      console.log(colBData);

      // Now update local storage
      local[_UniversalItems.IndividualColumns][elemB.id] = colBData[elemB.id];
      local[_UniversalItems.IndividualColumns][elemA.id] = colAData[elemA.id];
      localStorage.setItem('VSE_settings', JSON.stringify(local));
    }

    //addDragAndDrop();

    function getFormVal(elem) {
      if (elem.tagName === "SELECT") {
        return elem.value;
      } else if (elem.tagName === "INPUT" && elem.type !== "checkbox") {
        return elem.value;
      } else {
        return elem.checked;
      }
    }

    /**
     * This is for seamlessly combining nested object trees. Target keys are overwritten by matching source keys.
     * @param target
     * @param source
     * @returns {*}
     */
    function deepMerge(target, source) {
      for (const key in source) {
        if (typeof source[key] === 'object' && source[key] !== null) {
          target[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    }

    /* -- PDF Import related stuff -- */
    (_document$getElementB = document.getElementById('pdf-import')) === null || _document$getElementB === void 0 || _document$getElementB.addEventListener('change', function () {
      this.files && this.files.length > 0 ? document.getElementById('pdf-import-button').disabled = false : document.getElementById('pdf-import-button').disabled = true;
      this.files && this.files.length > 0 ? document.getElementById('pdf-import-button').classList.remove('disabled') : document.getElementById('pdf-import-button').classList.add('disabled');
    });

    // All horizontal translations of key data sheet elements
    const translationToName = {
      '38': 'asin',
      '126.91': 'name',
      '372.72': 'orderDate',
      '445.94': 'titleTransferDate',
      '519.16': 'etv'
    };
    const multiUseValues = ['bold', 'italics', 'underline', 'horizontal', 'vertical', 'fontSize', 'fontColor'];
    /* Checks for making sure settings exist */
    // Loop through each list group
    document.querySelectorAll('#columnManagement .list-group-defaultConfig').forEach(function (column) {
      const listGroupHead = column.closest('.list-group').id;
      column.querySelectorAll('select, input').forEach(function (options) {
        var part;
        if (options.closest('.custom-header-options')) {
          part = "header";
        } else if (options.closest('.custom-body-options')) {
          part = "body";
        } else {}
        var storedSettings = JSON.parse(localStorage.getItem('VSE_settings'));
        // Get the corresponding setting from stored settings
        const itemId = options.closest('.list-group-defaultConfig').id;
        const keyName = options.dataset.lsRef;
        const localValue = storedSettings && (storedSettings[listGroupHead] || storedSettings[itemId] || storedSettings[keyName]) && (storedSettings[listGroupHead][itemId] && storedSettings[listGroupHead][itemId][keyName] || storedSettings[listGroupHead][keyName] || storedSettings[listGroupHead][itemId] && storedSettings[listGroupHead][itemId][part] && storedSettings[listGroupHead][itemId][part][keyName]);
        //console.log(localValue);
        // If it exists, set the dropdown to the stored setting
        if (localValue !== undefined) {
          if (options.tagName === "SELECT" || options.tagName === "INPUT" && options.type !== "checkbox") {
            options.value = localValue;
          } else {
            options.checked = localValue;
          }
        } else {
          // otherwise use the value currently selected
          var settingsToUpdate = {};
          settingsToUpdate[listGroupHead] = {};
          if (multiUseValues.includes(keyName)) {
            settingsToUpdate[listGroupHead][itemId] = {};
            settingsToUpdate[listGroupHead][itemId][part] = {};
            settingsToUpdate[listGroupHead][itemId][part][keyName] = getFormVal(options);
          } else if (itemId !== '') {
            settingsToUpdate[listGroupHead][itemId] = {};
            settingsToUpdate[listGroupHead][itemId][keyName] = getFormVal(options);
          } else if (listGroupHead == '') {
            settingsToUpdate[itemId] = {};
            settingsToUpdate[listGroupHead][itemId][keyName] = getFormVal(options);
          } else {
            settingsToUpdate[listGroupHead][keyName] = getFormVal(options);
          }

          // Merge new settings with existing stored settings
          const updatedSettings = deepMerge(storedSettings, settingsToUpdate);
          localStorage.setItem('VSE_settings', JSON.stringify(updatedSettings));
        }

        // Add event listener to update stored settings when selection changes
        options.addEventListener('change', function () {
          var storedSettings = JSON.parse(localStorage.getItem('VSE_settings'));
          //console.log(options);
          var settingsToUpdate = {};
          settingsToUpdate[listGroupHead] = {};
          var optionValue = getFormVal(options);
          var comparingTo = this;
          var comparingToId = this.closest('.list-group-defaultConfig').id;
          console.log("comparingToId: " + comparingToId);
          console.log("itemId: " + itemId);
          if (comparingTo.classList.contains('data-type-name')) {
            // the data type is being changed
            var allColumns = column.closest('.list-group').querySelectorAll('.list-group-defaultConfig');
            var foundColumn;
            for (let x = 0; x < allColumns.length; x++) {
              if (comparingToId !== allColumns[x].id && allColumns[x].querySelector('.data-type-name').value === comparingTo.value) {
                // ignore the current defaultConfig group
                // pulling the column with the matching value
                foundColumn = allColumns[x];
                break;
              }
            }
            if (comparingToId !== foundColumn.id && foundColumn.querySelector('.data-type-name').value === comparingTo.value) {
              // ignore the current defaultConfig group

              // begin swapping group defaultConfig data
              var previousType = storedSettings[listGroupHead][comparingToId][keyName];
              comparingTo.value = previousType; // changing the selected value before swapping

              // We'll swap the values of the two affected columns
              var colAData = extractDataToObject(column);
              var colBData = extractDataToObject(foundColumn);
              console.log(colAData);
              console.log(colBData);

              // Update the values in each HTML column
              setDataFromObject(column, colBData);
              setDataFromObject(foundColumn, colAData);

              // Now update local storage
              var currentColumnData = storedSettings[listGroupHead][comparingToId];
              var otherColumnData = storedSettings[listGroupHead][foundColumn.id];
              settingsToUpdate[listGroupHead][comparingToId] = otherColumnData;
              settingsToUpdate[listGroupHead][foundColumn.id] = currentColumnData;

              //column.querySelector('[data-ls-ref="displayName"]').value = "HELLLLLOOOOOOOO";
            }
          } else {
            console.log(optionValue);
            if (multiUseValues.includes(keyName)) {
              settingsToUpdate[listGroupHead][comparingToId] = {};
              var part;
              if (this.closest('.custom-header-options')) {
                part = "header";
              } else {
                part = "body";
              }
              settingsToUpdate[listGroupHead][comparingToId][part] = {};
              settingsToUpdate[listGroupHead][comparingToId][part][keyName] = optionValue;
            } else if (itemId !== '') {
              settingsToUpdate[listGroupHead][comparingToId] = {};
              settingsToUpdate[listGroupHead][comparingToId][keyName] = optionValue;
            } else if (listGroupHead == '') {
              settingsToUpdate[comparingToId] = {};
              settingsToUpdate[listGroupHead][comparingToId][keyName] = optionValue;
            } else {
              settingsToUpdate[listGroupHead][keyName] = optionValue;
            }
          }
          console.log("This is settings to update");
          console.log(settingsToUpdate);
          // Merge new settings with existing stored settings
          //const updatedSettings = deepMerge(storedSettings, settingsToUpdate);

          const updatedSettings = deepMerge(JSON.parse(localStorage.getItem('VSE_settings')), settingsToUpdate);
          localStorage.setItem('VSE_settings', JSON.stringify(updatedSettings));
        });
      });
    });

    /**
     * For saving the HTML values to an object
     * @param element
     * @returns {{}}
     */
    function extractDataToObject(element) {
      const id = element.id;
      const dataObject = {
        'header': {},
        'body': {}
      };
      const childElements = element.querySelectorAll('[data-ls-ref]');
      childElements.forEach(child => {
        const key = child.dataset.lsRef;
        const value = child.tagName === 'INPUT' && child.type === 'checkbox' ? child.checked : child.value;
        if (child.closest('.custom-header-options')) {
          dataObject['header'][key] = value;
        } else if (child.closest('.custom-body-options')) {
          dataObject['body'][key] = value;
        } else {
          dataObject[key] = value;
        }
      });
      const nestedObject = {};
      nestedObject[id] = dataObject;
      return nestedObject;
    }

    /**
     * For updating the HTML values to match ones from an object
     * @param element
     * @param data
     */
    function setDataFromObject(element, data) {
      const childElements = element.querySelectorAll('[data-ls-ref]');
      Object.keys(data).forEach(key => {
        const childData = data[key];
        const nestedData = childData;
        if (nestedData) {
          Object.keys(nestedData).forEach(ref => {
            const childElement = element.querySelector("[data-ls-ref=\"".concat(ref, "\"]"));
            if (childElement) {
              if (childElement.tagName === 'INPUT' && childElement.type === 'checkbox') {
                childElement.checked = nestedData[ref];
              } else {
                childElement.value = nestedData[ref];
              }
            }
          });
        }
      });
    }

    /* Date and Time Pickers */
    function getDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 because getMonth() returns zero-based month
      const day = String(date.getDate()).padStart(2, '0');
      return "".concat(year, "-").concat(month, "-").concat(day);
    }
    document.querySelectorAll('.custom-export-range').forEach(function (item) {
      var formattedMin, formattedMax;
      if (item.dataset.inputName === "start") {
        // Maximum date value
        var input = new Date();
        const time = 24 * 60 * 60 * 1000; // 24 hours in ms
        const newDate = new Date(input.getTime() - time);
        formattedMax = getDate(newDate);

        // Minimum date value
      } else {
        // Maximum date value
        formattedMax = getDate(new Date());
      }
      item.max = formattedMax;
    });
  }
})();
//# sourceMappingURL=CustomScript.js.map