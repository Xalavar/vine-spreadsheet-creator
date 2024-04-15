import {
    Accordion,
    Button,
    ButtonGroup,
    Card,
    Collapse,
    Dropdown,
    Form,
    OverlayTrigger, Spinner,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip
} from "react-bootstrap";
import React, {Suspense, useEffect, useRef, useState} from "react";
import {DndContext} from "@dnd-kit/core";
import {arrayMove, SortableContext, useSortable,} from "@dnd-kit/sortable";
import {restrictToHorizontalAxis} from '@dnd-kit/modifiers';
import {CSS} from '@dnd-kit/utilities';
import {columnIndexToLetter, DataTypes, DefaultColumn, IndividualColumns, QuestionTooltip} from "./UniversalItems";
import {checkSettingsTree, updateSettingsTree} from "./SettingsTreeFunctions";
import {PerformDbOperation} from "./IndexedDB_Functions";
import FormCheckInput from "react-bootstrap/FormCheckInput";
import {
    FormatAlignLeft,
    FormatAlignCenter,
    FormatAlignRight,
    VerticalAlignCenter,
    VerticalAlignBottom,
    VerticalAlignTop,
    FormatAlignJustify,
    FormatColorText,
    FormatBold,
    FormatItalic,
    FormatUnderlined, FormatSize, Title, Height
} from '@mui/icons-material';
import {ejsSheet} from "./FileParsingMethods";



const SheetAddonToggles = {}

const SheetCustomizationToggles = {
    'enableStatsSheet': {
        'label': 'Enable additional stats sheet',
        'tooltip': 'Enable this if you want some of my extra tables to be generated in your spreadsheet.',
        'toggleable': true
    },
    'enableETVDisplay': {
        'label': 'Show total ETV in main sheet',
        'tooltip': '',
        'toggleable': true
    },
    'truncateProducts': {
        'label': 'Truncate product names',
        'tooltip': 'If you want shorter product names for more consistent row heights without sacrificing visibility, enable this.',
        'toggleable': false
    },
    'exportCurrentYear': {
        'label': 'Export current year only',
        'tooltip': 'By default, ALL recorded product data is exported to the final spreadsheet. Enabling this prevents that.',
        'toggleable': true
    },
    'crossOutEtvs': {
        'label': 'Cross out ETV on Excluded orders',
        'tooltip': 'When a product is marked as Excluded, the ETV for it will be crossed out.',
        'toggleable': true
    },
    'linkOrderId': {
        'label': 'Add hyperlinks to Order ID',
        'tooltip': 'Links to your Order Details page',
        'toggleable': true
    },
    'linkAsin': {
        'label': 'Add hyperlinks to ASIN',
        'tooltip': 'Links to the product page',
        'toggleable': true
    },
    'linkSeller': {
        'label': 'Add hyperlinks to Seller',
        'tooltip': 'Links to seller\'s storefront page',
        'toggleable': true
    },
    'useMilitaryTime': {
        'label': 'Use 24-hour time format',
        'tooltip': '',
        'toggleable': false
    },
    'statsOnTop': {
        'label': 'Display stats on top',
        'tooltip': '',
        'toggleable': true
    },
    'parseVariantNames': {
        'label': 'Parse variant from product',
        'tooltip': 'This is intended to parse the variant from the product title. Note: Might not always work.',
        'toggleable': false
    },
    'greyOutProducts': {
        'label': 'Grey out Deleted Products',
        'tooltip': '',
        'toggleable': false
    }
}

const DataExtractionToggles = {
    'saveProductImages': {
        'label': 'Save product photos ⚠️',
        'tooltip': 'WARNING: May dramatically increase file size. Not recommended for devices with low storage. Each image is roughly 10-15 kB.',
        'toggleable': true
    },
    'saveShippingInfo': {
        'label': 'Save shipping and delivery info',
        'tooltip': '',
        'toggleable': true
    },
    'saveQueue': {
        'label': 'Save queue type upon ordering',
        'tooltip': 'If you want to save the queue type upon requesting future products, then enable this.',
        'toggleable': false
    },/*
    '': {
        'label': '',
        'tooltip': '',
        'toggleable': true
    },
    '': {
        'label': '',
        'tooltip': '',
        'toggleable': true
    }*/
}

const DataTypeCategory = [
    'Order Details',
    'Review Details',
    'Shipping Details'
]

const VerticalAlignButtons = [
    {
        name: 'Top', value: 'top', icon: (
            /*
            <svg className="bi bi-align-top" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <rect width="4" height="12" rx="1" transform="matrix(1 0 0 -1 6 15)"></rect>
                <path d="M1.5 2a.5.5 0 0 1 0-1v1zm13-1a.5.5 0 0 1 0 1V1zm-13 0h13v1h-13V1z"></path>
            </svg>
            */
            <VerticalAlignTop/>
        )
    },
    {
        name: 'Middle',
        value: 'middle',
        icon: (
            /*
            <svg className="bi bi-align-middle" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <path
                    d="M6 13a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v10zM1 8a.5.5 0 0 0 .5.5H6v-1H1.5A.5.5 0 0 0 1 8zm14 0a.5.5 0 0 1-.5.5H10v-1h4.5a.5.5 0 0 1 .5.5z"></path>
            </svg>*/

            <VerticalAlignCenter/>
        )
    },
    {
        name: 'Bottom',
        value: 'bottom',
        icon: (
            /*<svg className="bi bi-align-bottom" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <rect width="4" height="12" x="6" y="1" rx="1"></rect>
                <path d="M1.5 14a.5.5 0 0 0 0 1v-1zm13 1a.5.5 0 0 0 0-1v1zm-13 0h13v-1h-13v1z"></path>
            </svg>*/

            <VerticalAlignBottom/>
        )
    }
]

