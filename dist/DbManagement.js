
(function() {
function initDb() {
    const request = indexedDB.open(orderDb, dbVersion);

    request.onupgradeneeded = function(event) {
        const db = event.target.result;

        //const objectStore = db.createObjectStore(orderStore, { keyPath: 'orderID' });
        const objectStore = db.createObjectStore(orderStore, { keyPath: 'asin' });

        // Create or modify indexes for properties of orders
        objectStore.createIndex('asin', 'asin', { unique: true });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('orderID', 'orderID', { unique: true });
        objectStore.createIndex('orderDate', 'orderDate', { unique: false });
        objectStore.createIndex('etv', 'etv', { unique: false });
        objectStore.createIndex('excluded', 'excluded', { unique: false });
        objectStore.createIndex('reason', 'reason', { unique: false });
        objectStore.createIndex('reviewID', 'reviewID', { unique: true });
    };

    request.onsuccess = function(event) {
        const db = event.target.result;
    };

    request.onerror = function(event) {
        console.error('Error opening IndexedDB', event);
    };
}

// Call initDb to set up the database structure (you might want to call this at the start)
initDb();

export function openDatabase(callback) {
    const request = indexedDB.open(orderDb, dbVersion);

    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        // Handle database upgrades if needed
        // ...
    };

    request.onsuccess = function(event) {
        const db = event.target.result;
        callback(null, db);
    };

    request.onerror = function(event) {
        const error = event.target.error;
        callback(error);
    };
}

// For checking if a product exists, not necessarily for updating info
export function fetchDataFromDB(key, keyName) {
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

// For updating existing orders, or sometimes adding new ones
export function updateObjectKeysInDB(key, updatedKeys, keyName) {
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
                    console.log(`Updated data for order ${key} successfully.`);
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

// For adding new orders to the database
export function addOrderToStore(data) {

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
                console.log(`Added new Vine order successfully.`);
                //console.log("Data after put:", data); // Log the data after the put operation

                const addedObject = event.target.result;
                resolve(addedObject);

                //callback(null, `Object keys updated successfully: ${event.target.result}`);
            };

            putRequest.onerror = function (event) {
                const error = event.target.error;
                reject(error);
            };

        });
    });
}

})();
