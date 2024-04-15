import {
    Accordion,
    Button,
    Card,
    Container,
    Dropdown,
    Form,
    Modal,
    Spinner,
    Table,
    Tooltip
} from "react-bootstrap";

import React, {useCallback, useEffect, useState} from "react";
import {
    initDb,
    addOrderToStore, PullAllData, ExportDbToJson, getFileSizes, PullAllDataPromise, PerformDbOperation, ExportDataToFile
} from "./IndexedDB_Functions.js";
import {extractDataFromFile, cleanUpObjectData, exportSettingsToJson} from './FileParsingMethods.js'


/* -- PDF Import related stuff -- */


// Call initDb to set up the database structure (you might want to call this at the start)
initDb();

async function loadFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        // Create a new FileReader object
        const reader = new FileReader();

        // Set up FileReader onload event
        reader.onload = function(event) {
            resolve(event.target.result); // return with the array buffer
        };

        // Set up FileReader onerror event
        reader.onerror = function(event) {
            reject(event.target.error);
        };

        if (file.type.includes('text/')) {
            // Read the uploaded file as Text
            reader.readAsText(file);
        } else {
            // Read the uploaded file as ArrayBuffer
            reader.readAsArrayBuffer(file);
        }
    });
}

async function parseSpreadsheet(file) {
    return new Promise((resolve, reject) => {

    });

}


const uniqueKeys = ['asin', 'orderID', 'reviewID'];

// TODO: Add in a warning state
/**
 * Loads in the file importation results and generates a corresponding accordion item. There are two states: success and failure.
 *
 * Failure states have an extra accordion item that goes over the error in more detail.
 * @param data
 * @returns {Element}
 * @constructor
 */
const GenerateModalResults = (data) => {

    const GenerateErrorMessage = (file) => {
        return (
            <Accordion>
                <Accordion.Item eventKey='1' key='1'>
                    <Accordion.Button className={`file-upload-error bg-danger-subtle text-danger-emphasis`} >Error: {file.error.shortMsg}</Accordion.Button>
                    <Accordion.Body>
                        {file.error.longMsg}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        );
    }

    const GenerateTable = (file) => {
        return (
            <Table>
                <thead>
                <tr>
                    <th>Items Found</th>
                    <th>Items Added</th>
                    <th>Items Updated</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>{file.itemsFound}</td>
                    <td>{file.itemsAdded}</td>
                    <td>{file.itemsUpdated}</td>
                </tr>
                </tbody>
            </Table>
        );
    }

    return (
        <>
            <Accordion>
                {data && (data).map((file, index) => {
                    const status = file.error ? 'error' : '';
                    const statusClass = file.error ? 'bg-danger-subtle text-danger-emphasis' : 'bg-success-subtle text-success-emphasis';
                    return (
                        <Accordion.Item eventKey={index.toString()} key={index}>
                            <Accordion.Button className={`file-upload-${status} ${statusClass}`} >{file.name}</Accordion.Button>
                            <Accordion.Body>
                                {
                                    (file.error) ? GenerateErrorMessage(file) : GenerateTable(file)
                                }
                            </Accordion.Body>
                        </Accordion.Item>
                    );
                })}
            </Accordion>
        </>
    )
}

const GenerateClearVineDataOptions = () => {
    const [rangeOfYears, setRangeOfYears] = useState({});
    const [toggledYears, setToggledYears] = useState(false);

    useEffect(() => {

        const StoredYears = async () => {
            const data = await new Promise(async (resolve, reject) => {

                const test = await PerformDbOperation('getAll');
                const result = CompileYears(test);
                resolve(result);

            });
            console.log('Data:', data);
            setRangeOfYears(data);
        };
        StoredYears();
    }, []);

    const HandleYearToggle = (year) => {
        setRangeOfYears(prevState => ({
            ...prevState,
            [year]: !prevState[year]
        }));
    };

    const HandleMainYearToggle = () => {
        console.log('Toggled years: ', toggledYears)
        setToggledYears(!toggledYears);
    };

    return (
        <>
            <Container>
                <Form>
                    <Form.Check
                        type={'switch'}
                        label={'Erase ALL data'}
                        onChange={HandleMainYearToggle}
                    />
                </Form>
                {!toggledYears && (
                    <>
                        <h3>Select which years you would like to delete:</h3>
                        <fieldset>
                            <Form>
                                {!toggledYears && Object.entries(rangeOfYears).map(([year, value]) => {
                                    return (
                                        <>
                                            <Form.Check type={'switch'} label={year} inline checked={value}
                                                //checked={selectedOptions[year]}
                                                        onChange={() => HandleYearToggle(year)}
                                            />
                                        </>
                                    )

                                })}

                            </Form>
                        </fieldset>
                    </>
                )}
            </Container>
        </>
    )
}
const FileImportSpinner = () => {
    return (
        <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
        </Spinner>
    )
}