const HorizontalAlignButtons = [
    {
        name: 'Left', value: 'left', icon: (
            /*
            <svg className="bi bi-align-start" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1.5 1a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-1 0v-13a.5.5 0 0 1 .5-.5z"></path>
                <path d="M3 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"></path>
            </svg>
            */
            <FormatAlignLeft/>
        )
    },
    {
        name: 'Center',
        value: 'center',
        icon: (
            /*
            <svg className="bi bi-align-center" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <path
                    d="M8 1a.5.5 0 0 1 .5.5V6h-1V1.5A.5.5 0 0 1 8 1zm0 14a.5.5 0 0 1-.5-.5V10h1v4.5a.5.5 0 0 1-.5.5zM2 7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7z"></path>
            </svg>
            */

            <FormatAlignCenter/>
        )
    },
    {
        name: 'Right',
        value: 'right',
        icon: (
            /*
            <svg className="bi bi-align-end" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M14.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 1 0v-13a.5.5 0 0 0-.5-.5z"></path>
                <path d="M13 7a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"></path>
            </svg>
            */

            <FormatAlignRight/>
        )
    },
    {
        name: 'Justify',
        value: 'justify',
        icon: (
            /*
            <svg className="bi bi-align-end" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M14.5 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 1 0v-13a.5.5 0 0 0-.5-.5z"></path>
                <path d="M13 7a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"></path>
            </svg>
            */

            <FormatAlignJustify/>
        )
    }
]

const FontStyleButtons = [
    {
        name: 'Bold', value: false, icon: (
            /*
            <svg className="bi bi-type-bold" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <path
                    d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z"></path>
            </svg>*/
            <FormatBold/>
        )
    },
    {
        name: 'Italics',
        value: false,
        icon: (
            /*<svg className="bi bi-type-italic" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <path
                    d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z"></path>
            </svg>*/

            <FormatItalic/>
        )
    },
    {
        name: 'Underline',
        value: false,
        icon: (
            /*<svg className="bi bi-type-underline" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                 fill="currentColor" viewBox="0 0 16 16">
                <path
                    d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57-1.709 0-2.687-1.08-2.687-2.57V3.136zM12.5 15h-9v-1h9v1z"></path>
            </svg>*/
            <FormatUnderlined/>
        )
    }
]

const FontFamilyOptions = [
    { "name": "Arial", "value": "Arial" },
    { "name": "Calibri", "value": "Calibri" },
    { "name": "Times New Roman", "value": "Times New Roman" },
    { "name": "Cambria", "value": "Cambria" },
    { "name": "Verdana", "value": "Verdana" },
    { "name": "Tahoma", "value": "Tahoma" },
    { "name": "Courier New", "value": "Courier New" },
    { "name": "Comic Sans MS", "value": "Comic Sans MS" },
    { "name": "Georgia", "value": "Georgia" },
    { "name": "Trebuchet MS", "value": "Trebuchet MS" },
    { "name": "Palatino Linotype", "value": "Palatino Linotype" },
    { "name": "Franklin Gothic Medium", "value": "Franklin Gothic Medium" },
    { "name": "Segoe UI", "value": "Segoe UI" },
    { "name": "Century", "value": "Century" },
    { "name": "Garamond", "value": "Garamond" }
];

/*
* ALL OTHER FUNCTIONS FOR ADDING STUFF
*/


/**
 * Intended for generating toggle switches inside the data cards.
 *
 * Likely going to deprecate this since the only feature that utilizes this is the Hide toggle.
 * @param label
 * @param tooltip
 * @param lsRef
 * @param disabled
 * @param defaultValue
 * @param style
 * @returns {Element}
 * @constructor
 */
function CheckboxForColumn({label, tooltip, lsRef, disabled, defaultValue, style}) {
    return (
        <label className="form-label d-block">
            {label}
            <Form.Check
                type="switch"
                data-ls-ref={lsRef}
                defaultValue={defaultValue}
                disabled={disabled}
                data-bs-toggle="tooltip"
                title={tooltip}
                style={style}
            />
        </label>
    )
}

/**
 * Takes a nested object and generates toggle switches for each inner object.
 *
 * Each toggle switch is tied to the local storage settings.
 * @param header
 * @param details
 * @param options
 * @returns {Element}
 * @constructor
 */
function GenerateOptions({header, details, options}) {
    // State to manage the checked state of each switch based on its id
    const [switchStates, setSwitchStates] = useState(() => {
        // Initialize switchStates with values from local storage if available, or default to an empty object
        const localData = JSON.parse(localStorage.getItem('VSE_settings'));
        const generatedStates = {};

        Object.entries(options).forEach(([key, value]) => {
            if (localData && localData.hasOwnProperty(key)) {
                // Use value from local storage if available
                generatedStates[key] = localData[key];
            } else {
                // Use default value
                generatedStates[key] = false;
            }
        });

        //console.log(generatedStates);

        return generatedStates;
    });

    // Function to handle switch change
    const handleSwitchChange = (event) => {
        const switchId = event.target.id;
        let newState = switchStates; //{...switchStates, [switchId]: event.target.checked};
        newState[switchId] = event.target.checked;
        console.log('switch states', switchStates);
        //console.log(switchId)
        console.log(newState)
        updateSettingsTree(switchId, event.target.checked);
        setSwitchStates(newState);
    };

    const GenerateLabel = (value, key) => {

        return (
            <>
            </>
        )
    }

    return (
        <div>
            <h4>{header}</h4>
            <p className="mb-0">{details}</p>
            <div className={'vstack d-grid'} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
                {options && Object.entries(options).map(([key, value]) => {
                    const isDisabled = value.toggleable ? '' : 'disabled';
                    return (
                        <Form.Check className={'form-check-inline'} type={'switch'} key={key}>
                            <Form.Check.Input
                                className={'d-inline-block'}
                                id={key}
                                disabled={isDisabled}
                                defaultChecked={switchStates[key]} // Pass the checked state from switchStates object
                                onChange={(e) => handleSwitchChange(e)} // Call handleSwitchChange on switch change
                            >
                            </Form.Check.Input>
                            <Form.Check.Label
                                className={'form-check-label'}
                                htmlFor={key}
                                style={{userSelect: 'none'}}
                                //onClick={(e) => e.preventDefault()} // Call handleSwitchChange on switch change
                            >
                                {value.label}
                            </Form.Check.Label>
                            {/* Putting the text of the label here prevents it from toggling the switch */}
                            <QuestionTooltip
                                text={(value.tooltip) ? value.tooltip : null}
                            />
                        </Form.Check>
                    );
                })}
            </div>
        </div>
    );
}

function SelectOption({label, options, disabled, defaultValue, lsKey}) {


    return (
        //<div className="form-check form-switch form-check-inline">
        <Form.Label className="d-block">
            {label}
            <Form.Select defaultValue={defaultValue} disabled={disabled}>
                {options.map(option => (
                    <option key={option.value} value={option.value} defaultValue={option.selected}>
                        {option.label}
                    </option>
                ))}
            </Form.Select>
        </Form.Label>
        //</div>
    );
}

