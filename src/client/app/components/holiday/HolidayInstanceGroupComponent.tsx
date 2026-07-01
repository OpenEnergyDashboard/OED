/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Alert, Button, FormFeedback, FormGroup, Input, Label,
	Pagination, PaginationItem, PaginationLink, Table
} from 'reactstrap';
import { titleStyle } from '../../styles/modalStyle';
import { HolidayInstance } from 'types/redux/holiday';

const PER_PAGE = 20;

interface HolidayInstanceGroupComponentProps {
	holidayInstances?: HolidayInstance[];
	initialSelectedHolidayInstanceIds?: number[];
	handleUpdateHolidayLimit?: (holidayLimit: number) => void;
	handleCreateHolidayInstanceGroup?: (holidayInstanceIds: number[]) => void;
}

/**
 * Defines the holiday instance group selection page.
 * @param props Holiday instance data and optional action handlers
 * @returns Holiday instance group page element
 */
export default function HolidayInstanceGroupComponent(props: HolidayInstanceGroupComponentProps) {
	const holidayInstances = props.holidayInstances ?? [];
	const [holidayLimitText, setHolidayLimitText] = React.useState(PER_PAGE.toString());
	const [displayLimit, setDisplayLimit] = React.useState(PER_PAGE);
	const [currentPage, setCurrentPage] = React.useState(1);
	const [showAllHolidays, setShowAllHolidays] = React.useState(false);
	const [selectedHolidayInstanceIds, setSelectedHolidayInstanceIds] = React.useState<number[]>(
		props.initialSelectedHolidayInstanceIds ?? []);

	const holidayLimit = Number(holidayLimitText);
	const holidayLimitInvalid = holidayLimitText.trim() === ''
		|| !Number.isInteger(holidayLimit)
		|| holidayLimit < 1;
	const displayedHolidayInstances = showAllHolidays
		? holidayInstances
		: holidayInstances.slice(0, displayLimit);
	const totalPages = Math.max(1, Math.ceil(displayedHolidayInstances.length / PER_PAGE));
	const paginatedHolidayInstances = showAllHolidays
		? displayedHolidayInstances
		: displayedHolidayInstances.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

	React.useEffect(() => {
		setSelectedHolidayInstanceIds(props.initialSelectedHolidayInstanceIds ?? []);
	}, [props.initialSelectedHolidayInstanceIds]);

	React.useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages);
		}
	}, [currentPage, totalPages]);

	const handleUpdateHolidayLimit = () => {
		if (holidayLimitInvalid) {
			return;
		}

		setDisplayLimit(holidayLimit);
		setCurrentPage(1);
		setShowAllHolidays(false);
		props.handleUpdateHolidayLimit?.(holidayLimit);
	};

	const handleHolidayInstanceSelect = (holidayInstanceId: number) => {
		setSelectedHolidayInstanceIds(currentIds => currentIds.includes(holidayInstanceId)
			? currentIds.filter(id => id !== holidayInstanceId)
			: [...currentIds, holidayInstanceId]);
	};

	const handleCreateHolidayInstanceGroup = () => {
		props.handleCreateHolidayInstanceGroup?.(selectedHolidayInstanceIds);
	};

	return (
		<div className='flexGrowOne' style={pageStyle}>
			<h1 style={holidayTitleStyle}>
				<FormattedMessage id='holiday.instance.group' defaultMessage='Holiday Instance Group' />
			</h1>

			<div style={holidayFilterStyle}>
				<FormGroup style={holidayLimitGroupStyle}>
					<Label for='holidayLimit' style={holidayLimitLabelStyle}>
						<FormattedMessage
							id='holiday.number.display'
							defaultMessage='Number of holidays to display' />
					</Label>
					<Input
						id='holidayLimit'
						name='holidayLimit'
						type='number'
						min={1}
						inputMode='numeric'
						value={holidayLimitText}
						invalid={holidayLimitInvalid}
						onChange={e => setHolidayLimitText(e.target.value)}
						style={holidayLimitInputStyle} />
					<FormFeedback>
						<FormattedMessage
							id='holiday.limit.required'
							defaultMessage='Enter at least 1 holiday.' />
					</FormFeedback>
				</FormGroup>
				<Button
					color='secondary'
					outline
					disabled={holidayLimitInvalid}
					onClick={handleUpdateHolidayLimit}
					style={outlineButtonStyle}>
					<FormattedMessage id='update' defaultMessage='Update' />
				</Button>
			</div>

			{holidayInstances.length > 0 ? (
				<div style={tableWrapStyle}>
					<Table bordered style={tableStyle}>
						<thead>
							<tr>
								<th style={{ ...tableHeaderStyle, ...holidayNameColumnStyle }}>
									<FormattedMessage id='holiday.instance' defaultMessage='Holiday Instance' />
								</th>
								<th style={{ ...tableHeaderStyle, ...holidayNoteColumnStyle }}>
									<FormattedMessage id='note' defaultMessage='Note' />
								</th>
								<th style={{ ...tableHeaderStyle, ...holidaySelectColumnStyle }}>
									<FormattedMessage id='select' defaultMessage='Select' />
								</th>
							</tr>
						</thead>
						<tbody>
							{paginatedHolidayInstances.map(holidayInstance => {
								const selected = selectedHolidayInstanceIds.includes(holidayInstance.id);

								return (
									<tr key={holidayInstance.id}>
										<td style={{ ...tableCellStyle, ...holidayNameColumnStyle }}>
											{holidayInstance.name}
										</td>
										<td style={{ ...tableCellStyle, ...holidayNoteColumnStyle }}>
											{holidayInstance.note}
										</td>
										<td style={{ ...tableCellStyle, ...holidaySelectColumnStyle }}>
											<Label check style={checkboxLabelStyle}>
												<Input
													type='checkbox'
													checked={selected}
													aria-label={`Select ${holidayInstance.name}`}
													onChange={() => handleHolidayInstanceSelect(holidayInstance.id)}
													style={hiddenCheckboxStyle} />
												<span style={checkboxSquareStyle}>
													{selected ? 'X' : ''}
												</span>
											</Label>
										</td>
									</tr>
								);
							})}
						</tbody>
					</Table>
				</div>
			) : (
				<Alert style={emptyHolidayStyle}>
					<FormattedMessage
						id='holiday.no.instances'
						defaultMessage='No holiday instances available.' />
				</Alert>
			)}

			{!showAllHolidays && holidayInstances.length > 0 && (
				<Pagination aria-label='Holiday instance pagination' style={paginationStyle}>
					<PaginationItem disabled={currentPage === 1}>
						<PaginationLink onClick={() => setCurrentPage(1)}>
							{'<<'}
						</PaginationLink>
					</PaginationItem>
					<PaginationItem disabled={currentPage === 1}>
						<PaginationLink onClick={() => setCurrentPage(currentPage - 1)}>
							{'<'}
						</PaginationLink>
					</PaginationItem>
					{Array.from({ length: totalPages }, (_, index) => (
						<PaginationItem key={index + 1} active={currentPage === index + 1}>
							<PaginationLink onClick={() => setCurrentPage(index + 1)}>
								{index + 1}
							</PaginationLink>
						</PaginationItem>
					))}
					<PaginationItem disabled={currentPage === totalPages}>
						<PaginationLink onClick={() => setCurrentPage(currentPage + 1)}>
							{'>'}
						</PaginationLink>
					</PaginationItem>
					<PaginationItem disabled={currentPage === totalPages}>
						<PaginationLink onClick={() => setCurrentPage(totalPages)}>
							{'>>'}
						</PaginationLink>
					</PaginationItem>
				</Pagination>
			)}

			{holidayInstances.length > 0 && (
				<div style={actionContainerStyle}>
					<Button
						color='secondary'
						outline
						onClick={() => {
							setShowAllHolidays(!showAllHolidays);
							setCurrentPage(1);
						}}
						style={wideOutlineButtonStyle}>
						{showAllHolidays ? (
							<FormattedMessage id='show.in.pages' defaultMessage='Show in pages' />
						) : (
							<FormattedMessage
								id='show.all.holidays'
								defaultMessage='Show all holidays ({count})'
								values={{ count: holidayInstances.length }} />
						)}
					</Button>
					<Button
						color='secondary'
						outline
						onClick={handleCreateHolidayInstanceGroup}
						style={wideOutlineButtonStyle}>
						<FormattedMessage
							id='holiday.instance.group.create'
							defaultMessage='Create Holiday Instance Group' />
					</Button>
				</div>
			)}
		</div>
	);
}

