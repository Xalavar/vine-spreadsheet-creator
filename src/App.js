//import 'bootstrap/dist/css/bootstrap.min.css'; // https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css
//import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Settings from './Settings.js';
import DataTable from './DataTable.js';
import Help from "./Help";
import './bootstrap.min.css';
import './App.css';
import React, {useState, useEffect, useRef} from 'react';
import {BrowserRouter as Router, Link, Route, Routes} from 'react-router-dom';
import WebsiteTheme from './WebsiteTheme.js';
import DataManagement from "./DataManagement";
import {
    Navbar,
    Nav,
    Dropdown,Container,
} from 'react-bootstrap';
import '@fortawesome/fontawesome-free/css/all.min.css';

const version = "1.0.0";

const Sidebar = ({setPage, currentPage}) => {
    const handlePageChange = (page, event) => {
        setPage(page);
    };

    const [isSidebarToggled, setIsSidebarToggled] = useState(false);

    const toggleSidebar = () => {
        let page = document.getElementById('page-top');
        let nav = document.querySelector('nav.navbar');
        if (!isSidebarToggled) {
            page.classList.add('sidebar-toggled');
            nav.classList.add('toggled');

        } else {
            page.classList.remove('sidebar-toggled');
            nav.classList.remove('toggled');
        }
        setIsSidebarToggled(!isSidebarToggled);
    };

    const handleResize = () => {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        if (vw < 768) {
            setIsSidebarToggled(false);
        }
    };

    const handleThemeChange = (theme) => {
        let getStoredTheme = JSON.parse(localStorage.getItem('VSE_settings'));
        getStoredTheme.webTheme = theme;
        console.log(theme)
        const setStoredTheme = (theme) => localStorage.setItem('VSE_settings', JSON.stringify(getStoredTheme));
        const setTheme = (theme) => {
            if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-bs-theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-bs-theme', theme);
            }
        };

        setStoredTheme(theme);
        setTheme(theme);
    };

    window.addEventListener('resize', handleResize);

    return (
        <Navbar
            expand="lg"
            className="align-items-start sidebar sidebar-dark accordion bg-gradient-primary p-0 navbar-dark"
            /*onSelect={(selectedKey) => alert(`selected ${selectedKey}`)}*/
        >
            <Container fluid className="d-flex flex-column p-0">
                <Navbar.Brand className="d-flex justify-content-center align-items-center sidebar-brand m-0">
                    <div className="sidebar-brand-icon rotate-n-15">
                        {/* Replace with your icon */}
                        <i className="fas fa-table"></i>
                    </div>
                    <div className="sidebar-brand-text mx-3">
                        <span className="text-capitalize">The Vineyard</span>
                    </div>
                </Navbar.Brand>
                <hr className="sidebar-divider my-0"/>

                <ul id="accordionSidebar" className="navbar-nav flex-column text-light">
                    {/*
                    <li className="nav-defaultConfig">
                        <a className="nav-link" ><i
                            className="fas fa-tachometer-alt"></i><span>Dashboard</span></a>
                    </li>*/}
                    <Nav.Item>
                        <Link className={'item-link'} to={'/vine/vase/data-table'} style={{textDecoration: 'initial', color: 'inherit'}}>
                            <Nav.Link href={' '}>
                                <i style={{verticalAlign: "middle"}}>
                                    <svg style={{verticalAlign: "initial"}} className="bi bi-database-fill"
                                         xmlns="http://www.w3.org/2000/svg" width="1em"
                                         height="1em" fill="currentColor" viewBox="0 0 16 16">
                                        <path
                                            d="M3.904 1.777C4.978 1.289 6.427 1 8 1s3.022.289 4.096.777C13.125 2.245 14 2.993 14 4s-.875 1.755-1.904 2.223C11.022 6.711 9.573 7 8 7s-3.022-.289-4.096-.777C2.875 5.755 2 5.007 2 4s.875-1.755 1.904-2.223Z"></path>
                                        <path
                                            d="M2 6.161V7c0 1.007.875 1.755 1.904 2.223C4.978 9.71 6.427 10 8 10s3.022-.289 4.096-.777C13.125 8.755 14 8.007 14 7v-.839c-.457.432-1.004.751-1.49.972C11.278 7.693 9.682 8 8 8s-3.278-.307-4.51-.867c-.486-.22-1.033-.54-1.49-.972Z"></path>
                                        <path
                                            d="M2 9.161V10c0 1.007.875 1.755 1.904 2.223C4.978 12.711 6.427 13 8 13s3.022-.289 4.096-.777C13.125 11.755 14 11.007 14 10v-.839c-.457.432-1.004.751-1.49.972-1.232.56-2.828.867-4.51.867s-3.278-.307-4.51-.867c-.486-.22-1.033-.54-1.49-.972Z"></path>
                                        <path
                                            d="M2 12.161V13c0 1.007.875 1.755 1.904 2.223C4.978 15.711 6.427 16 8 16s3.022-.289 4.096-.777C13.125 14.755 14 14.007 14 13v-.839c-.457.432-1.004.751-1.49.972-1.232.56-2.828.867-4.51.867s-3.278-.307-4.51-.867c-.486-.22-1.033-.54-1.49-.972Z"></path>
                                    </svg>
                                </i>
                                <span>Database</span>
                            </Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link className={'item-link'} to={'/vine/vase/data-management'} style={{textDecoration: 'initial', color: 'inherit'}}>
                            <Nav.Link href={' '}>
                                <i className="fa fa-table"></i><span>Data Management</span>
                            </Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link className={'item-link'} to={'/vine/vase/settings'} style={{textDecoration: 'initial', color: 'inherit'}}>
                            <Nav.Link href={' '}>
                                <i className="fa fa-gear"></i><span>Settings</span>
                            </Nav.Link>
                        </Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Link className={'item-link'} to={'/vine/vase/help'} style={{textDecoration: 'initial', color: 'inherit'}}>
                                <i className="fa fa-question-circle"></i><span>Help</span>
                        </Link>
                    </Nav.Item>

                    {/* Additional Nav Items
                    <Nav.Item>
                        <Nav.Link onClick={() => setPage('faq')} href="faq.html">
                            <i className="far fa-question-circle"></i>
                            <span>Help</span></Nav.Link>
                    </Nav.Item>

                    */}
                </ul>
                <div className="text-center d-none d-md-inline">
                    <button id="sidebarToggle" onClick={toggleSidebar} className="btn rounded-circle border-0"
                            type="button"></button>
                </div>
                <Dropdown className="theme-switcher">
                    <Dropdown.Toggle as="a" aria-expanded="false">
                        <svg className="bi bi-sun-fill mb-1" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"
                             fill="currentColor" viewBox="0 0 16 16"
                             style={{color: 'rgb(255,255,255)', fontSize: '45px'}}>
                            <path
                                d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"></path>
                        </svg>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item data-bs-theme-value="light" onClick={() => handleThemeChange('light')}>
                            <svg className="bi bi-sun-fill opacity-50 me-2" xmlns="http://www.w3.org/2000/svg"
                                 width="1em"
                                 height="1em" fill="currentColor" viewBox="0 0 16 16">
                                <path
                                    d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"></path>
                            </svg>
                            Light
                        </Dropdown.Item>
                        <Dropdown.Item data-bs-theme-value="dark" onClick={() => handleThemeChange('dark')}>
                            <svg className="bi bi-moon-stars-fill opacity-50 me-2" xmlns="http://www.w3.org/2000/svg"
                                 width="1em"
                                 height="1em" fill="currentColor" viewBox="0 0 16 16">
                                <path
                                    d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"></path>
                                <path
                                    d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L13.863.1z"></path>
                            </svg>
                            Dark
                        </Dropdown.Item>
                        <Dropdown.Item data-bs-theme-value="auto" onClick={() => handleThemeChange('auto')}>
                            <svg className="bi bi-circle-half opacity-50 me-2" xmlns="http://www.w3.org/2000/svg"
                                 width="1em"
                                 height="1em" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 0 8 1v14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z"></path>
                            </svg>
                            Auto
                        </Dropdown.Item>
                        {/* Dropdown menu items */}
                    </Dropdown.Menu>
                </Dropdown>
            </Container>
        </Navbar>
    );
};

