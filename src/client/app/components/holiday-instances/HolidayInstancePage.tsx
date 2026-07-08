/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
	Button, Col, Container, FormFeedback, FormGroup, Input, Label,
	Modal, ModalBody, ModalFooter, ModalHeader, Row
} from 'reactstrap';
import { titleStyle } from '../../styles/modalStyle';

/*
 * -------------------------------------------------------------------------
 *  DATA SEAM  (temporary — replace with real RTK Query hooks when the
 *  backend routes / API slices exist)
 *
 *  When the backend is ready, delete the two mock hooks below and swap in:
 *    - holidaysApi.useGetHolidaysQuery()            -> raw holidays (Inbox)
 *    - dayPatternsApi.useGetDayPatternsQuery()      -> day pattern options
 *    - holidayInstancesApi.useAddHolidayInstanceMutation() -> save (Outbox)
 *
 *  The component body below only touches the *return values* of these hooks,
 *  so wiring the real API should be a change confined to this block.
 * -------------------------------------------------------------------------
 */

interface BaseHoliday {
	id: number;
	name: string;
	date: string;
}

interface DayPatternOption {
	id: number;
	name: string;
}

interface ConfiguredInstance {
	instanceName: string;
	baseHolidayId: number;
	baseHolidayName: string;
	patternId: number;
	patternName: string;
	note: string;
}

// Mock: stands in for holidaysApi.useGetHolidaysQuery()
// Returns the raw holidays Rose's page will eventually save to the `holidays` table.
const useHolidaysMock = () => {
	const [data, setData] = useState<BaseHoliday[]>([]);
	const [isFetching, setIsFetching] = useState<boolean>(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setData([
				{ id: 1, name: "New Year's Day 2026", date: 'Jan 1, 2026' },
				{ id: 2, name: 'Thanksgiving 2026', date: 'Nov 26, 2026' }
			]);
			setIsFetching(false);
		}, 500);
		return () => clearTimeout(timer);
	}, []);

	return { data, isFetching };
};

// Mock: stands in for dayPatternsApi.useGetDayPatternsQuery()
// Day patterns already exist in the schema and do NOT depend on Rose's page.
const useDayPatternsMock = (): { data: DayPatternOption[] } => {
	return {
		data: [
			{ id: 101, name: 'Winter Rate' },
			{ id: 102, name: 'Summer Rate' },
			{ id: 103, name: 'Standard Rate' }
		]
	};
};

/* End data seam */

// Sentinel value for the "nothing selected yet" state of the pattern dropdown,
// mirroring the -999 / -99 placeholder convention used in the conversion modals.
const NO_PATTERN = -999;

// Cards truncate long names at 30 chars, matching the conversion note/log convention.
const MAX_NAME_LENGTH = 30;
const truncate = (text: string) =>
	text.length > MAX_NAME_LENGTH ? `${text.slice(0, MAX_NAME_LENGTH)} ...` : text;

/**
 * Holiday Instance page. Raw holidays appear as Inbox cards; clicking one opens
 * a modal to lock it to a day pattern, producing a configured instance (Outbox)
 * that the Holiday Instance Group page will consume.
 * @returns Holiday Instance page element
 */