function GenerateDropdownOld({options, label, lsRef, defaultValue, disabled}) {
    const groupedOptions = {};

    // Group options by labelGroup if it exists
    Object.entries(options).forEach(([key, value]) => {
        const optgroupName = value.labelGroup || ''; // Default to empty string if labelGroup doesn't exist
        if (!groupedOptions[optgroupName]) {
            groupedOptions[optgroupName] = [];
        }
        groupedOptions[optgroupName].push({key, name: value.name});
    });

    return (
        <label className="form-label d-block">
            {label}
            <Form.Select style={{display: 'block', width: 'auto'}} id={lsRef} data-ls-ref={lsRef} defaultValue={defaultValue}
                         disabled={disabled}>
                {Object.entries(groupedOptions).map(([labelGroup, options]) => (
                    labelGroup ? // Check if labelGroup exists
                        <optgroup key={labelGroup} label={labelGroup}>
                            {options.map(option => (
                                <option key={option.key} value={option.key}>{option.name}</option>
                            ))}
                        </optgroup>
                        :
                        options.map(option => ( // Render options directly if labelGroup doesn't exist
                            <option key={option.key} value={option.key}>{option.name}</option>
                        ))
                ))}
            </Form.Select>
        </label>
    );
}

function GenerateDropdown({options, label, defaultValue, name, path, onChange}) {
    const [dropdownValue, setDropdownValue] = useState(defaultValue);

    return (
        //<div className="form-check form-switch form-check-inline">
        <Form.Label className="d-block">
            {label}
            <Form.Select
                name={name}
                value={dropdownValue}
                onChange={(e) => {
                    onChange(e, path, e.target.value);
                    setDropdownValue(e.target.value);
                }}
            >
                {options.map((option, index) => (
                    <option
                        key={option.name}
                        value={option.value}
                    >
                        {option.name}
                    </option>
                ))}
            </Form.Select>
        </Form.Label>
        //</div>
    );
}

function GenerateFontFamilyOptions({options, label, defaultValue, name, path, onChange}) {
    const [dropdownValue, setDropdownValue] = useState(defaultValue);

    return (
        //<div className="form-check form-switch form-check-inline">
        <Form.Label className="d-block">
            {label}
            <Form.Select
                name={name}
                value={dropdownValue}
                style={{fontFamily: dropdownValue}}
                onChange={(e) => {
                    onChange(e, path, e.target.value);
                    setDropdownValue(e.target.value);
                }}
            >
                {options.map((option, index) => (
                    <option
                        key={option.name}
                        value={option.value}
                        style={{fontFamily: option.value}}
                    >
                        {option.name}
                    </option>
                ))}
            </Form.Select>
        </Form.Label>
        //</div>
    );
}


/*
function GenerateRadioButtons({ options, label, lsRef, defaultValues, disabled, lsPos, independent }) {

    const [checked, setChecked] = useState(false);
    const [radioValue, setRadioValue] = useState('1');

    const finalName = (!independent) ? lsRef+(lsPos.match(/\d+/)[0]) : null;

    return (

        <label className="form-label d-block">
            {label}
            <ToggleButtonGroup className="mb-2" type={(!independent) ? 'radio' : 'checkbox'} name={finalName} data-ls-ref={(!independent) ? lsRef : null} defaultValues={(!independent) ? defaultValues : null} disabled={(!independent) ? disabled : null}>
                {
                    (!independent) ?
                        options.map((option, index) => (
                            <ToggleButton
                                id={lsPos+'-'+lsRef+'-'+option.value}
                                key={option.value}
                                type="radio"
                                variant="outline-primary"
                                value={option.value}
                                checked={radioValue === option.value}
                                onChange={(e) => {
                                    updateSettingsTree(lsPos+'.'+lsRef, option.value);
                                    setRadioValue(e.currentTarget.value);
                                }}
                            >
                                {option.icon}
                            </ToggleButton>
                        ))
                        :
                        options.map((option, index) => (
                            <ToggleButton
                                id={lsPos+'-'+option.name.toLowerCase()}
                                key={option.name.toLowerCase()}
                                type="checkbox"
                                variant="outline-primary"
                                value={option.value}
                                checked={checked === option.value} // get local storage value
                                onChange={(e) => {
                                    updateSettingsTree(lsPos+'.'+option.name.toLowerCase(), e.currentTarget.checked);
                                    setChecked(e.currentTarget.checked);
                                }}
                            >
                                {option.icon}
                            </ToggleButton>
                        ))

                }
            </ToggleButtonGroup>
        </label>
    );
}
*/

// TODO: Combine the Radio and Toggle Buttons functions
/**
 * Creates buttons that act as radio buttons.
 *
 * Only one option can be active at a time.
 * @param options
 * @param label
 * @param lsRef
 * @param defaultValue
 * @param disabled
 * @param lsPos
 * @returns {Element}
 * @constructor
 */
function GenerateRadioButtons({options, label, lsRef, defaultValue, disabled, lsPos, onChange}) {

    //console.log('default for radio:', defaultValue)

    //const initializedValue = (defaultValue && defaultValue[lsRef]) ? defaultValue[lsRef] : 0;
    /*
        if (defaultValue !== null) {

            console.log('Pos: ',lsPos);
            console.log('Defaults: ',defaultValue);

        }*/

    const [radioValue, setRadioValue] = useState(defaultValue);

    return (
        {label} ?
            (<label className="form-label d-block">
                {label}
                <ButtonGroup className="mb-2" data-ls-ref={lsRef} defaultValue={radioValue} disabled={disabled}>
                    {options.map((option, index) => (
                        <ToggleButton
                            id={lsPos + '.' + option.value}
                            key={option.value}
                            type="radio"
                            variant='outline-light'
                            value={option.value}
                            checked={radioValue === option.value}
                            onChange={(e) => {
                                onChange(e, lsPos.split('.')[1]+'.'+lsRef, option.value)
                                setRadioValue(option.value)
                            }}
                            title={option.name}
                        >
                            {option.icon}
                        </ToggleButton>
                    ))}
                </ButtonGroup>
            </label>)
            : (<ButtonGroup className="mb-2" data-ls-ref={lsRef} defaultValue={defaultValue} disabled={disabled}>
                {options.map((option, index) => (
                    <ToggleButton
                        id={lsPos + '.' + option.value}
                        key={option.value}
                        type="radio"
                        variant='outline-light'
                        value={option.value}
                        checked={radioValue === option.value}
                        onChange={(e) => {
                            onChange(e, lsPos.split('.')[1]+'.'+lsRef, option.value)
                            setRadioValue(option.value)
                        }}
                    >
                        {option.icon}
                    </ToggleButton>
                ))}
            </ButtonGroup>)
    );
}

