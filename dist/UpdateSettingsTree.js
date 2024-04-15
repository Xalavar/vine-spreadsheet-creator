"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkSettingsTree = checkSettingsTree;
exports.updateSettingsTree = updateSettingsTree;
/* == For reading and updating local storage values ==*/

// Path: 'key.nestedKey.evenMoreNestedKey...'
/**
 * Updates a setting in the settings tree in local storage.
 *
 * Usage: 'key.nestedKey.evenMoreNestedKey'
 * @param path
 * @param value
 */
function updateSettingsTree(path, value) {
  let obj = JSON.parse(localStorage.getItem('VSE_settings')) || {}; // Initialize as empty object if not found
  const keys = path.split('.'); // Split the path into keys

  // Traverse the object based on the keys, creating nested objects if necessary
  let nestedObj = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // Check if the current key represents an array index
    const isArrayIndex = /^\d+$/.test(key);
    if (!(key in nestedObj) && !isArrayIndex) {
      nestedObj[key] = {}; // Create nested object if not already present
    } else if (isArrayIndex && !Array.isArray(nestedObj)) {
      nestedObj = []; // Initialize as array if not already an array
    }
    nestedObj = nestedObj[key]; // Move deeper into the nested object or array
  }

  // Handle the final key
  const finalKey = keys[keys.length - 1];
  if (Array.isArray(nestedObj) && /^\d+$/.test(finalKey)) {
    // Handle array index assignment
    nestedObj[parseInt(finalKey)] = value;
  } else {
    // Update the value at the final key
    nestedObj[finalKey] = value;
  }

  // Store the updated object back into local storage
  localStorage.setItem('VSE_settings', JSON.stringify(obj));
}

/**
 * Checks the settings tree in local storage. Intended for retrieving values at specific locations, if they exist.
 *
 * Usage: 'key.nestedKey.evenMoreNestedKey'
 * @param path
 * @returns {any|{}|null}
 */
function checkSettingsTree(path) {
  let obj = JSON.parse(localStorage.getItem('VSE_settings')) || {}; // Initialize as empty object if not found
  const keys = path.split('.'); // Split the path into keys

  // Traverse the object based on the keys
  let nestedObj = obj;
  for (let key of keys) {
    if (!(key in nestedObj)) {
      return null; // Path does not exist, return null
    }
    nestedObj = nestedObj[key]; // Move deeper into the nested object
  }
  return nestedObj; // Return the value found at the specified path
}
//# sourceMappingURL=UpdateSettingsTree.js.map