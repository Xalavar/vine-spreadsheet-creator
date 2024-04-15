"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExportDataToFile = ExportDataToFile;
exports.PerformDbOperation = PerformDbOperation;
exports.getFileSizes = getFileSizes;
exports.initDb = initDb;
exports.orderStore = exports.orderDb = void 0;
var _react = require("react");
var _FileParsingMethods = require("./FileParsingMethods");
const orderDb = exports.orderDb = 'VSE_DB';
const configDb = 'VSEConfig';
const orderStore = exports.orderStore = 'orders';
const dbVersion = 1;
function initDb() {
  const request = indexedDB.open(orderDb, dbVersion);
  request.onupgradeneeded = function (event) {
    const db = event.target.result;

    //const objectStore = db.createObjectStore(orderStore, { keyPath: 'orderID' });
    const objectStore = db.createObjectStore(orderStore, {
      keyPath: 'asin'
    });

    // Create or modify indexes for properties of orders
    objectStore.createIndex('asin', 'asin', {
      unique: true
    });
    objectStore.createIndex('name', 'name', {
      unique: false
    });
    objectStore.createIndex('orderID', 'orderID', {
      unique: true
    });
    objectStore.createIndex('orderDate', 'orderDate', {
      unique: false
    });
    objectStore.createIndex('etv', 'etv', {
      unique: false
    });
    objectStore.createIndex('excluded', 'excluded', {
      unique: false
    });
    objectStore.createIndex('reason', 'reason', {
      unique: false
    });
    objectStore.createIndex('reviewID', 'reviewID', {
      unique: true
    });
  };
  request.onsuccess = function (event) {
    const db = event.target.result;
  };
  request.onerror = function (event) {
    console.error('Error opening IndexedDB', event);
  };
}

/**
 * For exporting files in different formats.
 *
 * @param data
 * @param {'application/json' | 'application/pdf' | 'application/xlsx' | 'application/zip'} filetype
 * @param {string} exportName
 * @constructor
 */
function ExportDataToFile(data, filetype, exportName) {
  // Going with the fancy indented output just because it looks cleaner
  const fileData = JSON.stringify(data, null, 2);
  const blob = new Blob([fileData], {
    type: filetype
  });
  const url = URL.createObjectURL(blob);

  // Create a link element
  const link = document.createElement('a');
  link.href = url;
  link.download = exportName;

  // Append the link to the document body and trigger a click event to download the file
  document.body.appendChild(link);
  link.click();

  // Clean up: remove the link and revoke the Blob URL
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
function getFileSizes(event) {
  //if (!event.target.error) {

  // Group items by year based on orderDate
  const groupedItems = {};
  event.forEach(item => {
    const year = new Date(parseInt(item.orderDate)).getFullYear();
    if (!groupedItems[year]) {
      groupedItems[year] = [];
    }
    groupedItems[year].push(item);
  });

  // Calculate file size for each group
  const groupedFileSize = {};
  for (const year in groupedItems) {
    const groupSize = groupedItems[year].reduce((acc, item) => acc + new TextEncoder().encode(JSON.stringify(item)).length, 0);
    groupedFileSize[year] = groupSize;
  }

  // Display converted file size metric
  for (const year in groupedFileSize) {
    let size = groupedFileSize[year];
    let unit = 'bytes';
    if (size >= 1024 * 1024 * 1024) {
      size = (size / (1024 * 1024 * 1024)).toFixed(2);
      unit = 'GB';
    } else if (size >= 1024 * 1024) {
      size = (size / (1024 * 1024)).toFixed(2);
      unit = 'MB';
    } else if (size >= 1024) {
      size = (size / 1024).toFixed(2);
      unit = 'KB';
    }
    groupedFileSize[year] = "".concat(size, " ").concat(unit);
  }
  console.log(groupedFileSize);
  // Set state with the grouped file sizes
  return groupedFileSize;

  //}
}

/**
 * Opens the database, pretty self-evident.
 *
 * Only used for performing database operations and isn't meant to be used in a standalone manner.
 * @returns {Promise<unknown>}
 * @constructor
 */
function OpenDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(orderDb, dbVersion);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      // Handle database upgrades if needed
      // ...
    };
    request.onsuccess = function (event) {
      resolve(event);
    };
    request.onerror = function (event) {
      reject(event);
      console.error('Error opening database: ', event);
      //reject(event);
    };
  });
}

/**
 * For database operations, including adding, pulling, deleting, and updating items.
 *
 * Usage:
 *
 * 'add' requires data
 *
 * 'delete' requires ???
 *
 * 'get' requires key | optional: keyType
 *
 * 'getAll' requires N/A
 *
 * 'put' requires key, keyType, and data
 *
 * @param {'add' | 'delete' | 'get' | 'getAll' | 'put'} action
 * @param {number, string} key
 * @param {string} keyType
 * @param {object} data
 * @returns {Promise<unknown>}
 * @constructor
 */
async function PerformDbOperation(action, key, keyType, data) {
  // If there's a keyType, assume that we need to search for the item
  return new Promise(async (resolve, reject) => {
    try {
      let ev = await OpenDatabase();
      const db = ev.target.result;
      const transaction = db.transaction([orderStore], 'readwrite');
      const objectStore = transaction.objectStore(orderStore);
      let request;
      if (action === 'put' || action === 'get') {
        if (keyType) {
          // Will search indexes for the value pertaining to the specified keyType, rather than the default (ASIN)
          // Intended for when we don't know the ASIN of the product
          const index = objectStore.index(keyType);
          request = index.get(key);
        } else {
          // Assume 'key' is the ASIN
          request = objectStore.get(key);
        }
      } else if (action === 'getAll') {
        request = objectStore[action]();
      } else if (action === 'add') {
        request = objectStore[action](data);
      } else {
        // Otherwise, use the standard method for database operations
        request = objectStore[action](key);
      }
      request.onsuccess = async function (event) {
        if (action === 'put') {
          // Special circumstances for PUT operations. Just to be extra careful we don't overwrite anything we don't want to
          // It's a put request, so handling this differently
          const putOperation = await HandlePutOperation(event, key, data, objectStore);
          console.log("Updated data for order ".concat(key, " successfully."));
          resolve(putOperation);
        } else {
          // Otherwise, resolve the promise normally
          resolve(event.target.result);
        }
      };
      request.onerror = function (event) {
        reject(event);
      };
      transaction.oncomplete = function () {
        console.log('transaction complete');
        db.close();
      };
    } catch (error) {
      console.error('Error: ', error);
      reject(error);
    }
  });
}
function HandlePutOperation(event, key, data, objectStore) {
  return new Promise(async (resolve, reject) => {
    const existingObject = event.target.result;

    // TODO: Perform extra checks to allow/disallow overwriting of specific keys, or just figure that out beforehand

    // Update specific keys of the existing data
    for (const key in data) {
      existingObject[key] = data[key];
    }

    // Putting the updated data with any newly added keys back into the data store
    const putRequest = objectStore.put(existingObject);
    putRequest.onsuccess = function (event) {
      resolve(event);
    };
    putRequest.onerror = function (event) {
      reject(event);
    };
  });
}
//# sourceMappingURL=IndexedDB_Functions.js.map