const pageStyle: React.CSSProperties = {
	padding: '4rem 0 2rem'
};

const holidayTitleStyle: React.CSSProperties = {
	...titleStyle,
	color: '#111',
	fontSize: '2.75rem',
	fontWeight: 400,
	margin: '0 0 1.35rem',
	textAlign: 'center'
};

const holidayFilterStyle: React.CSSProperties = {
	alignItems: 'flex-end',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '2rem',
	justifyContent: 'center',
	margin: '0 auto 2rem'
};

const holidayLimitGroupStyle: React.CSSProperties = {
	margin: 0,
	width: '21rem'
};

const holidayLimitLabelStyle: React.CSSProperties = {
	display: 'block',
	fontSize: '1.05rem',
	fontWeight: 400,
	margin: '0 0 0.25rem',
	textAlign: 'center'
};

const holidayLimitInputStyle: React.CSSProperties = {
	border: '1px solid #222',
	borderRadius: 0,
	fontSize: '1rem',
	height: '2.05rem'
};

const tableWrapStyle: React.CSSProperties = {
	margin: '0 auto',
	maxWidth: '92%',
	overflowX: 'auto'
};

const tableStyle: React.CSSProperties = {
	border: '1px solid #222',
	borderCollapse: 'collapse',
	margin: 0,
	minWidth: '720px',
	tableLayout: 'fixed',
	width: '100%'
};

