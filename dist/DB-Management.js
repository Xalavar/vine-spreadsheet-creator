"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExportDbToJson = ExportDbToJson;
exports.PullAllData = void 0;
exports.addOrderToStore = addOrderToStore;
exports.fetchDataFromDB = fetchDataFromDB;
exports.getFileSizes = getFileSizes;
exports.initDb = initDb;
exports.openDatabase = openDatabase;
exports.orderStore = exports.orderDb = void 0;
exports.updateObjectKeysInDB = updateObjectKeysInDB;
var _react = require("react");
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
const PullAllData = async callback => {
  const request = window.indexedDB.open(orderDb);
  request.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction('orders', 'readonly');
    const objectStore = transaction.objectStore('orders');
    const getAllRequest = objectStore.getAll();
    getAllRequest.onsuccess = function (event) {
      callback(event);
    };
    getAllRequest.onerror = function (event) {
      callback(event);
    };
    transaction.oncomplete = function () {
      db.close();
    };
  };
  request.onerror = function (event) {
    console.error("Error opening database:", event.target.error);
  };
};

/*
const PullAllData = () => {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(orderDb);

        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction('orders', 'readonly');
            const objectStore = transaction.objectStore('orders');
            const getAllRequest = objectStore.getAll();

            getAllRequest.onsuccess = function(event) {
                resolve(event.target.result); // Resolve with the result
            };

            getAllRequest.onerror = function(event) {
                reject(event.target.error); // Reject with the error
            };

            transaction.oncomplete = function() {
                db.close();
            };
        };

        request.onerror = function(event) {
            reject(event.target.error); // Reject with the error
        };
    });
};
*/
exports.PullAllData = PullAllData;
function ExportDbToJson(event) {
  if (!event.target.error) {
    // Going with the fancy indented output just because it looks cleaner
    const jsonData = JSON.stringify(event.target.result, null, 2);
    const blob = new Blob([jsonData], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);

    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'VSE Database.json'; // Default file name

    // Append the link to the document body and trigger a click event to download the file
    document.body.appendChild(link);
    link.click();

    // Clean up: remove the link and revoke the Blob URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
function getFileSizes(event) {
  // Group items by year based on orderDate
  const groupedItems = {};
  event.target.result.forEach(item => {
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
}

/*
export async function getFileSizes() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(orderDb);

        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction([orderStore], 'readonly');
            const objectStore = transaction.objectStore(orderStore);
            const getAllRequest = objectStore.getAll();

            getAllRequest.onsuccess = function (event) {
                const groupedItems = {};
                event.target.result.forEach(item => {
                    const year = new Date(parseInt(item.orderDate)).getFullYear();
                    if (!groupedItems[year]) {
                        groupedItems[year] = [];
                    }
                    groupedItems[year].push(item);
                });

                const groupedFileSize = {};
                for (const year in groupedItems) {
                    const groupSize = groupedItems[year].reduce((acc, item) => acc + (new TextEncoder().encode(JSON.stringify(item)).length), 0);
                    groupedFileSize[year] = groupSize;
                }

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
                    groupedFileSize[year] = `${size} ${unit}`;
                }

                resolve(groupedFileSize); // Resolve with the result
            };

            getAllRequest.onerror = function (event) {
                reject(event.target.error); // Reject with the error
            };

            transaction.oncomplete = function () {
                db.close();
            };
        };

        request.onerror = function (event) {
            reject(event.target.error); // Reject with the error
        };
    });
}
*/

function openDatabase(callback) {
  const request = indexedDB.open(orderDb, dbVersion);
  request.onupgradeneeded = function (event) {
    const db = event.target.result;
    // Handle database upgrades if needed
    // ...
  };
  request.onsuccess = function (event) {
    const db = event.target.result;
    callback(null, db);
  };
  request.onerror = function (event) {
    const error = event.target.error;
    callback(error);
  };
}

/**
 * For checking if a product exists, not necessarily intended for updating info.
 * @param key
 * @param keyName
 * @returns {Promise<unknown>}
 */
function fetchDataFromDB(key, keyName) {
  return new Promise((resolve, reject) => {
    openDatabase(function (error, db) {
      if (error) {
        reject(error);
        return;
      }
      const transaction = db.transaction([orderStore], 'readonly');
      const objectStore = transaction.objectStore(orderStore);
      let getRequest;
      if (keyName) {
        // if specified, search indexes for the value pertaining to the specified key name
        const index = objectStore.index(keyName);
        getRequest = index.get(key);
      } else {
        // the default
        getRequest = objectStore.get(key);
      }
      getRequest.onsuccess = function (event) {
        const retrievedObject = event.target.result;
        resolve(retrievedObject);
      };
      getRequest.onerror = function (event) {
        const error = event.target.error;
        reject(error);
      };
    });
  });
}

//
/**
 * For updating existing orders (object stores).
 *
 * Note: For adding entirely new orders, use addOrderToStore().
 *
 * While this can technically be used to ADD new orders, it's better to just use this for updating.
 * @param key
 * @param updatedKeys
 * @param keyName
 * @returns {Promise<unknown>}
 */
function updateObjectKeysInDB(key, updatedKeys, keyName) {
  return new Promise((resolve, reject) => {
    openDatabase(function (error, db) {
      if (error) {
        reject(error);
        return;
      }
      const transaction = db.transaction([orderStore], 'readwrite');
      const objectStore = transaction.objectStore(orderStore);
      let getRequest;
      if (keyName) {
        // Will search indexes for the value pertaining to the specified keyName
        const index = objectStore.index(keyName);
        getRequest = index.get(key);
      } else {
        // the default
        getRequest = objectStore.get(key);
      }

      //const getRequest = objectStore.get(key);

      getRequest.onsuccess = function (event) {
        const existingObject = event.target.result;

        // Update specific keys of the existing object
        for (const key in updatedKeys) {
          existingObject[key] = updatedKeys[key];
        }

        // Put the updated object back into the object store
        const putRequest = objectStore.put(existingObject);
        putRequest.onsuccess = function (event) {
          console.log("Updated data for order ".concat(key, " successfully."));
          //callback(null, `Object keys updated successfully: ${event.target.result}`);
        };
        putRequest.onerror = function (event) {
          const error = event.target.error;
          reject(error);
        };
      };
      getRequest.onerror = function (event) {
        const error = event.target.error;
        reject(error);
      };
    });
  });
}

/**
 * For adding new orders to the database.
 * @param data
 * @returns {Promise<unknown>}
 */
function addOrderToStore(data) {
  return new Promise((resolve, reject) => {
    openDatabase(function (error, db) {
      if (error) {
        reject(error);
        return;
      }

      // Start a read-write transaction on the object store
      const transaction = db.transaction([orderStore], 'readwrite');
      const objectStore = transaction.objectStore(orderStore);

      // Check if the data already exists in the object store
      //const getRequest = objectStore.get(data.id);

      const putRequest = objectStore.add(data);
      putRequest.onsuccess = function (event) {
        console.log("Added new Vine order successfully.");
        //console.log("Data after put:", data); // Log the data after the put operation

        const addedObject = event.target.result;
        console.log(addedObject);
        resolve(addedObject);

        //callback(null, `Object keys updated successfully: ${event.target.result}`);
      };
      putRequest.onerror = function (event) {
        const error = event.target.error;
        console.log(error);
        reject(error);
      };
    });
  });
}
//# sourceMappingURL=DB-Management.js.map