function CreateIndexedDB() {
    const request = window.indexedDB.open('VSE_DB', 1);

    request.onerror = function (event) {
        console.error('Database error: ' + event.target.errorCode);
    };

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(['orders'], 'readwrite');
        const objectStore = transaction.objectStore('orders');

        for (let i = 0; i < 30; i++) {
            const item = {
                orderDate: new Date().getTime(), // Example order date (timestamp)
                productName: `Product ${i + 1}`,
                photo: `photo_${i + 1}.jpg`,
                orderID: `Order_${i + 1}`,
                asin: `ASIN_${i + 1}`
            };
            objectStore.add(item);
        }

        transaction.oncomplete = function () {
            console.log('Items added to IndexedDB successfully');
        };

        transaction.onerror = function (event) {
            console.error('Transaction error: ' + event.target.error);
        };
    };

    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        const objectStore = db.createObjectStore('orders', {keyPath: 'asin'});

        objectStore.createIndex('orderDate', 'orderDate', {unique: false});
        objectStore.createIndex('productName', 'productName', {unique: false});
        objectStore.createIndex('photo', 'photo', {unique: false});
        objectStore.createIndex('asin', 'asin', {unique: false});
        objectStore.createIndex('orderID', 'orderID', {unique: false});
    };
}


const VersionNumbering = () => {

}

