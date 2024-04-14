const addItemsToIndexedDB = async () => {
    try {
        // Open the IndexedDB database
        const db = await window.indexedDB.open('yourDatabaseName', 1);

        // Create or access the object store
        const transaction = db.transaction('yourTableName', 'readwrite');
        const objectStore = transaction.objectStore('yourTableName');

        // Define the data to be added
        const itemsToAdd = Array.from({ length: 30 }, (_, index) => ({
            orderDate: `Order Date ${index + 1}`,
            productName: `Product ${index + 1}`,
            photo: `path/to/photo-${index + 1}.jpg`,
            orderId: `Order ID ${index + 1}`,
            asin: `ASIN ${index + 1}`,
        }));

        // Add each defaultConfig to the object store
        itemsToAdd.forEach((item) => {
            objectStore.add(item);
        });

        // Commit the transaction
        await transaction.done;
        console.log('Items added successfully.');
    } catch (error) {
        console.error('Error adding items to IndexedDB:', error);
    }
};

export default addItemsToIndexedDB;