/**
 * Similar to GenerateRadioButtons(), this creates buttons that are toggleable.
 * @param options
 * @param label
 * @param lsRef
 * @param defaultValue
 * @param disabled
 * @param lsPos
 * @returns {Element}
 * @constructor
 */
function GenerateToggleButtons({options, label, defaultValues, disabled, prefixName, lsPos, onChange}) {

    const result = options.map((item, index) => {
        return (!defaultValues?.[item.name.toLowerCase()]) ? null : index;
    })

    const [checkedState, setCheckedState] = useState(result);

    const updateKey = (key, value) => {
        setCheckedState(prevState => ({
            ...prevState,
            [key]: value
        }));
    };

    return (
        <label className="form-label d-block">
            <ToggleButtonGroup className="mb-2" type='checkbox' defaultValue={result} >
                {options.map((option, index) => (
                    <ToggleButton
                        id={lsPos + '-' + option.name.toLowerCase()}
                        key={option.name.toLowerCase()}
                        variant='outline-light'
                        value={index}
                        //defaultChecked={checkedState[index]}
                        //checked={checkedState[option.name.toLowerCase()]} // get local storage value //defaultValues[option.name.toLowerCase()]
                        onChange={(e) => {
                            //console.log('state:', checkedState[option.name.toLowerCase()])
                            onChange(e, lsPos.split('.')[1]+'.'+option.name.toLowerCase(), e.target.checked);
                            updateKey(index, e.target.checked);
                        }}
                        title={option.name}
                    >
                        {option.icon}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </label>
    );
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
    //console.log('Target: ', target)
    return target;
}

/**
 * This is intended to determine and return the order of data types from local storage, if available.
 * @constructor
 */
const PullFromLocalStorage = () => {
    // -- Get the column order of items from local storage --
    let localData = JSON.parse(localStorage.getItem('VSE_settings')) || {};

    //console.log('Pulled from local storage', localData)
    if (localData.hasOwnProperty(IndividualColumns)) {
        if (localData[IndividualColumns].length > 0) {

            // TODO: -- Check if there are any data types in DataTypes[] that aren't in dataColumns and vice versa
            // Add any missing data types and remove (or ignore) ones that aren't in DataTypes[]

            // Locate missing data types from local data
            const missingObjects = DataTypes.filter(dataType => !localData[IndividualColumns].some(dataType2 => dataType2.dataType === dataType.value));

            //console.log('Local data is missing the following: ', missingObjects)

            // Locate extraneous (possibly custom) data types in local
            const extraObjects = localData[IndividualColumns].filter(dataType => !DataTypes.some(dataType2 => dataType2.value === dataType.dataType));

            //console.log('Extra data types found: ', extraObjects);
            // Push the missing data type objects to local data
            missingObjects.forEach((scriptItem) => {
                localData[IndividualColumns].push({dataType: scriptItem.value});
            })

            // TODO: Deal with extra items
            extraObjects.forEach((item) => {
                // Remove items from localData[IndividualColumns]
                localData[IndividualColumns] = localData[IndividualColumns].filter(obj => obj.dataType !== item.dataType);
            });


        }
    } else {
        // No prior data in local storage, so we'll initialize it
        //dataColumns = [];
        localData[IndividualColumns] = [];
        //console.log('THERE WAS NO PRIOR DATA');
        //refinedData[IndividualColumns] = [];
        DataTypes.forEach((scriptItem, index) => {
            localData[IndividualColumns].push({dataType: scriptItem.value});
        })
        // if the local storage item doesn't exist, we'll make our own
        //DataTypes.map((item) => item.value)

    }


    //console.log('Refined data:', refinedData)
    //const updatedSettings = deepMerge(JSON.parse(localStorage.getItem('VSE_settings')), refinedData);

    //console.log('Updated settings:', updatedSettings)

    localStorage.setItem('VSE_settings', JSON.stringify(localData));

    return localData[IndividualColumns];

    //return refinedData[IndividualColumns];


}

function getNameFromDataType(val) {
    for (let object of DataTypes) {
        if (object.value === val) {
            return object.name;
        }
    }
}

const CopyPasteClearButtons = (keys) => {



    return (
        <>
            <i className="la la-copy"></i>
            <i className="la la-clipboard"></i>
            <i className="la la-remove"></i>
        </>

    )

}

function GenerateColumns() {
    const [dataTypesArray, setDataTypesArray] = useState([]);
    const [collapsibleSettings, setcollapsibleSettings] = useState([]);
    //const [defaultConfig, setDefaultConfig] = useState({});


    // Fetch data from local storage once during component initialization
    useEffect(() => {
        const dataArray = PullFromLocalStorage(); // initialize from storage
        setDataTypesArray(dataArray);
    }, []); // Empty dependency array ensures this effect runs only once

    // useEffect runs when the value(s)/dep(s) at the end change(s)

    //testingLocalStorage()

    // TODO: Need to address neighboring columns that are shifted over after a drag and drop
    // Swaps the values of the cards
    function handleDragEnd(event) {
        const {active, over} = event;
        console.log(event)
        if (active && over) {
            if (active.id !== over.id) {
                console.log('Data types array: ',dataTypesArray);
                setDataTypesArray((items) => {
                    const oldIndex = items.findIndex((item) => item.dataType === active.id);
                    const newIndex = items.findIndex((item) => item.dataType === over.id);

                    // Move the item within the array
                    const updatedItems = arrayMove(items, oldIndex, newIndex);

                    console.log('Updated items: ',updatedItems);

                    // -- Update local storage values --
                    updateSettingsTree(IndividualColumns, updatedItems);

                    return updatedItems;

                });
            }
        }
    }

    function SortableItem({item, index, name, dataTypesArray, setDataTypesArray}) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({id: item.dataType});

        const style = {
            transform: transform ? CSS.Translate.toString(transform) : '',
            transition,
        };


        const [settingsToggle, setSettingsToggle] = useState();

        const handleValueChange = (event, lsRef, differentVal) => {
            const formId = lsRef || event.target.id;
            const determineValue = differentVal;
            const zeroIndex = (index-1);
            const path = 'columnManagement.'+zeroIndex+'.'+formId;
            console.log(`Path: ${path} | Value: ${determineValue}`);

            // -- Update local storage values --
            updateSettingsTree(path, determineValue);

            setDataTypesArray((items) => {
                console.log('formid: ', formId)
                let test = items;

                // A fix for the issue where formIds like "header.bold" are treated as key names
                const [parentKey, childKey] = formId.split('.');

                /*
                // Check if the parent key exists in the test object
                if (!(zeroIndex in test)) {
                    test[zeroIndex] = {}; // Initialize the object if it doesn't exist
                }*/

                // Check if the parent key contains the nested object
                if (!(parentKey in test[zeroIndex])) {
                    test[zeroIndex][parentKey] = {}; // Initialize the nested object if it doesn't exist
                }

                if (childKey) {
                    // Update the nested property with the new value
                    test[zeroIndex][parentKey][childKey] = determineValue;
                } else {
                    test[zeroIndex][formId] = determineValue;
                }

                //test[zeroIndex][formId] = determineValue;


                return test;

            });
            //setSettingsState(newState);
        };

        const HideButton = ({defaultState}) => {
            const [hideState, setHideState] = useState(defaultState);
            const toggleHideState = (e) => {
                setHideState(!hideState); // setting the state
                handleValueChange(e, "isHidden", !hideState);
                const dataCard = e.target.closest("div[id*='col-'] > div");
                (!hideState) ? dataCard.classList.add('hidden-data') : dataCard.classList.remove('hidden-data');
            };

            const tooltipText = (hideState) ? "Unhide column" : "Hide column";
            let iconClass = (hideState) ? "fas fa-eye-slash" : "fas fa-eye";
            return (
                <OverlayTrigger placement="top" overlay={<Tooltip>{tooltipText}</Tooltip>} delay={{ show: 200, hide: 600 }}>
                    <i onClick={(e) => toggleHideState(e)} className={'hide-column-btn '+iconClass}></i>
                </OverlayTrigger>
            )

        }

        // Apply a custom classname when dragging
        const customClassName = isDragging ? 'dragging' : '';
        const isColumnHidden = (item.isHidden) ? 'hidden-data' : '';

        return (
            <Card
                data-ls-ref={item.dataType}
                ref={setNodeRef}
                style={style}
                id={item.dataType}
                className={`bg-body-tertiary border rounded column-wrapper ${customClassName} ${isColumnHidden} data-card`}
            >
                <Card.Header className={`data-card-header bg-body-secondary`}>
                    <span style={{width: 'max-content'}} >{name}</span>

                    <div className="data-card-buttons">
                        <HideButton localPath={item.dataType+'.isHidden'}
                                    defaultState={(item.hasOwnProperty('isHidden')) ? item.isHidden : false}
                        />
                        <i className="fas fa-arrows-alt drag-handle" {...listeners} {...attributes} ></i>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Form.Label style={{width: 'max-content'}} onClick={(e) => e.preventDefault()}>
                        <GenerateLabelHeader name={'Custom Header'} tooltip={`The title of the column.`} />
                        <Form.Control
                            type="text"
                            placeholder={name}
                            name={`${item.dataType}-display-name`}
                            defaultValue={(item.hasOwnProperty('displayName')) ? item.displayName : null}
                            onChange={(e) => handleValueChange(e, "displayName", e.target.value)}
                        />
                    </Form.Label>
                    <br></br>
                    <Form.Label style={{display: 'inline-block'}} onClick={(e) => e.preventDefault()}>
                        <GenerateLabelHeader name={'Column Width'} icon={<Height style={{transform: 'rotateZ(90deg)'}} />} />

                        <Form.Control
                            type="number"
                            min={1}
                            max={144}
                            title="size in pixels"
                            data-ls-ref="colWidth"
                            name={`${item.dataType}-column-width`}
                            defaultValue={(item.hasOwnProperty('colWidth')) ? item.colWidth : null}
                            onChange={(e) => handleValueChange(e, "colWidth", e.target.value)}
                        />
                    </Form.Label>
                </Card.Body>
                <Accordion alwaysOpen>
                    <TextFormattingOptions
                        classname="custom-header-options"
                        type="Header"
                        datatype={item.dataType}
                        lsPos={item.dataType+'.header'}
                        defaultValues={(item.hasOwnProperty('header')) ? item.header : null}
                        onChange={(e, lsRef, overrideValue) => handleValueChange(e, lsRef, overrideValue)}
                    />

                    <TextFormattingOptions
                        classname="custom-body-options"
                        type="Body"
                        datatype={item.dataType}
                        lsPos={item.dataType+'.body'}
                        defaultValues={(item.hasOwnProperty('body')) ? item.body : null}
                        onChange={(e, lsRef, overrideValue) => handleValueChange(e, lsRef, overrideValue)}
                    />
                </Accordion>
            </Card>
        );
    }

    console.log("New render. Here's the current data: ", dataTypesArray)

    return (
        <div id={IndividualColumns} style={{overflow: 'auto'}}>
            {/* Maybe add the default config here? */}
            <DndContext modifiers={[restrictToHorizontalAxis]} onDragEnd={handleDragEnd}>
                <SortableContext items={dataTypesArray.map((item) => item.dataType)}>
                    {dataTypesArray.map((item, index) => (
                        <div key={'col-' + (index + 1)} id={'col-' + (index + 1)}>
                            <h3 className="fw-bold text-center column-id">Column {columnIndexToLetter(index + 1)}</h3>
                            <SortableItem dataTypesArray={dataTypesArray} setDataTypesArray={setDataTypesArray} item={item} index={index+1} name={getNameFromDataType(item.dataType)}/>
                        </div>
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
}

const tableStyles = {
    'TableStyleLight1': {'name': 'Ice Blue'}
}

let TablePreview;

/**
 * Generates a list of table theme previews for spreadsheet exportation.
 *
 * Order: left to right, top to bottom
 * @returns {*[]}
 * @constructor
 */
function PopulateTableStyles() {
    // Effect to initialize the dropdown value from local storage on component mount

    const storedValue = checkSettingsTree('tableTheme');

    const totalColumns = 7; // the number of sheet icons per row

    let rowMarker = totalColumns; // for keeping track of which row is being accessed in the sprite sheet

    const themeVariants = {
        'TableStyleNone': 1,
        'TableStyleLight': 21,
        'TableStyleMedium': 28,
        'TableStyleDark': 11
    }

    const generateRow = (name, count) => {
        //console.log("Count: "+count)
        const rowHeader = (name.includes("None")) ? 'None' : name.replace('TableStyle', '') + ' Styles';
        let rowItems = [];
        for (let i = 0; i < count; i++) {
            const x = -((i % totalColumns) * 138);
            const y = -(Math.floor((i + rowMarker - 1) / totalColumns) * 108);
            const styleId = (name.includes("None")) ? 'None' : `${name}${i + 1}`;
            /*console.log(`X: ${x} | Y: ${y}`);*/
            rowItems.push(
                <Dropdown.Item
                    key={styleId}
                    eventKey={styleId}
                    onDragStart={(e) => e.preventDefault()}>
                    <div className="table-theme-option" id={styleId}
                         style={{backgroundPosition: `${x}px ${y}px`}}></div>
                </Dropdown.Item>
            );

            // Also check if this is the stored value, so we can use it as a preview
            if (styleId === storedValue) {
                TablePreview = `${x}px ${y}px`;
                //let dest = document.querySelector('.preview.table-theme-preview');
                //dest.style.backgroundPosition = `${x}px ${y}px`;
            }

        }
        return <div key={rowHeader} className="dropdown-items">{rowItems}</div>
    }

    let compiledRows = [];
    let index = 0;
    for (const type in themeVariants) {

        let header = type.replace('TableStyle', '') + ' Styles';

        if (header.includes("None")) {
            header = "No Style";
        }

        // Generate the rows
        let row = generateRow(type, themeVariants[type]);

        const count = themeVariants[type];

        rowMarker += count;

        // Only add divider if there's a previous row
        if (compiledRows.length > 0) {
            compiledRows.push(
                <Dropdown.Divider key={`tableStyle_divider_${index}`}/>
            );
        }

        compiledRows.push(
            <Dropdown.Header key={`tableStyle_header_${index}`}>{header}</Dropdown.Header>
        );

        compiledRows.push(row);
        index++;
    }

    return compiledRows;
}

function TableStylesDropdown() {

    const [tableStyle, setTableStyle] = useState("None"); // State to track the selected item

    const TableStyles = PopulateTableStyles();

    // Effect to initialize the dropdown value from local storage on component mount
    useEffect(() => {
        const storedValue = checkSettingsTree('tableTheme');
        let valToUse;
        if (storedValue) {
            valToUse = storedValue;
        } else {
            valToUse = "None";
        }
        updatePreview(valToUse);
        setTableStyle(valToUse);
        //setActiveItem(valToUse);

    }, []);
    /*
        const setActiveItem = (id) => {
            document.getElementById(id).parentElement.classList.add('active');
        }
    */
    const updatePreview = (eventKey) => {
        if (!document.getElementById(eventKey)) {
            document.querySelector('.preview.table-theme-option').style.backgroundPosition = TablePreview;
        } else {
            const target = document.getElementById(eventKey).style.backgroundPosition;
            console.log(target)
            let dest = document.querySelector('.preview.table-theme-option');
            dest.style.backgroundPosition = target;
        }
    }


    // Event handler to update local storage value
    const handleSelect = (eventKey) => {
        setTableStyle(eventKey); // Update useState
        updateSettingsTree('tableTheme', eventKey); // Update local storage
        updatePreview(eventKey);
    };

    return (
        <>
            <Dropdown className="table-themes-list" onSelect={handleSelect}>
                <Dropdown.Toggle id="dropdown-basic">
                    Table Styles
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {TableStyles}
                </Dropdown.Menu>
            </Dropdown>
        </>
    );
}


/**
 * Used for generating an accordion item within the card for editing options like bold, italics, underline, etc. text options for header and cells
 * @param classname
 * @param type
 * @param datatype
 * @param lsPos
 * @param defaultValues
 * @param onChange
 * @returns {Element}
 * @constructor
 */
function TextFormattingOptions({classname, type, datatype, lsPos, defaultValues, onChange}) {
    const [open, setOpen] = useState(false);
    const collapseRef = useRef(null);

    const handleToggle = () => {
        setOpen(!open);
    };
    return (
        <>
            <Accordion.Item eventKey={datatype+'-'+type.toLowerCase()} className={'column-card-settings-toggle'}>
                <Accordion.Header>
                    {type}
                </Accordion.Header>
                <Accordion.Body>
                    <div className={classname}>
                        {/* Add copy/paste/clear buttons here */
                            /*(lsPos.includes('columnDefaults')) ? console.log('Test:  ',defaultValues) : null*/}
                        <h5>Style</h5>
                        <fieldset className={'centered-column-forms'}>
                            <GenerateToggleButtons
                                //prefixName={datatype + '-' + type.toLowerCase()}
                                label="Style"
                                options={FontStyleButtons}
                                lsPos={lsPos}
                                defaultValues={defaultValues}
                                onChange={(e, lsRef, overrideValue) => onChange(e, lsRef, overrideValue)}
                            />
                        </fieldset>
                        <h5>Vertical Align</h5>
                        <fieldset className={'centered-column-forms'}>
                            <GenerateRadioButtons
                                options={VerticalAlignButtons}
                                lsPos={lsPos}
                                defaultValue={defaultValues?.vertical || 'top'}
                                lsRef="vertical"
                                onChange={(e, lsRef, overrideValue) => onChange(e, lsRef, overrideValue)}
                            />
                        </fieldset>
                        <h5>Horizontal Align</h5>
                        <fieldset className={'centered-column-forms'}>
                            <GenerateRadioButtons
                                options={HorizontalAlignButtons}
                                defaultValue={defaultValues?.horizontal || 'left'}
                                lsRef="horizontal"
                                lsPos={lsPos}
                                onChange={(e, lsRef, overrideValue) => onChange(e, lsRef, overrideValue)}
                            />
                        </fieldset>
                        <h5>Font</h5>
                        <fieldset className='font-settings'>
                            <Form.Label>
                                <GenerateLabelHeader name={'Size'} icon={<FormatSize/>}/>
                                <Form.Control
                                    type="number"
                                    min={1}
                                    max={144}
                                    title="size in pixels"
                                    placeholder="12"
                                    name={`${datatype}-${type.toLowerCase()}-font-size`}
                                    defaultValue={defaultValues?.['fontSize']}
                                    onChange={(e) => onChange(e, lsPos.split('.')[1] + '.fontSize', e.target.value)}
                                />
                            </Form.Label>
                            <br></br>
                            <ColorPicker
                                //label={<>Color <FormatColorText/></>}
                                label={<GenerateLabelHeader name={'Color'} icon={<FormatColorText /*style={{fontVariationSettings: '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 24'}}*/ />} tooltip={'To reset the color, clear the text box field.'} />}
                                defaultValue={defaultValues?.['fontColor']}
                                name={`${datatype}-${type.toLowerCase()}-font-color`}
                                path={lsPos.split('.')[1] + '.fontColor'}
                                onChange={(e, lsRef, overrideValue) => onChange(e, lsRef, overrideValue)}
                            />
                            <br></br>
                            <GenerateFontFamilyOptions
                                label={<GenerateLabelHeader name={'Font Family'} icon={<Title />}/>}
                                //label="Font Family"
                                options={FontFamilyOptions}
                                defaultValue={defaultValues?.['fontFamily'] || 'Calibri'}
                                name={`${datatype}-${type.toLowerCase()}-font-family`}
                                path={lsPos.split('.')[1] + '.fontFamily'}
                                onChange={(e, lsRef, overrideValue) => onChange(e, lsRef, overrideValue)}
                            />
                        </fieldset>
                    </div>

                </Accordion.Body>
            </Accordion.Item>
            {/*</Collapse>*/}
        </>
    )
}

const GenerateLabelHeader = ({name, icon, tooltip}) => {
    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            {icon && icon}
            {name}
            {tooltip && (
                <QuestionTooltip text={tooltip} />
            )}
        </div>
    );
}

const FontFamilies = [
    "Arial",
    "Calibri",
    "Times New Roman",
    "Cambria",
    "Verdana",
    "Tahoma",
    "Courier New",
    "Comic Sans MS",
    "Georgia",
    "Trebuchet MS",
    "Palatino Linotype",
    "Franklin Gothic Medium",
    "Segoe UI",
    "Century",
    "Garamond"
];

const ColorPicker = ({defaultValue, label, name, path, onChange}) => {
    // State to manage the color value
    const [color, setColor] = useState(defaultValue);
    const [hexTextField, setHexTextField] = useState(defaultValue);
    const [hexIsValid, setHexIsValid] = useState(true);

    // Function to handle changes in the color input
    const handleColorChange = (e) => {
        const newHexCode = e.target.value; // Get the new hex code value

        if (e.target.type === "text") {
            if (newHexCode.length === 0) {
                // Accept null input (basically the equivalent of clearing the color)
                // Or just remove the # if it's the only character left
                setColor('#000000');
                setHexTextField('');
                onChange(e, path, '');
                setHexIsValid(true);
            } else if (/^#[0-9A-F]{0,5}$/i.test(newHexCode)) {
                // Adds the # before the valid character when the text field is empty
                setHexTextField(newHexCode);
                setHexIsValid(false);
            } else if (/^[0-9A-F]$/i.test(newHexCode)) {
                // Adds the # before the valid character when the text field is empty
                setHexTextField('#'+newHexCode);
                setHexIsValid(false);
            } else if (/^#[0-9A-F]{6}$/i.test(newHexCode)) {
                // valid hex code
                setColor(newHexCode);
                setHexTextField(newHexCode);
                onChange(e, path, newHexCode);
                setHexIsValid(true);
                onChange(e, path, newHexCode);
            } else {
                //setHexIsValid(false);
            }

        } else {
            setColor(newHexCode);
            setHexTextField(newHexCode);
            setHexIsValid(true)
            onChange(e, path, newHexCode);
        }
    };

    return (
        <>
            <Form.Label>
                {label}
                <div style={{display: 'flex'}}>
                    <Form.Control
                        type="color"
                        name={name+'-color'}
                        value={color} // Bind the color value to the state
                        onChange={handleColorChange} // Call handleColorChange on color input change
                    />
                    <Form.Control
                        style={{width: '140px'}}
                        type="text"
                        name={name+'-text'}
                        placeholder={color || '#000000'}
                        value={hexTextField} // Bind the color value to the state
                        //isValid={hexIsValid === true}
                        isInvalid={hexIsValid === false}
                        onChange={handleColorChange} // Call handleHexCodeChange on hex code input change
                    />
                </div>
            </Form.Label>


        </>
    );
};

const CheckDefaults = () => {
    // -- Get the column order of items from local storage --
    let localData = JSON.parse(localStorage.getItem('VSE_settings')) || {};

    //console.log('Pulled from local storage', localData)
    if (!localData.hasOwnProperty(DefaultColumn)) {
        // No prior data in local storage, so we'll initialize it
        //dataColumns = [];
        localData[DefaultColumn] = {};
        localData[DefaultColumn]['overrideCustomColumns'] = false;
        // if the local storage item doesn't exist, we'll make our own
        //DataTypes.map((item) => item.value)

    }

    localStorage.setItem('VSE_settings', JSON.stringify(localData));

    return localData[DefaultColumn];

}

const DefaultColumnSettings = ({defaultConfig, setDefaultConfig}) => {

    const handleValueChange = (event, lsRef, differentVal) => {
        const formId = lsRef || event.target.id;
        const determineValue = differentVal;
        const path = DefaultColumn+'.'+formId;
        console.log(`Path: ${path} | Value: ${determineValue}`);


        // -- Update local storage values --
        updateSettingsTree(path, determineValue);

        setDefaultConfig((item) => {
            console.log('formid: ', formId)
            let test = item;

            // A fix for the issue where formIds like "header.bold" are treated as key names
            const [parentKey, childKey] = formId.split('.');

            /*
            // Check if the parent key exists in the test object
            if (!(zeroIndex in test)) {
                test[zeroIndex] = {}; // Initialize the object if it doesn't exist
            }*/

            // Check if the parent key contains the nested object
            if (!(parentKey in test)) {
                test[parentKey] = {}; // Initialize the nested object if it doesn't exist
            }

            if (childKey) {
                // Update the nested property with the new value
                test[parentKey][childKey] = determineValue;
            } else {
                test[formId] = determineValue;
            }

            return test;

        });
        //setSettingsState(newState);
    };

    //console.log('Default override: ',defaultConfig.overrideCustomColumns)
    return (
        <Card className={`bg-body-tertiary border rounded column-wrapper`}>
            <Card.Header className={`data-card-header bg-body-secondary`}>
                Default Settings
            </Card.Header>
            <Card.Body>
                <Form.Check type={'switch'}>
                    <Form.Check.Input
                        checked={(defaultConfig) ? defaultConfig.overrideCustomColumns : false}
                        value={(defaultConfig) ? defaultConfig.overrideCustomColumns : false}
                        id='overrideCustomColumns'
                        style={{display: 'inline-block'}}
                        onChange={(e) => handleValueChange(e, 'overrideCustomColumns', e.target.checked)}
                    />
                    <Form.Check.Label
                        htmlFor={'overrideCustomColumns'}
                        style={{userSelect: 'none'}}
                    >
                        Override custom configs
                    </Form.Check.Label>
                    <QuestionTooltip text={'Enabling this will override any custom Header and Body changes made under Custom Column Settings.'} />
                </Form.Check>
            </Card.Body>
            <Accordion alwaysOpen>
                <TextFormattingOptions
                    classname="default-header-options"
                    type="Header"
                    datatype={DefaultColumn}
                    lsPos={DefaultColumn+'.header'}
                    defaultValues={(defaultConfig.hasOwnProperty('header')) ? defaultConfig.header : null}
                    onChange={(e, lsRef, overrideValue) => handleValueChange(e, lsRef, overrideValue)}
                />
                <TextFormattingOptions
                    classname="default-body-options"
                    type="Body"
                    datatype={DefaultColumn}
                    lsPos={DefaultColumn+'.body'}
                    defaultValues={(defaultConfig.hasOwnProperty('body')) ? defaultConfig.body : null}
                    onChange={(e, lsRef, overrideValue) => handleValueChange(e, lsRef, overrideValue)}
                />
            </Accordion>
        </Card>

    )
}

const Settings = () => {
    const [open, setOpen] = useState([false, false]);

    const [defaultConfig, setDefaultConfig] = useState(checkSettingsTree('columnDefaults') || {});

    // Fetch data from local storage once during component initialization
    useEffect(() => {
        console.log('This only runs once');
    }, []); // Empty dependency array ensures this effect runs only once


    const ToggleTargetButton = (index) => {
        setOpen((prevOpen) => {
            // Create a copy of the state array
            const updatedOpen = [...prevOpen];
            // Toggle the value at the specified index
            updatedOpen[index] = !updatedOpen[index];
            return updatedOpen;
        });
    }

    return (
        <Accordion alwaysOpen>
            <Accordion.Item eventKey={"0"}>
                <Accordion.Header>Data Collection Settings</Accordion.Header>
                <Accordion.Body>
                    <GenerateOptions header="What to Save" details="For more information
                        about what types of spreadsheet data can be extrapolated, see the glossary."
                                     options={DataExtractionToggles}/>
                    <GenerateDropdownOld
                        label="Use Product Name from Order Details page:"
                        options={{
                            1: {'name': 'Only when the product name is deleted'},
                            2: {'name': 'Always'},
                            3: {'name': 'Ask me each time (NOT IMPLEMENTED)'}
                        }}
                        defaultValue={2}
                        disabled
                        //id="productNameOverride"
                        lsRef="productNameOverride"
                    />
                </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey={"1"}>
                <Accordion.Header>General Spreadsheet Settings</Accordion.Header>
                <Accordion.Body>
                    <GenerateOptions header="Spreadsheet Addons"
                                     details="Some added options if you want to change up how your spreadsheet looks."
                                     options={SheetCustomizationToggles}/>
                    <fieldset style={{paddingTop: '15px'}}>
                        <h4>Spreadsheet Customization</h4>
                        <p>You can customize how your exported spreadsheets look by changing various settings, such as font color and column width, as
                            well as use custom headers for columns.</p>
                        <Form.Check type={'switch'} >
                            <Form.Check.Input
                                disabled={true}
                                id={'exportMultipleSheets'}
                            />
                            <Form.Check.Label htmlFor={'exportMultipleSheets'}>
                                Create multiple sheets for related data
                            </Form.Check.Label>
                            <QuestionTooltip text={"Enabling this will split the original data sheet into 3, pertaining to each of the following: Order Info, Review Data, and Shipping Info."}/>

                        </Form.Check>
                        <Button
                            onClick={() => ToggleTargetButton(0)}
                            aria-controls={DefaultColumn}
                            aria-expanded={open[0]}
                            style={{display: 'block'}}
                        >
                            Default Column Settings
                        </Button>
                        <Collapse in={open[0]}>
                            <div id={DefaultColumn}>
                                <p className="mb-0">These will be used as the default settings for your columns. This is useful if you want to create a single style and apply it to all of your columns.
                                    <br/><strong>Note:</strong> When "Override custom configs" is disabled, it will still apply any styling changes made here to any columns that have no custom styling changes.</p>
                                <DefaultColumnSettings defaultConfig={defaultConfig} setDefaultConfig={setDefaultConfig}/>
                            </div>
                        </Collapse>
                        <br></br>
                        <Button
                            onClick={() => ToggleTargetButton(1)}
                            aria-controls="data-personalization"
                            aria-expanded={open[1]}
                            style={{display: 'block'}}
                        >
                            Custom Column Settings
                        </Button>
                        <Collapse in={open[1]}>
                            <div id="data-personalization">
                                <p className="mb-0">Customize how you would like your Vine data to be
                                    organized by dragging and dropping data types.</p>
                                <br></br>
                                <GenerateColumns/>
                            </div>
                        </Collapse>

                    </fieldset>
                    <br></br>
                    <h5>Table Style</h5>
                    <p>You can select the table style you want by clicking the button below.</p>
                    <TableStylesDropdown/>
                    <Card>
                        <Card.Body>
                            <Card.Title>Table style preview</Card.Title>
                            <div className="preview table-theme-option"></div>
                        </Card.Body>
                    </Card>
                    <Button variant={'success'} onClick={ejsSheet}>
                        Download spreadsheet
                    </Button>

                    <Button variant={'success'} onClick={ejsSheet}>
                        Download test
                    </Button>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}

export default Settings;