import React from 'react';
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {HelpOutline} from "@mui/icons-material";

const QuestionTooltip = ({ text }) => {
    return (
        <>
            {text !== null && (
            <OverlayTrigger placement="top" overlay={<Tooltip>{text}</Tooltip>} delay={{ show: 200, hide: 600 }}>
                <HelpOutline style={{marginLeft: '5px'}}  />
                {/*<i style={{marginLeft: '5px'}} className="tooltip-hint fa fa-question-circle"></i>*/}
            </OverlayTrigger>
            )}
        </>
    );
};

const LocalStorageRef = 'VSE_settings';
const IndividualColumns = 'columnManagement';
const DefaultColumn = 'columnDefaults';


const LocationAbbr = {
    od: 'Order Details',
    vo: 'Vine Orders tab',
    vr: 'Vine Reviews tab', // use if data can be found in both Awaiting and Completed tabs
    vrc: 'Completed Vine Reviews tab',

}

/**
 * An array of all the accepted data types for the database/spreadsheet, along with all their necessary parameters.
 * @type {[{value: string, name: string, labelGroup: string, details: string},{labelGroup: string, name: string, value: string},{labelGroup: string, name: string, value: string},{labelGroup: string, name: string, value: string},{labelGroup: string, name: string, value: string},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}
 */
const DataTypes = [
    {value: 'photo', name: 'Product Photo', locatedIn: ['od', 'vo', 'vr'], labelGroup: 'ORDER DETAILS', ref: /(Product (Photo|Icon|Image|Pic(ture)?))/i, details: "This is the product image that can be found in your Vine Orders/Reviews tabs or in your Order Details page."},
    {value: 'asin', name: 'ASIN', locatedIn: ['od', 'vo', 'vr'], labelGroup: 'ORDER DETAILS', ref: /(Product (ASIN|Number))/i, details: "Each product on Amazon is assigned their own ID. These can sometimes change, but they are always unique."},
    {value: 'name', name: 'Product Name', ref: /((Product )?(Name))/i, labelGroup: 'ORDER DETAILS'},
    {value: 'orderID', name: 'Order ID', ref: /(Order (ID|Number))/i, details: "The most useful identifier for a Vine order. Sometimes, older Vine orders have letters instead of numbers.", labelGroup: 'ORDER DETAILS'},
    {value: 'orderDate', name: 'Order Date', ref: /(Order Date|Ordered on|Date Ordered|Date of Order)/i, labelGroup: 'ORDER DETAILS'},
    {value: 'queue', name: 'Queue Type', ref: /(Queue)/i, details: "The queue from which the product was ordered from.", options: "RFY | AFA | AI", labelGroup: 'ORDER DETAILS'},
    {value: 'sellerName', name: 'Seller Name', ref: /(Seller|Seller Name)/i, details: "The name of the seller.", locatedIn: [LocationAbbr['od']], labelGroup: 'ORDER DETAILS'},
    {value: 'sellerId', name: 'Seller ID', labelGroup: 'ORDER DETAILS', details: "Each seller has their own ID in the Amazon marketplace, similar to how each product has its own ASIN."},
    {value: 'etv', name: 'ETV', ref: /(ETV|FMV|(Estimated Taxable|Fair Market) Value)/i, labelGroup: 'ORDER DETAILS'},
    {value: 'orderStatus', name: 'Order Status', ref: /(Order Status)/i, labelGroup: 'ORDER DETAILS', details: "This indicates if the order was cancelled or removed."},
    {value: 'orderStatusDate', name: 'Order Status Date', ref: /(Order Status Date)/i, labelGroup: 'ORDER DETAILS', details: "Similar to Order Date, however this tells you when the Order Status changed to whatever it is now."},
    {value: 'excluded', name: 'Exclude (ETV)', ref: /(Excluded ETV|ETV Excluded|Exclude \(ETV\))/i, labelGroup: 'ORDER DETAILS', details: "When TRUE, this means the order is excluded "},
    //{value: 'reason', name: 'Reason', labelGroup: 'ORDER DETAILS'},
    {value: 'deleted', name: 'Product Status', ref: /(Product Status)/i, labelGroup: 'ORDER DETAILS', details: "This means the product ASIN was deleted on Amazon."},
    {value: 'reviewStatus', name: 'Review Status', ref: /(Review Status)/i, labelGroup: 'REVIEW DETAILS'},
    {value: 'reviewSubmitDate', name: 'Review Submit Date', ref: /(Review (Submitted|Submit Date|Submitted on))/i, labelGroup: 'REVIEW DETAILS'},
    //{value: 'reviewSubmitDate', name: 'Review Status', ref: /(Review Status)/i, labelGroup: 'REVIEW DETAILS'},
    {value: 'reviewTitle', name: 'Review Title', ref: /(Review Title)/i, labelGroup: 'REVIEW DETAILS', details: "The heading of your reviews."},
    {value: 'reviewBody', name: 'Review Body', ref: /(Review (Text|Body))/i, labelGroup: 'REVIEW DETAILS', details: "The contents of your review. This is what people see under your review title."},
    {value: 'reviewStars', name: 'Review Stars', ref: /(Rating|Stars)/i, labelGroup: 'REVIEW DETAILS', details: "The star rating you gave for the product between 1-5."},
    {value: 'shippedBy', name: 'Carrier Name', ref: /(Shipped By|Carrier)/i, labelGroup: 'SHIPPING DETAILS', details: "This refers to delivery carrier who delivered the product. Often times, Amazon uses their own drivers to deliver packages."},
    {value: 'trackingId', name: 'Tracking ID', ref: /(Tracking ID)/i, labelGroup: 'SHIPPING DETAILS'},
    {value: 'shipDate', name: 'Date Shipped', ref: /(Date Shipped|Shipped On)/i, labelGroup: 'SHIPPING DETAILS'},
    {value: 'deliveryDate', name: 'Date Delivered', ref: /(Date Delivered|Delivered On)/i, labelGroup: 'SHIPPING DETAILS'},
];

/**
 * For converting column numbers to the letters they represent in a spreadsheet.
 *
 * Offers better human readability.
 * @param index
 * @returns {string}
 */
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

/**
 * Some possible features:
 *
 * * Add a button to the Spreadsheet Customization section that downloads a sample spreadsheet. This is useful for testing spreadsheet customization options.
 * * Allow people to import their spreadsheets (with the correct column names); pull the styles used for the column header/body, column width, and table style; and save those under the Custom Column Settings.
 */

export {QuestionTooltip, columnIndexToLetter, DataTypes, IndividualColumns, DefaultColumn};