const App = () => {
    useEffect(() => {
        //CreateIndexedDB();
        document.title = 'The Vineyard - Your Vine Database';

    }, []);

    return (
        <Router>
            <WebsiteTheme/>
            <div id="page-top">
                <div id="wrapper">
                    <Sidebar/>
                    <div id="content-wrapper" className="d-flex flex-column">
                        <div id="content">
                            <Routes>
                                <Route path="/vine/vase/settings" element={<Settings/>}/>
                                <Route path="/vine/vase/data-table" element={<DataTable/>}/>
                                <Route path="/vine/vase/data-management" element={<DataManagement/>}/>
                                <Route path="/vine/vase/help" element={<Help/>}/>
                            </Routes>
                        </div>
                        <footer className="sticky-footer">
                            <div className="container my-auto">
                                <div className="text-center my-auto copyright">
                                    <a href="https://github.com/Xalavar/" style={{textDecoration: 'none'}}>
                                        <svg style={{color: 'initial'}} className="bi bi-github"
                                             xmlns="http://www.w3.org/2000/svg" width="1em"
                                             height="1em" fill="currentColor" viewBox="0 0 16 16">
                                            <path
                                                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
                                        </svg>
                                        <span> Xalavar</span>
                                    </a>

                                    <div className="text-center my-auto copyright">
                                        <span>This tool is not sponsored nor endorsed by Amazon.com, Inc.</span>
                                    </div>
                                </div>
                                <div className="version-number">

                                </div>
                            </div>
                        </footer>
                    </div>
                    <a className="border rounded d-inline scroll-to-top" href="#page-top">
                        <i className="fas fa-angle-up"></i>
                    </a>
                </div>
            </div>
        </Router>

    );
};

function DeleteDataModal() {
    return (
        <div id="data-erasure-modal" className="modal fade" role="dialog" tabIndex="-1">
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title text-uppercase">Confirm Data Erasure</h4>
                        <button className="btn-close" type="button" aria-label="Close" data-bs-dismiss="modal"></button>
                    </div>
                    <div className="modal-body">
                        <p>For now, you can only delete data from specific years.</p>
                        <select id="erasure-type" name="Data to delete">
                            <optgroup label="Pick what you want to delete">
                                <option value="individual-years">Specific years</option>
                                <option value="delete-all">Everything</option>
                            </optgroup>
                        </select>
                        <div id="year-selection" className="container">
                            <div className="form-check form-switch form-check-inline" style={{paddingRight: '0px'}}>
                                <input id="formCheck-6" className="form-check-input" type="checkbox"/>
                                <label className="form-check-label" htmlFor="formCheck-6">2024</label>
                            </div>
                            <div className="form-check form-switch form-check-inline" style={{paddingRight: '0px'}}>
                                <input id="formCheck-7" className="form-check-input" type="checkbox"/>
                                <label className="form-check-label" htmlFor="formCheck-7">2024</label>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-light" type="button" data-bs-dismiss="modal">Cancel</button>
                        <button className="btn btn-danger" type="button">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
