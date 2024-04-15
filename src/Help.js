import React, {useState} from "react";
import {Accordion, Tab, Table} from "react-bootstrap";
import {DataTypes} from "./UniversalItems";


const listOfQuestions = [
    {
        question: "How do I import Vine-related information from my emails into my spreadsheet?",
        answer: (
            <p className="mb-0">You need to import a .zip file containing your emails in .eml format. I would highly
                recommend installing <a href="https://www.thunderbird.net/en-US/" rel="noreferrer" target="_blank">Mozilla
                    Thunderbird</a> as it&#39;s a versatile inbox manager that allows you to download specific emails
                (such
                as labelled ones) in bulk. It's made by the people who created Firefox and compatible with all email domains (Gmail, Hotmail, etc.).</p>),
    },
    {
        question: "If I import a PDF or spreadsheet with Vine data that already exists, will it overwrite it?",
        answer: (
            <p className="mb-0">If a matching ASIN or Order ID is found in your database, only the product name will be overwritten and possibly the date only new data will be added and t.</p>),
    },
    {
        question: "What else can I import?",
        answer: (
            <p className="mb-0">You can import the Itemized Reports that Amazon generates in your <a
                href="https://www.amazon.com/vine/account" rel="noreferrer" target="_blank">Account</a> tab.</p>),
    },
    {
        question: "Where and how is data stored?",
        answer: (<p className="mb-0">All data that gets exported into spreadsheets is stored locally in your browser
            via <a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API" target="_blank"
                   rel="noreferrer">IndexedDB</a>.
            If you want to see this data for yourself, it&#39;s available in the browser debugging tools.<br/><br/>This
            script automatically collects/parses any valid data on the page pertaining to a Vine order that was
            previously saved. To log your orders, go through each page in your Vine Orders tab.<br/><br/>The data from
            each Order page is saved. If a page contains X data of a product you ordered, it will be saved.</p>),
    },
    {
        question: "Are you stealing my info?",
        answer: (<p className="mb-0">No. Also, I want to point out that you can easily verify if
            I'm collecting data or not by checking the Network Requests tab in your browser debugging tools. Nothing is getting sent to me.
            I don't even have a server where I could store any information. <br/>
            All the data collected is stored locally, not on a server.
        </p>),
    },
    {
        question: "Is there a ban risk associated with using this? Does it send any data to Amazon?",
        answer: (
            <p className="mb-0">No. Amazon is only targeting users scraping the Vine catalog for new products to gain an
                unfair advantage against other users at requesting products. <br/>Also, if you&#39;re just clicking each
                page manually, you&#39;ll be fine. This script merely saves the data currently on the page and isn&#39;t
                interacting with Amazon&#39;s services in any way.</p>)
    },
    {
        question: "What is the advantage of using this over just copy/pasting my Orders/Reviews tabs on Vine?",
        answer:
            (<p className="mb-0">This tool is meant to compile all of your Vine product-related info into one large
                database.
                This database can then be exported into multiple different formats, not just spreadsheets, making it
                useful for keeping backups.<br/>
                Basically, Amazon's itemized reports are lackluster at best and copy/pasting info from the browser and
                manually adding EXTRA
                things (like shipping carrier, delivery date, etc.) is tedious.<br/>
                There's also the added benefit
                <br/>

                It is tedious having to catalog orders and new information every time. Plus, this script essentially
                saves just about everything.</p>),
    },
    {
        question: "What is this for?",
        answer:
            (<>
                <p className="mb-0">This tool does the following:</p>
                <ul>
                    <li>Collects data from pages you visit pertaining to your Vine orders</li>
                    <li>Compiles aforementioned data into a database</li>
                    <li>Export your data into Excel spreadsheets and other formats</li>
                    <li>Allow you to customize your exported spreadsheets</li>
                </ul>
            </>),
    },
    {
        question: "Why did you make this?",
        answer:
            (<>
                <p className="mb-0">For several reasons:</p>
                <ul>
                    <li>Amazon's itemized reports are mediocre and only offer 1/5 the info my tool can output.
                        <ul>
                            <li>mediocre,</li>
                            <li>ba</li>
                        </ul>
                    </li>

                    <li>Copying and pasting info from the browser is tedious.</li>
                    <li>Not very much info is extrapolated from the Orders/Reviews tab</li>
                    <li>Allow you to customize your exported spreadsheets</li>
                </ul>
            </>),
    },
    {
        question: "Is it compatible with my country?",
        answer:
            (<>
                <p className="mb-0">This tool was originally designed for Vine members in the US, so it might not work for other countries just yet.</p>
                <p className="mb-0">I would love to help get this working for other regions, but I'll probably need help with localization.</p>
            </>),
    },
    {
        question: "Are you planning on adding other features?",
        answer:
            (<>
                <p className="mb-0">Yes! Here's a list of some things I'd like to add:<br/>
                </p>
                <ul>
                    <li>Support for custom column data</li>
                    <li>Shareable spreadsheet configs</li>
                    <li>Editing data directly inside the database table</li>

                </ul>
            </>),
    },
    {
        question: "How does this tool pull data?",
        answer:
            (<>
                <p className="mb-0">It will pull from the following:<br/>
                </p>
                <ul>
                    <li>It can </li>
                    <li>Shareable spreadsheet configs</li>
                    <li>Editing data directly inside the database table</li>

                </ul>
            </>),
    },
    {
        question: "",
        answer:
            "",
    },
    {
        question: "",
        answer:
            "",
    }
];

/**
 * Generates the list of questions and answers in accordions.
 *
 * Question = Accordion header
 *
 * Answer = Accordion body
 * @returns {Element}
 * @constructor
 */
const GenerateFAQItems = () => {
    return listOfQuestions.map((item, index) => (
        <Accordion.Item eventKey={'question_' + index} key={index}>
            <Accordion.Header>{item.question}</Accordion.Header>
            <Accordion.Body>
                {item.answer}
            </Accordion.Body>
        </Accordion.Item>
    ));
};

const GenerateGlossaryItems = () => {
    return (
        <Table>
            <thead>
            <tr>
                <th>Data type</th>
                <th>Description</th>
            </tr>
            </thead>
            <tbody>
            {
                DataTypes.map((item) => (
                    <tr>
                    <td>{item.name}</td>
                        <td>{item.details}</td>
                    </tr>

                ))
            }
            </tbody>
        </Table>
    )
}

const Help = () => {

    return (
        <>
            <h1>Help</h1>
            <Accordion alwaysOpen>
                <Accordion.Item eventKey={'0'}>
                <Accordion.Header>Frequently-Asked Questions</Accordion.Header>
                <Accordion.Body>
                    <Accordion alwaysOpen>
                        <GenerateFAQItems/>
                    </Accordion>
                </Accordion.Body>

                </Accordion.Item>
                <Accordion.Item eventKey={'1'}>
                    <Accordion.Header>Glossary</Accordion.Header>
                    <Accordion.Body>
                        <GenerateGlossaryItems/>
                    </Accordion.Body>

                </Accordion.Item>

            </Accordion>
        </>
    );
};

export default Help;