const tableHeaderStyle: React.CSSProperties = {
	border: '1px solid #222',
	fontSize: '1.45rem',
	fontWeight: 400,
	height: '5.1rem',
	textAlign: 'center',
	verticalAlign: 'middle'
};

const tableCellStyle: React.CSSProperties = {
	border: '1px solid #222',
	fontSize: '1.35rem',
	height: '2.45rem',
	lineHeight: 1.15,
	overflow: 'hidden',
	padding: '0.35rem 0.75rem',
	textAlign: 'center',
	textOverflow: 'ellipsis',
	verticalAlign: 'middle',
	whiteSpace: 'nowrap'
};

const holidayNameColumnStyle: React.CSSProperties = {
	width: '36%'
};

const holidayNoteColumnStyle: React.CSSProperties = {
	width: '55%'
};

const holidaySelectColumnStyle: React.CSSProperties = {
	width: '9%'
};

const checkboxLabelStyle: React.CSSProperties = {
	alignItems: 'center',
	cursor: 'pointer',
	display: 'inline-flex',
	justifyContent: 'center',
	margin: 0,
	minHeight: '1.35rem',
	minWidth: '1.35rem',
	position: 'relative'
};

const hiddenCheckboxStyle: React.CSSProperties = {
	height: '1px',
	opacity: 0,
	position: 'absolute',
	width: '1px'
};

const checkboxSquareStyle: React.CSSProperties = {
	alignItems: 'center',
	border: '1px solid #222',
	color: '#111',
	display: 'inline-flex',
	fontSize: '1.05rem',
	height: '1.25rem',
	justifyContent: 'center',
	lineHeight: 1,
	width: '1.25rem'
};

const paginationStyle: React.CSSProperties = {
	justifyContent: 'center',
	margin: '14.5rem auto 2.25rem'
};

const actionContainerStyle: React.CSSProperties = {
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: '1.25rem'
};

const outlineButtonStyle: React.CSSProperties = {
	border: '1px solid #222',
	borderRadius: 0,
	color: '#111',
	fontSize: '1rem',
	height: '2.05rem',
	minWidth: '7.2rem'
};

const wideOutlineButtonStyle: React.CSSProperties = {
	...outlineButtonStyle,
	fontSize: '1.45rem',
	height: '2.4rem',
	maxWidth: '90%',
	width: '37rem'
};

const emptyHolidayStyle: React.CSSProperties = {
	margin: '2rem auto',
	maxWidth: '40rem',
	textAlign: 'center'
};