export default function HolidayInstancePage() {
	/* Data (mock seam) */
	const { data: availableHolidaysData, isFetching } = useHolidaysMock();
	const { data: dayPatterns } = useDayPatternsMock();

	/* Local state */
	// Inbox: raw holidays not yet configured. Seeded from the fetch, then
	// items are removed as they get configured into instances.
	const [availableHolidays, setAvailableHolidays] = useState<BaseHoliday[]>([]);
	// Outbox: configured instances, ready for the grouping page.
	const [configuredInstances, setConfiguredInstances] = useState<ConfiguredInstance[]>([]);

	// Modal + active form draft
	const [showModal, setShowModal] = useState<boolean>(false);
	const [activeHoliday, setActiveHoliday] = useState<BaseHoliday | null>(null);
	const [draftName, setDraftName] = useState<string>('');
	const [draftPatternId, setDraftPatternId] = useState<number>(NO_PATTERN);
	const [draftNote, setDraftNote] = useState<string>('');

	// Seed the Inbox once the (mock) fetch resolves.
	useEffect(() => {
		setAvailableHolidays(availableHolidaysData);
	}, [availableHolidaysData]);

	/* Derived validation — matches the conversion modal's invalid/disabled pattern */
	const isNameInvalid = draftName.trim().length === 0;
	const isPatternInvalid = draftPatternId === NO_PATTERN;
	const isValid = !isNameInvalid && !isPatternInvalid;

	/* Handlers */
	const handleCardClick = (holiday: BaseHoliday) => {
		setActiveHoliday(holiday);
		setDraftName(holiday.name); // Pre-fill name to save the user time
		setDraftPatternId(NO_PATTERN);
		setDraftNote('');
		setShowModal(true);
	};

	const handleClose = () => {
		setShowModal(false);
		setActiveHoliday(null);
	};

	const handleSave = () => {
		if (!activeHoliday || !isValid) {
			return;
		}
		const pattern = dayPatterns.find(p => p.id === draftPatternId);
		const newInstance: ConfiguredInstance = {
			instanceName: draftName,
			baseHolidayId: activeHoliday.id,
			baseHolidayName: activeHoliday.name,
			patternId: draftPatternId,
			patternName: pattern ? pattern.name : '',
			note: draftNote
		};
		// Move from Inbox to Outbox.
		// When the real API is wired, this is where addHolidayInstanceMutation(payload) goes.
		setConfiguredInstances(prev => [...prev, newInstance]);
		setAvailableHolidays(prev => prev.filter(h => h.id !== activeHoliday.id));
		handleClose();
	};

	if (isFetching) {
		return (
			<div className='flexGrowOne'>
				<div className='text-center'>
					<p>Loading holidays...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flexGrowOne'>
			<Container className='container-fluid'>
				{/* ---------- Section 1: Inbox ---------- */}
				<h2 style={titleStyle}>Available Holidays</h2>
				<p style={subtitleStyle}>Click a holiday to configure its rate schedule.</p>

				<div className='card-container'>
					{availableHolidays.map(holiday => (
						<div
							key={holiday.id}
							className='card'
							style={clickableCardStyle}
							onClick={() => handleCardClick(holiday)}
							title={holiday.name}
						>
							<div className='identifier-container'>
								{truncate(holiday.name)}
							</div>
							<div className='item-container'>
								<b>Date:</b> {holiday.date}
							</div>
							<div className='edit-btn'>
								<Button color='secondary'>Configure Instance</Button>
							</div>
						</div>
					))}
					{availableHolidays.length === 0 && (
						<p style={subtitleStyle}>All available holidays have been configured.</p>
					)}
				</div>

				{/* ---------- Section 2: Outbox ---------- */}
				<h2 style={titleStyle}>Configured Instances</h2>
				<p style={subtitleStyle}>Ready to be picked up on the Holiday Instance Group page.</p>

				<div className='card-container'>
					{configuredInstances.map((instance, index) => (
						<div key={index} className='card' title={instance.instanceName}>
							<div className='identifier-container'>
								{truncate(instance.instanceName)}
							</div>
							<div className='item-container'>
								<b>Base Holiday:</b> {instance.baseHolidayName}
							</div>
							<div className='item-container'>
								<b>Day Pattern:</b> {instance.patternName}
							</div>
						</div>
					))}
					{configuredInstances.length === 0 && (
						<p style={subtitleStyle}>No instances configured yet.</p>
					)}
				</div>
			</Container>

			{/* ---------- Configuration Modal ---------- */}
			<Modal isOpen={showModal} toggle={handleClose} size='lg'>
				<ModalHeader>Configure Holiday Instance</ModalHeader>
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								{/* Base holiday is locked in by which card was clicked -> disabled */}
								<FormGroup>
									<Label for='baseHoliday'>Base Holiday</Label>
									<Input
										id='baseHoliday'
										name='baseHoliday'
										type='text'
										value={activeHoliday ? activeHoliday.name : ''}
										disabled
									/>
								</FormGroup>
							</Col>
							<Col>
								{/* Instance name — required */}
								<FormGroup>
									<Label for='instanceName'>Instance Name</Label>
									<Input
										id='instanceName'
										name='instanceName'
										type='text'
										value={draftName}
										onChange={e => setDraftName(e.target.value)}
										invalid={isNameInvalid}
									/>
									<FormFeedback>Name is required.</FormFeedback>
								</FormGroup>
							</Col>
						</Row>

						{/* Day pattern — required. Placeholder option mirrors the conversion
						    modal's hidden/disabled -999 sentinel option. */}
						<FormGroup>
							<Label for='dayPattern'>Day Pattern</Label>
							<Input
								id='dayPattern'
								name='dayPattern'
								type='select'
								value={draftPatternId}
								onChange={e => setDraftPatternId(Number(e.target.value))}
								invalid={isPatternInvalid}
							>
								<option
									value={NO_PATTERN}
									key={NO_PATTERN}
									hidden={draftPatternId !== NO_PATTERN}
									disabled
								>
									Select a day pattern...
								</option>
								{dayPatterns.map(pattern => (
									<option value={pattern.id} key={pattern.id}>{pattern.name}</option>
								))}
							</Input>
							<FormFeedback>A day pattern is required.</FormFeedback>
						</FormGroup>

						{/* Note — optional */}
						<FormGroup>
							<Label for='note'>Note</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								value={draftNote}
								onChange={e => setDraftNote(e.target.value)}
							/>
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button color='secondary' onClick={handleClose}>
						Discard Changes
					</Button>
					<Button color='primary' onClick={handleSave} disabled={!isValid}>
						Save
					</Button>
				</ModalFooter>
			</Modal>
		</div>
	);
}

/* Local style objects mirror the conversion page's imported titleStyle.
   When you settle in, these can move to styles/modalStyle for reuse. */

const subtitleStyle: React.CSSProperties = {
	fontSize: '1rem',
	color: 'gray',
	fontWeight: 500
};

const clickableCardStyle: React.CSSProperties = {
	cursor: 'pointer'
};
