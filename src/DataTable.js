import React, {useState, useEffect, useMemo} from 'react';
import {useTable, useSortBy, usePagination, useFilters, useGlobalFilter} from 'react-table';
import {Table, Button, Container} from 'react-bootstrap';
import {ColumnFilter} from '@tanstack/react-table';

// TODO: Improve deletion of rows/items from table

function formatUnixTimestamp(unixTimestamp) {
    // Convert Unix timestamp to milliseconds
    const milliseconds = parseInt(unixTimestamp);

    // Create a Date object from milliseconds
    const dateObject = new Date(milliseconds);

    // Get the date components
    const year = dateObject.getFullYear();
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObject.getDate().toString().padStart(2, '0');

    // Check if the time is exactly 12:00:00 AM (midnight)
    const isMidnight = dateObject.getHours() === 0 && dateObject.getMinutes() === 0 && dateObject.getSeconds() === 0;

    if (isMidnight) {
        // If it's midnight, return just the date
        return `${month}/${day}/${year}`;
    } else {
        // If it's not midnight, format the date and time in "m/d/yyyy h:mm AM/PM" format
        const hours = ((dateObject.getHours() + 11) % 12 + 1).toString().padStart(2, '0');
        const minutes = dateObject.getMinutes().toString().padStart(2, '0');
        const amOrPm = dateObject.getHours() >= 12 ? 'PM' : 'AM';

        return `${month}/${day}/${year} ${hours}:${minutes} ${amOrPm}`;
    }
}

// Define your table columns
const columns = [
    {
        Header: 'Photo',
        accessor: 'photo',
        Cell: ({cell}) => <img className='db-product-photo' src={cell.value} alt=""/>,
    },
    {
        Header: 'ASIN',
        accessor: 'asin',
    },
    {
        Header: 'Product Name',
        accessor: 'name',
    },
    {
        Header: 'Order ID',
        accessor: 'orderID',
        Cell: ({cell}) => <a rel={'noreferrer'} target={'_blank'} href={'https://www.amazon.com/gp/your-account/order-details/?ie=UTF8&orderID='+cell.value} >{cell.value}</a>,
    },
    {
        Header: 'Order Date',
        accessor: 'orderDate',
        Cell: ({value}) => {
            return formatUnixTimestamp(value);
        }
    },
];

const TableComponent = ({columns}) => {
    // State to hold table data
    const [data, setData] = useState([]);

    // Fetch data from indexedDB on component mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const request = indexedDB.open('VSE_DB');
        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(['orders'], 'readonly');
            const objectStore = transaction.objectStore('orders');
            const items = [];
            const cursorRequest = objectStore.openCursor();

            cursorRequest.onerror = function (event) {
                console.error('Cursor error: ' + event.target.error);
            };
            cursorRequest.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    items.push(cursor.value);
                    cursor.continue();
                } else {
                    setData(items);
                }
            };
        };
    };


    const handleDelete = (asin) => {
        const currentPageIndex = pageIndex; // Store the current page index
        const updatedTableData = data.filter((item) => item.asin !== asin);
        setData(updatedTableData);

        const request = indexedDB.open('VSE_DB');
        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(['orders'], 'readwrite');
            const objectStore = transaction.objectStore('orders');
            //objectStore.delete(asin);

            const deleteRequest = objectStore.delete(asin);
            deleteRequest.onsuccess = function () {
                // After successful deletion, fetch new data and update table
                //fetchData();
                gotoPage(currentPageIndex); // Navigate back to the current page after deletion
            };
        };
    };

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        page,
        nextPage,
        previousPage,
        canPreviousPage,
        canNextPage,
        gotoPage,
        pageCount,
        setGlobalFilter,
        setPageSize,
        state: {pageIndex, pageSize, globalFilter},
    } = useTable(
        {
            columns,
            data,
            initialState: {pageIndex: 0, pageSize: 10}, // Set initial page size
        },
        useFilters,
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const pageSizeOptions = [10, 25, 50, 75, 100, 150, 200]; // Define options for rows per page

    return (
        <>

            {/* Dropdown for rows per page */}
            <label>Items per page
                <select
                    id='itemCountDropdown'
                    value={pageSize}
                    onChange={(e) => {
                        setPageSize(Number(e.target.value)); // Set the new page size
                    }}
                >
                    {pageSizeOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </label>
            <input
                type="text"
                value={globalFilter || ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search..."
                id="databaseSearch"
                style={{float: 'right'}}
            />
            <Table {...getTableProps()} className="table">
                <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map(column => (
                            <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                {column.render('Header')}
                                {/*<ColumnFilter column={column} />*/}
                                <span>
                    {column.isSorted ? (column.isSortedDesc ? ' ↓' : ' ↑') : ''}
                  </span>
                            </th>
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                {page.map((row, i) => {
                    prepareRow(row);
                    return (
                        <tr {...row.getRowProps()}>
                            {row.cells.map((cell) => (
                                <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                            ))}
                            <td>
                                <Button className="db-delete-btn" variant="danger"
                                        onClick={() => handleDelete(row.original.asin)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor"
                                         viewBox="0 0 16 16">
                                        <path
                                            d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z"></path>
                                    </svg>
                                </Button>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </Table>
            <div>
                <span>Page <strong>{pageIndex + 1} of {pageCount}</strong>{' '}</span>
                <span>| Go to page:{' '}
                    <input
                        type="number"
                        defaultValue={pageIndex + 1}
                        onChange={e => {
                            const pageNumber = e.target.value ? Number(e.target.value) - 1 : 0;
                            gotoPage(pageNumber);
                        }}
                        min={'1'}
                        style={{width: '50px'}}
                    />
                </span>
                <div>
                    <Button variant='secondary' onClick={() => previousPage()} disabled={!canPreviousPage}>
                        Previous
                    </Button>
                    <Button variant='secondary' onClick={() => nextPage()} disabled={!canNextPage}>
                        Next
                    </Button>

                </div>
            </div>
        </>
    );
};

const DataTable = () => {
    return (
        <Container>
            <h3>Database Table (Beta)</h3>
            <p>This is just a rudimentary display of what data is available in your database with the added benefit of deleting items.</p>
            <TableComponent columns={columns}/>
        </Container>
    );
};

export default DataTable;
