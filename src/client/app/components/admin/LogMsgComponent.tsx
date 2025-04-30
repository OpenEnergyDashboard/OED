/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as React from 'react';
import * as moment from 'moment-timezone';
import { orderBy } from 'lodash';
import {
	Alert, Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle,
	FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalHeader,
	Pagination, PaginationItem, PaginationLink, Table
} from 'reactstrap';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectSelectedLanguage } from '../../redux/slices/appStateSlice';
import { logsApi } from '../../utils/api';
import { TimeInterval } from '../../../../common/TimeInterval';
import { dateRangeToTimeInterval, timeIntervalToDateRange } from '../../utils/dateRangeCompatibility';
import { titleStyle } from '../../styles/modalStyle';
import { useTranslate } from '../../redux/componentHooks';

// number of log messages to display per page
const PER_PAGE = 20;

enum LogTypes {
	ERROR = 'ERROR',
	INFO = 'INFO',
	WARN = 'WARN',
	DEBUG = 'DEBUG',
	SILENT = 'SILENT'
}
// log types for filtering
const logTypes = Object.values(LogTypes);

// initialize log message array to hold log messages
const initialLogs: any[] = [];

/**
 * React component that defines the log message page
 * @returns LogMsgComponent element
 */
export default function LogMsgComponent() {
	const translate = useTranslate();
	const locale = useAppSelector(selectSelectedLanguage);
	// Log messages state
	const [logs, setLogs] = React.useState(initialLogs);
	// Log messages date range state
	const [logDateRange, setLogDateRange] = React.useState<TimeInterval>(TimeInterval.unbounded());
	// Sort order for date column in the table
	const [dateSortOrder, setDateSortOrder] = React.useState<'asc' | 'desc'>('asc');
	// Number of log messages to display
	const [logLimit, setLogLimit] = React.useState(PER_PAGE);
	// Current page state for pagination
	const [currentPage, setCurrentPage] = React.useState(1);
	// Showing all logs instead of paginated
	const [showAllLogs, setShowAllLogs] = React.useState(false);
	// Update button state
	const [buttonAvailable, setButtonAvailable] = React.useState(false);
	// Modal state for displaying full log message
	const [modalOpen, setModalOpen] = React.useState(false);
	// Log type and time to display in the modal header
	const [modelHeader, setModelHeader] = React.useState('');
	// Full log message to display in the modal
	const [modalLogMessage, setModalLogMessage] = React.useState('');
	// Selected log types for filtering in the update log
	const [selectedUpdateLogTypes, setSelectedUpdateLogTypes] = React.useState<string[]>(logTypes);
	// "Select All Logs" button state for update log
	const [selectAllUpdate, setSelectAllUpdate] = React.useState(true);
	// Dropdown open state for log type in the update log for filtering
	const [updateLogDropdown, setUpdateLogDropdown] = React.useState(false);
	// Dropdown open state for log type in the header for filter
	const [typeTableDropdown, setTypeTableDropdown] = React.useState(false);
	// Selected log types for filtering in the table
	const [selectedTableLogTypes, setSelectedTableLogTypes] = React.useState<string[]>(logTypes);
	// "Select All Logs" button state for table log
	const [selectAllTable, setSelectAllTable] = React.useState(true);

	// Update the availability of the update button each time the selected log types, log limit, or date range changes
	React.useEffect(() => {
		setButtonAvailable(false);
	}, [selectedUpdateLogTypes, logLimit, logDateRange]);

	// Open modal with the full log message
	const handleLogMessageModal = (logType: string, logTime: string, logMessage: string) => {
		setModelHeader(`[${logType}] ${moment.parseZone(logTime).format('LL LTS [(and ]SSS[ms)]')}`);
		setModalLogMessage(logMessage);
		setModalOpen(true);
	};

	// Handle checkbox change for log type in the table
	const handleTableCheckboxChange = (logType: string) => {
		if (selectedTableLogTypes.includes(logType)) {
			// Remove log type if already selected
			setSelectedTableLogTypes(selectedTableLogTypes.filter(type => type !== logType));
		} else {
			// Add log type if not selected
			setSelectedTableLogTypes([...selectedTableLogTypes, logType]);
		}
	};

	// Handle checkbox change for log type in the update log
	const handleUpdateCheckboxChange = (logType: string) => {
		if (selectedUpdateLogTypes.includes(logType)) {
			// Remove log type if already selected
			setSelectedUpdateLogTypes(selectedUpdateLogTypes.filter(type => type !== logType));
		} else {
			// Add log type if not selected
			setSelectedUpdateLogTypes([...selectedUpdateLogTypes, logType]);
		}
	};

	// React effect to keep track of the "Select All" checkbox state for the update log
	React.useEffect(() => {
		selectedUpdateLogTypes.length === logTypes.length ? setSelectAllUpdate(true) : setSelectAllUpdate(false);
	}, [selectedUpdateLogTypes]);

	// React effect to keep track of the "Select All" checkbox state for the table
	React.useEffect(() => {
		selectedTableLogTypes.length === logTypes.length ? setSelectAllTable(true) : setSelectAllTable(false);
	}, [selectedTableLogTypes]);

	// Handle "Select All" checkbox change in the table
	const handleTableSelectAll = () => {
		selectAllTable ? setSelectedTableLogTypes([]) : setSelectedTableLogTypes(logTypes);
		setSelectAllTable(!selectAllTable);
	};
	// Handle "Select All" checkbox change in the update log
	const handleUpdateSelectAll = () => {
		selectAllUpdate ? setSelectedUpdateLogTypes([]) : setSelectedUpdateLogTypes(logTypes);
		setSelectAllUpdate(!selectAllUpdate);
	};
	// Handle sorting of logs by date
	const handleDateSort = () => {
		const newDateSortOrder = dateSortOrder === 'asc' ? 'desc' : 'asc';
		const sortedLogs = orderBy(logs, ['logTime'], [newDateSortOrder]);
		setDateSortOrder(newDateSortOrder);
		setLogs(sortedLogs);
	};

	// Filter logs based on selected log types and date range
	const paginatedLogs = showAllLogs
		? logs.filter(log => selectedTableLogTypes.includes(log.logType))
		: logs.filter(log => selectedTableLogTypes.includes(log.logType))
			.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
	const totalPages = Math.ceil(logs.length / PER_PAGE);

	/**
	 * Handle showing the log table by fetching from the server
	 */
	async function handleShowLogTable() {
		try {
			// get log by date and type
			const data = await logsApi.getLogsByDateRangeAndType(
				logDateRange, selectedUpdateLogTypes.toString(), logLimit.toString());
			setLogs(data);
			// reset pagination to first page after fetching new logs
			setCurrentPage(1);
			setButtonAvailable(true);
		} catch (error) {
			console.error(error);
		}
	}

	return (
		<>
			<h1 style={titleStyle}>{translate('log.messages')}</h1>

			{/* Filter log messages by type, date range, and number of logs for fetching */}
			<div style={logFilterStyle}>
				<Dropdown isOpen={updateLogDropdown} toggle={() => setUpdateLogDropdown(!updateLogDropdown)}>
					<DropdownToggle color='primary' caret>{translate('log.type')}</DropdownToggle>
					<DropdownMenu>
						<DropdownItem key='selectAll' toggle={false}>
							<Label check>
								<Input
									type="checkbox"
									checked={selectAllUpdate}
									onChange={handleUpdateSelectAll}
								/> {translate('select.all')}
							</Label>
						</DropdownItem>
						{logTypes.map(logType => (
							<DropdownItem key={logType} toggle={false}>
								<Label check>
									<Input
										type="checkbox"
										checked={selectedUpdateLogTypes.includes(logType)}
										onChange={() => handleUpdateCheckboxChange(logType)}
									/> {logType}
								</Label>
							</DropdownItem>
						))}
					</DropdownMenu>
				</Dropdown>
				<FormGroup style={{ padding: 0 }} check>
					<Label for="dateRange" style={{ fontWeight: 'bold', margin: '0' }}>
						{translate('date.range')}
					</Label>
					<DateRangePicker
						id="dateRange"
						value={timeIntervalToDateRange(logDateRange)}
						onChange={e => setLogDateRange(dateRangeToTimeInterval(e))}
						minDate={new Date(1970, 0, 1)}
						maxDate={new Date()}
						// Formats Dates, and Calendar months base on locale
						locale={locale}
						calendarIcon={null}
						calendarProps={{ defaultView: 'year' }} />
				</FormGroup>
				<FormGroup style={{ padding: 0 }} check>
					<Label for="logLimit" style={{ fontWeight: 'bold', margin: '0' }}>
						{translate('num.logs.display')}
					</Label>
					<Input
						id="logLimit"
						name="logLimit"
						placeholder={translate('from.1.to.1000')}
						type="number"
						onChange={e => setLogLimit(e.target.valueAsNumber)}
						invalid={!logLimit || logLimit < 1 || logLimit > 1000}
						value={logLimit}
					/>
					<FormFeedback>
						{translate('log.limit.required')}
					</FormFeedback>
				</FormGroup>
				<Button
					color='primary'
					disabled={buttonAvailable || !logLimit || logLimit < 1 || logLimit > 1000 || selectedUpdateLogTypes.length === 0}
					onClick={handleShowLogTable}
				>
					{translate('update')[0].toUpperCase() + translate('update').slice(1)}
				</Button>
			</div>

			{/* Display log messages table */}
			{logs.length > 0 ?
				<Table style={tableStyle} bordered hover>
					<thead style={headerStyle}>
						<tr>
							<th>
								<Dropdown isOpen={typeTableDropdown} toggle={() => setTypeTableDropdown(!typeTableDropdown)}>
									<DropdownToggle color='primary' caret>{translate('log.type')}</DropdownToggle>
									<DropdownMenu>
										<DropdownItem key='selectAll' toggle={false}>
											<Label check>
												<Input
													type="checkbox"
													checked={selectAllTable}
													onChange={handleTableSelectAll}
												/> {translate('select.all')}
											</Label>
										</DropdownItem>
										{logTypes.map(logType => (
											<DropdownItem key={logType} toggle={false}>
												<Label check>
													<Input
														type="checkbox"
														checked={selectedTableLogTypes.includes(logType)}
														onChange={() => handleTableCheckboxChange(logType)}
													/> {logType}
												</Label>
											</DropdownItem>
										))}
									</DropdownMenu>
								</Dropdown>
							</th>
							<th>{translate('log.message')}</th>
							<th onClick={handleDateSort} style={{ cursor: 'pointer' }}>
								{translate('log.time')} {dateSortOrder === 'asc' ? '↑' : '↓'}
							</th>
						</tr>
					</thead>
					<tbody style={bodyStyle}>
						{paginatedLogs.map((log, index) => (
							<tr key={index + 1}>
								<td>{log.logType}</td>
								<td
									style={{ cursor: 'pointer' }}
									onClick={() => handleLogMessageModal(log.logType, log.logTime, log.logMessage)}
								>
									{log.logMessage.length > 80 ? `${log.logMessage.slice(0, 80)} ...` : log.logMessage}
								</td>
								<td>{moment.parseZone(log.logTime).format('LL LTS')}</td>
							</tr>
						))}
					</tbody>
				</Table>
				:
				<Alert style={{ textAlign: 'center', margin: '2% 25% 25%' }}>{translate('no.logs')}</Alert>
			}

			{/* pagination */}
			{!showAllLogs && logs.length !== 0 && <Pagination aria-label="Log pagination" style={{ justifyContent: 'center', margin: '1% auto' }}>
				<>
					<PaginationItem disabled={currentPage === 1}>
						<PaginationLink first onClick={() => setCurrentPage(1)} />
					</PaginationItem><PaginationItem disabled={currentPage === 1}>
						<PaginationLink previous onClick={() => setCurrentPage(currentPage - 1)} />
					</PaginationItem>

					{Array.from({ length: totalPages }, (_, index) => (
						<PaginationItem key={index + 1} active={currentPage === index + 1}>
							<PaginationLink onClick={() => setCurrentPage(index + 1)}>
								{index + 1}
							</PaginationLink>
						</PaginationItem>
					))}

					<PaginationItem disabled={currentPage === totalPages}>
						<PaginationLink next onClick={() => setCurrentPage(currentPage + 1)} />
					</PaginationItem><PaginationItem disabled={currentPage === totalPages}>
						<PaginationLink last onClick={() => setCurrentPage(totalPages)} />
					</PaginationItem>
				</>
			</Pagination >}

			{/* Show all logs or in pages button */}
			{logs.length > 0 &&
				<Button color='primary' style={{ margin: '0% 40% 1%' }} onClick={() => setShowAllLogs(!showAllLogs)}>
					{!showAllLogs ? `${translate('show.all.logs')} (${logs.length})` : translate('show.in.pages')}
				</Button>}

			{/* Modal for displaying full log message */}
			<Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} centered>
				<ModalHeader toggle={() => setModalOpen(!modalOpen)}>{modelHeader}</ModalHeader>
				<ModalBody>
					{modalLogMessage}
				</ModalBody>
			</Modal >
		</>
	);
}

const headerStyle: React.CSSProperties = {
	textAlign: 'center'
};
const bodyStyle: React.CSSProperties = {
	textAlign: 'left'
};

const tableStyle: React.CSSProperties = {
	width: '90%',
	margin: '1% auto'
};

const logFilterStyle: React.CSSProperties = {
	display: 'flex',
	justifyContent: 'center',
	gap: '1.5%',
	alignItems: 'center',
	margin: 'auto 25%',
	padding: '20px',
	border: '2px solid lightgrey'
};