/*
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
        const groupSize = groupedItems[year].reduce((acc, item) => acc + (new TextEncoder().encode(JSON.stringify(item)).length), 0);
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
        groupedFileSize[year] = `${size} ${unit}`;
    }

    // Set state with the grouped file sizes
    return groupedFileSize;
}
*/


const ClearVineData = (handleOpenModal, setModalData) => {

    const ClearVineDataHandler = async () => {

        // -- Toggle the modal with the spinner --
        handleOpenModal(<FileImportSpinner/>)

        // -- Load modal contents in the background --
        setModalData(<GenerateClearVineDataOptions/>)

    };

    return (

        <>
            <p>
                WARNING: Make sure you create a backup before deleting!
            </p>
            <Button variant='danger' onClick={ClearVineDataHandler}>
                Erase Vine Data
            </Button>
        </>

    )


}


const DataManagement = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [test, setTest] = useState(null);
    console.log('RENDER')

    // Import ExcelJS and other dependencies
    useEffect(() => {
        console.log('This should only render once.')
        // Create a new script element
        const scriptElement = document.createElement('script');

        // Set the source attribute to the URL of the script
        scriptElement.src = 'https://unpkg.com/exceljs/dist/exceljs.min.js';

        // Append the script element to the body of the document
        document.body.appendChild(scriptElement);


    }, []);

    const handleOpenModal = (data) => {
        setModalData(data);
        setShowModal(true);
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setModalData(null);
    };

    function IndexedDBFileSize() {
        const [groupedFileSize, setGroupedFileSize] = useState({});

        // TODO: Improve this jank
        const GetSizesPerYear = async () => {

            const data = await new Promise(async (resolve, reject) => {
                const test = await PerformDbOperation('getAll');
                const result = getFileSizes(test);
                resolve(result);
            });
            setGroupedFileSize(data);
        };

        // Update the sizes on load and after data is imported
        useEffect(() => {
            GetSizesPerYear();
        }, [showModal]);

        return (
            <div>
                <h2>IndexedDB File Sizes by Year</h2>
                <ul>
                    {Object.entries(groupedFileSize).map(([year, size]) => (
                        <li key={year}>
                            <strong>{year}:</strong> {size}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }


    const DataImport = () => {
        const [selectedFiles, setSelectedFiles] = useState(null);
        const [isButtonDisabled, setIsButtonDisabled] = useState(true);

        const handleFileInput = (event, formats) => {

            const files = event.target.files;
            /*
                        console.log(event.target.files)
                        let files = event.target.files;
                        for (const file of files) {
                            if (!formats.includes(file.type.replace(/.+\//, '.'))) {
                                console.log('deleting file '+file.type)
                                delete files[file];
                            }
                        }*/
            /*
            = event.target.files.map((file) => {
                return formats.includes(file.type.replace(/.+\//, '.'))
            });*/

            if (files.length > 0) {
                setSelectedFiles(files);
                setIsButtonDisabled(false);
            } else {
                setSelectedFiles(null);
                setIsButtonDisabled(true);
            }

        };

        const importDataHandler = async () => {

            // TODO: Toggle modal here
            handleOpenModal(<FileImportSpinner/>)

            // The results of the imported files will be displayed in a modal
            // telling the user what was successful and what failed
            let results = [];

            // -- Begin processing all imported files --
            for (const file of selectedFiles) {
                let fileInfo = {};
                fileInfo.name = file.name;
                fileInfo.type = file.type;
                fileInfo.itemsFound = 0;
                fileInfo.itemsAdded = 0;
                fileInfo.itemsUpdated = 0;

                // Load the file as an array buffer
                const buffer = await loadFileAsArrayBuffer(file);
                let sanitizedData = [];
                const filePromises = [];

                // -- Check the file type and determine extraction method --

                console.log(file.type)
                // -- Extract text from the loaded buffer --
                const promise = extractDataFromFile(buffer, file.type)
                    .then(function(parsedData) {
                        console.log(parsedData)
                        // -- Then clean up the object data before merging with database --
                        sanitizedData = cleanUpObjectData(parsedData, file.type);
                        fileInfo.itemsFound = sanitizedData.length;
                        console.log('Sanitized: ', sanitizedData)

                    }).catch(function(error) {
                        fileInfo.error = error;
                        console.error('Error extracting data:', error);
                    });

                filePromises.push(promise);

                // -- Wait for promises to resolve before continuing --
                await Promise.all(filePromises);

                // -- Pulling all the data to compare against --
                let dbData = await PerformDbOperation('getAll');

                // TODO: Improvement:
                // -- Going over each item extrapolated from the files --
                for (const item of sanitizedData) {

                    let itemKey;

                    // TODO: This can definitely be improved
                    // -- Perform all the checks to see if the item is in the database --
                    for (const keyName of uniqueKeys) {
                        if (item.hasOwnProperty(keyName)) {
                            const isInDb = dbData.find(db => db[keyName] === item[keyName]);
                            if (isInDb) {
                                console.log('Found a matching ' + keyName);
                                itemKey = [keyName, item[keyName]];
                                break;
                            }
                        }
                    }

                    if (itemKey) {
                        // -- If the item is in the database, then we'll UPDATE it (if necessary) --
                        // TODO: Write a method to decide what can be overwritten and what shouldn't
                        //await PerformDbOperation('put', itemKey[1], itemKey[0], item);
                        console.log('Item is already in database.');
                        fileInfo.itemsUpdated++;
                    } else {
                        // -- Item is not in database, so we'll add it and reload the database --
                        await PerformDbOperation('add', null, null, item);
                        console.log('Added a new item to the database');
                        fileInfo.itemsAdded++;

                        // Reload the database
                        dbData = await PerformDbOperation('getAll');
                    }

                }

                results.push(fileInfo);

            }

            // -- Load <GenerateModalResults /> in the modal --
            setModalData(GenerateModalResults(results))

            // -- Empty the file input form
            const fileInput = document.getElementById('formFile');
            fileInput.value = '';

            // -- Reset the button and file states
            setSelectedFiles(null);
            setIsButtonDisabled(true);

        };

        const acceptedFormats = [".pdf", ".json", ".xlsx", ".zip"];

        return (
            <>
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>Accepted formats:<br/>
                        <svg className="bi bi-filetype-pdf" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em"
                             fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd"
                                  d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM1.6 11.85H0v3.999h.791v-1.342h.803c.287 0 .531-.057.732-.173.203-.117.358-.275.463-.474a1.42 1.42 0 0 0 .161-.677c0-.25-.053-.476-.158-.677a1.176 1.176 0 0 0-.46-.477c-.2-.12-.443-.179-.732-.179Zm.545 1.333a.795.795 0 0 1-.085.38.574.574 0 0 1-.238.241.794.794 0 0 1-.375.082H.788V12.48h.66c.218 0 .389.06.512.181.123.122.185.296.185.522Zm1.217-1.333v3.999h1.46c.401 0 .734-.08.998-.237a1.45 1.45 0 0 0 .595-.689c.13-.3.196-.662.196-1.084 0-.42-.065-.778-.196-1.075a1.426 1.426 0 0 0-.589-.68c-.264-.156-.599-.234-1.005-.234H3.362Zm.791.645h.563c.248 0 .45.05.609.152a.89.89 0 0 1 .354.454c.079.201.118.452.118.753a2.3 2.3 0 0 1-.068.592 1.14 1.14 0 0 1-.196.422.8.8 0 0 1-.334.252 1.298 1.298 0 0 1-.483.082h-.563v-2.707Zm3.743 1.763v1.591h-.79V11.85h2.548v.653H7.896v1.117h1.606v.638H7.896Z"></path>
                        </svg>
                    </Form.Label>
                    <Form.Control onChange={(e) => handleFileInput(e, acceptedFormats)} multiple type="file" accept={acceptedFormats.toString()}/>
                </Form.Group>
                {/*<FileUploader acceptedFileTypes={{'application/pdf': ['.pdf'], 'application/xlsx': ['.xlsx'], 'application/json': ['.json'], 'application/zip': ['.zip']}} onFileUpload={handleFileInput} />*/}
                <Button onClick={importDataHandler} disabled={isButtonDisabled}>
                    Import data
                </Button>
            </>
        )

    }

    return (
        <>
            <h1>Data Management</h1>
            <div>
                {IndexedDBFileSize()}
            </div>
            <Accordion alwaysOpen>
                <Accordion.Item eventKey={'0'}>
                    <Accordion.Header>Import Data</Accordion.Header>
                    <Accordion.Body /*style={{display: 'flex', justifyContent: 'space-evenly'}}*/>
                        <Card>
                            <Card.Header className={'bg-body-secondary'}>Import Vine Data</Card.Header>
                            <Card.Body>
                                <Card.Text>
                                    Spreadsheet importation coming soon!<br/>
                                    Importing data will not overwrite existing data unless prompted to.<br/>
                                </Card.Text>
                                <p>Other Notes:</p>
                                <ul>
                                    <li>Imported files must have at least one unique identifier for each product
                                        being added.<br/>
                                        Unique identifiers include:
                                        ASIN and Order ID.
                                    </li>
                                    <li>
                                        <ul>When uploading a spreadsheet:
                                            <li>please ensure that the column headers in your spreadsheet match the
                                                ones in the glossary.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        Images in spreadsheets can't be saved due to a bug in ExcelJS.
                                    </li>
                                </ul>
                                <p>The following are supported: </p>
                                <ul>
                                    <li>Itemized Reports (PDFs only)</li>
                                </ul>
                                {DataImport()}
                            </Card.Body>
                        </Card>
                        <br></br>
                        <Card>
                            <Card.Header className={'bg-body-secondary'}>Import Script Settings</Card.Header>
                            <Card.Body>
                                <Card.Text>
                                    If you have a JSON file containing your settings, you can import them here.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                        <br></br>
                        {/* Exporting Vine Data */}

                        {/*
                        <h4>Import Vine Data</h4>
                        <Card>
                            <Card.Body>
                                <Card.Text>
                                    Spreadsheet importation coming soon!
                                    Importing data will not overwrite existing data unless prompted to.<br/>
                                    Note: The data being imported must have a unique identifier. Unique identifiers
                                    include: ASIN and Order ID.
                                </Card.Text>
                                <p>The following are supported: </p>
                                <ul>
                                    <li>Itemized Reports (PDFs only)</li>
                                </ul>
                                {DataImport()}
                            </Card.Body>
                        </Card>
                        <br></br>
                        <h4>Import Settings</h4>
                        <Card>
                            <Card.Body>
                                <Card.Text>
                                    If you have a JSON file containing your settings, you can import them here.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                        */}
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={'1'}>
                    <Accordion.Header>Export Data</Accordion.Header>
                    <Accordion.Body>
                        <Card>
                            <Card.Header className={'bg-body-secondary'}>Export Vine data</Card.Header>
                            <Card.Body>
                                <Card.Text>
                                    You can export your entire database to a JSON file.
                                </Card.Text>
                                <Button onClick={async () => {
                                    const dbData = await PerformDbOperation('getAll');
                                    ExportDataToFile(dbData, 'application/json', 'vineyard_database.json');
                                }}>
                                    Export JSON
                                </Button>
                            </Card.Body>
                        </Card>
                        <br></br>
                        <Card>
                            <Card.Header className={'bg-body-secondary'}>Export Script Settings</Card.Header>
                            <Card.Body>
                                <Card.Text>
                                    This includes all of your settings and configurations. To export your database, see above.
                                </Card.Text>
                                <Button onClick={() => {
                                    const getSettingsData = exportSettingsToJson('style');
                                    ExportDataToFile(getSettingsData, 'application/json', 'vineyard_settings.json');
                                }}>
                                    Export settings
                                </Button>
                            </Card.Body>
                        </Card>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey={'2'}>
                    <Accordion.Header>Delete Data</Accordion.Header>
                    <Accordion.Body>
                        <Card>
                            <Card.Header className={'bg-body-secondary'}>Delete Vine data</Card.Header>
                            <Card.Body>
                                {ClearVineData(handleOpenModal, setModalData)}
                            </Card.Body>
                        </Card>
                        <br></br>
                        <Card>
                            <Card.Header className={'bg-body-secondary'}>Clear Script Settings</Card.Header>
                            <Card.Body>
                                <Card.Text>
                                    This includes all of your settings and configurations.
                                </Card.Text>
                                <Button variant='danger' onClick={exportSettingsToJson}>
                                    Reset to Default
                                </Button>
                            </Card.Body>
                        </Card>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
            {/*<Container>
                <h1>Data Management</h1>
                <div>
                    {IndexedDBFileSize()}
                </div>
                <Card>
                    <Card.Header className={'bg-body-secondary'}>Import Vine Data</Card.Header>
                    <Card.Body>
                        <Card.Text>
                            Spreadsheet importation coming soon!
                            Importing data will not overwrite existing data unless prompted to.
                            Note: The data being imported must have a unique identifier. Unique identifiers include:
                            ASIN
                            and Order ID.
                        </Card.Text>
                        <p>The following are supported: </p>
                        <ul>
                            <li>Itemized Reports (PDFs only)</li>
                        </ul>
                        {DataImport()}
                    </Card.Body>
                </Card>
                <br></br>
                <Card>
                    <Card.Header className={'bg-body-secondary'}>Import Script Settings</Card.Header>
                    <Card.Body>
                        <Card.Text>
                            If you have a JSON file containing your settings, you can import them here.
                        </Card.Text>
                    </Card.Body>
                </Card>
                <br></br>
                <Card>
                    <Card.Header className={'bg-body-secondary'}>Back up your Vine data</Card.Header>
                    <Card.Body>
                        <Card.Text>
                            You can export your entire database to a JSON file.
                        </Card.Text>
                        <Button onClick={(e) => PullAllData(ExportDbToJson)}>
                            Export JSON
                        </Button>
                    </Card.Body>
                </Card>
                <br></br>
                <Card>
                    <Card.Header className={'bg-body-secondary'}>Export Script Settings</Card.Header>
                    <Card.Body>
                        <Card.Text>
                            This includes all of your settings and configurations. To export your database, see above.
                        </Card.Text>
                        <Button onClick={exportSettingsToJson}>
                            Export settings
                        </Button>
                    </Card.Body>
                </Card>

            </Container>
                */}
            {/* Modal stuff below */}
            <Modal
                show={showModal}
                onHide={handleCloseModal}
                backdrop="static"
                keyboard={false}
                centered
                size="lg"
                fullscreen='md-down'
            >
                <Modal.Header closeButton>
                    <Modal.Title>Results</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalData}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleCloseModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

function CompileYears(event) {
    const groupedItems = {};
    event.forEach(item => {
        const year = new Date(parseInt(item.orderDate)).getFullYear();
        if (!groupedItems[year]) {
            // Adding new year if it isn't available
            groupedItems[year] = false;
        }
    });
    return groupedItems;
}


function ToggleSwitchWithFieldset() {
    // State variables
    const [allYearsSwitch, setAllYearsSwitch] = useState(false);
    const [toggleSwitches, setToggleSwitches] = useState({
        option1: false,
        option2: false,
        option3: false
    });

    // Function to handle toggling main switch
    const handleMainSwitchToggle = () => {
        setAllYearsSwitch(!allYearsSwitch);
    };

    // Function to handle toggling individual switches inside fieldset
    const handleToggleSwitchToggle = (option) => {
        setToggleSwitches({
            ...toggleSwitches,
            [option]: !toggleSwitches[option]
        });
    };

    return (
        <div>
            {/* Main toggle switch */}
            <label>
                <input
                    type="checkbox"
                    checked={allYearsSwitch}
                    onChange={handleMainSwitchToggle}
                />
                Toggle Fieldset
            </label>

            {/* Fieldset with toggle switches */}
            {allYearsSwitch && (
                <fieldset>
                    <legend>Options</legend>
                    <label>
                        <input
                            type="checkbox"
                            checked={toggleSwitches.option1}
                            onChange={() => handleToggleSwitchToggle('option1')}
                        />
                        Option 1
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={toggleSwitches.option2}
                            onChange={() => handleToggleSwitchToggle('option2')}
                        />
                        Option 2
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={toggleSwitches.option3}
                            onChange={() => handleToggleSwitchToggle('option3')}
                        />
                        Option 3
                    </label>
                </fieldset>
            )}
        </div>
    );
}



const ClearScriptSettings = () => {

}

export default DataManagement;
