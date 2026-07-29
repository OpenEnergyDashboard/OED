/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useMemo, useState } from 'react';
import Select from 'react-select';
import {
	Button, Col, Container, FormFeedback, FormGroup, Input, Label,
	Modal, ModalBody, ModalFooter, ModalHeader, Row
} from 'reactstrap';
import { stableEmptyDays, useGetDaysQuery } from '../../redux/api/daysApi';
import {
	stableEmptyHolidayInstances,
	useAddHolidayInstanceMutation,
	useDeleteHolidayInstanceMutation,
	useEditHolidayInstanceMutation,
	useGetHolidayInstancesQuery
} from '../../redux/api/holidayInstancesApi';
import { stableEmptyHolidays, useGetHolidaysQuery } from '../../redux/api/holidaysApi';
import { useTranslate } from '../../redux/componentHooks';
import { CreateHolidayInstancePayload, Holiday, HolidayInstance } from '../../types/redux/holidays';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

// TODO: A region selector should auto-populate the base-holiday dropdown from
// the selected region's holidays once region support exists; until then the
// dropdown lists all holidays with their location in parentheses.

// Sentinel values for "nothing selected yet" dropdown state, matching the
// -999 placeholder convention used in the conversion modals.
const NO_HOLIDAY = -999;
const NO_PATTERN = -999;

// Card clipping: names clip short with the critical information first; notes
// clip at the note/log convention length.
const MAX_NAME_LENGTH = 15;
const MAX_NOTE_LENGTH = 30;

// The holiday_instance.name column is VARCHAR(50); cap the input so the
// database limit can never be hit (avoids surfacing a database error).
const MAX_NAME_DB_LENGTH = 50;
const clip = (text: string, max: number) =>
	text.length > max ? `${text.slice(0, max)} ...` : text;

// Holidays display as "Name (Location)" since the same-named holiday in a
// different location is a different holiday.
const holidayLabel = (holiday: Holiday) => `${holiday.name} (${holiday.location})`;

// Default (empty) create draft. Discard / open-create resets to this.
const defaultValues: CreateHolidayInstancePayload = {
	name: '',
	holidayId: NO_HOLIDAY,
	dayPatternId: NO_PATTERN,
	note: ''
};

type ModalMode = 'create' | 'edit';

interface ConfirmModalProps {
	isOpen: boolean;
	message: string;
	confirmText: string;
	// 'danger' for delete, 'primary'/'secondary' otherwise.
	confirmColor: string;
	onConfirm: () => void;
	onCancel: () => void;
}

/**
 * TODO: replace with the shared confirmation component
 * (ConfirmActionModalComponent on the development branch) when available here.
 * @param props Message, confirm button text/color, and confirm/cancel callbacks
 * @returns A small yes/no confirmation modal
 */
function ConfirmModal(props: ConfirmModalProps) {
	const translate = useTranslate();
	return (
		<Modal isOpen={props.isOpen} toggle={props.onCancel} centered>
			<ModalBody>{props.message}</ModalBody>
			<ModalFooter>
				<Button color='secondary' onClick={props.onCancel}>
					{translate('cancel')}
				</Button>
				<Button color={props.confirmColor} onClick={props.onConfirm}>
					{props.confirmText}
				</Button>
			</ModalFooter>
		</Modal>
	);
}

/**
 * Holiday rate page: a Create button at the top opens a create modal; every
 * saved instance renders as a card with a Details/Edit modal that can also
 * delete it.
 * @returns Holiday rate page element
 */
export default function HolidayInstancePage() {
	const translate = useTranslate();

	/* Global state (server-backed via RTK Query). */
	const { data: holidays = stableEmptyHolidays } = useGetHolidaysQuery();
	const { data: dayPatterns = stableEmptyDays } = useGetDaysQuery();
	const { data: instances = stableEmptyHolidayInstances } = useGetHolidayInstancesQuery();
	const [addHolidayInstance] = useAddHolidayInstanceMutation();
	const [editHolidayInstance] = useEditHolidayInstanceMutation();
	const [deleteHolidayInstance] = useDeleteHolidayInstanceMutation();

	const sortedHolidays = useMemo(
		() => [...holidays].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
		[holidays]
	);

	/* Local (modal) state - untied to global state until Save. */
	const [showModal, setShowModal] = useState<boolean>(false);
	const [modalMode, setModalMode] = useState<ModalMode>('create');
	// The id of the instance being edited (null in create mode).
	const [editingId, setEditingId] = useState<number | null>(null);
	// Working draft the modal edits. Reset on open/discard.
	const [draft, setDraft] = useState<CreateHolidayInstancePayload>(defaultValues);
	// Snapshot of the draft at open, used for the unsaved-changes check.
	const [initialDraft, setInitialDraft] = useState<CreateHolidayInstancePayload>(defaultValues);
	// Confirmation sub-modals: unsaved-changes warning and delete guard.
	const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
	// Warn (non-blocking) when the base holiday changes after a name was
	// already entered, since the name may no longer match.
	const [showBaseChangeWarning, setShowBaseChangeWarning] = useState<boolean>(false);

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipHolidayRateView: 'help.admin.holidayrateview'
	};

	/* Lookups (ids are internal; only names are shown to the user). */
	const holidayName = (id: number) => {
		const holiday = holidays.find(item => item.id === id);
		return holiday === undefined ? translate('holiday.base.unknown') : holidayLabel(holiday);
	};
	const patternName = (id: number) =>
		dayPatterns.find(p => p.id === id)?.name ?? '';

	// Searchable dropdown options for the base holiday.
	// TODO: swap to the shared SingleSelectComponent if it fits.
	const holidayOptions = useMemo(
		() => sortedHolidays.map(h => ({ value: h.id, label: holidayLabel(h) })),
		[sortedHolidays]
	);
	const selectedHolidayOption =
		holidayOptions.find(o => o.value === draft.holidayId) ?? null;

	/* Validation. Required fields red-outline until valid. */
	const isNameInvalid = draft.name.trim().length === 0;
	const isHolidayInvalid = draft.holidayId === NO_HOLIDAY;
	const isPatternInvalid = draft.dayPatternId === NO_PATTERN;
	const isValid = !isNameInvalid && !isHolidayInvalid && !isPatternInvalid;

	// TODO: sweep existing instances and warn/stop on duplicates before save.
	// The database enforces UNIQUE(name) and UNIQUE(holidayId, dayPatternId);
	// the UI should catch both instead of surfacing a database error.

	// In create mode initialDraft === defaultValues, so this doubles as the
	// "did they type anything at all" check for the unsaved-changes warning.
	const hasUnsavedChanges =
		draft.name !== initialDraft.name ||
		draft.holidayId !== initialDraft.holidayId ||
		draft.dayPatternId !== initialDraft.dayPatternId ||
		draft.note !== initialDraft.note;

	// Save is gated on validity AND, in edit mode, on an actual change being
	// made (the Save button only lights up once something really changes).
	const canSave = isValid && (modalMode === 'create' || hasUnsavedChanges);

	/* Handlers */
	const openCreate = () => {
		setModalMode('create');
		setEditingId(null);
		setDraft(defaultValues);
		setInitialDraft(defaultValues);
		setShowModal(true);
	};

	const openEdit = (instance: HolidayInstance) => {
		const asDraft: CreateHolidayInstancePayload = {
			name: instance.name,
			holidayId: instance.holidayId,
			dayPatternId: instance.dayPatternId,
			note: instance.note ?? ''
		};
		setModalMode('edit');
		setEditingId(instance.id);
		setDraft(asDraft);
		setInitialDraft(asDraft);
		setShowModal(true);
	};

	// Unconditional close + reset. Only reachable via Save, or after the user
	// confirms they want to lose their changes.
	const doClose = () => {
		setShowModal(false);
		setShowBaseChangeWarning(false);
		setShowCloseConfirm(false);
		setShowDeleteConfirm(false);
		setEditingId(null);
		setDraft(defaultValues);
		setInitialDraft(defaultValues);
	};

	// Close attempt (backdrop click, X, or Discard). Closing with no changes is
	// safe - close silently. With changes, warn about losing work.
	// TODO: align with the shared unsaved-changes handling used on newer pages
	// (hasUnsavedChanges flow on the development branch) when available here.
	const attemptClose = () => {
		if (hasUnsavedChanges) {
			setShowCloseConfirm(true);
		} else {
			doClose();
		}
	};

	const handleSave = () => {
		if (!canSave) {
			return;
		}
		if (modalMode === 'create') {
			addHolidayInstance(draft).unwrap()
				.then(() => showSuccessNotification(translate('holiday.rate.create.success')))
				.catch(error => showErrorNotification(translate('holiday.rate.create.failure') + error));
		} else if (editingId !== null) {
			// The edit route requires holidayId even though the UI locks the base
			// holiday after create, so the full draft is sent.
			editHolidayInstance({ id: editingId, ...draft }).unwrap()
				.then(() => showSuccessNotification(translate('holiday.rate.edit.success')))
				.catch(error => showErrorNotification(translate('holiday.rate.edit.failure') + error));
		}
		doClose();
	};

	// TODO: before deleting, check whether a holiday group references this
	// instance and block with a friendly message instead of surfacing the
	// foreign-key database error.
	const handleDeleteConfirmed = () => {
		// Delete is only reachable from the edit modal, so editingId is set;
		// this guards the type narrowing.
		if (editingId === null) {
			return;
		}
		deleteHolidayInstance({ id: editingId }).unwrap()
			.then(() => showSuccessNotification(translate('holiday.rate.delete.success')))
			.catch(error => showErrorNotification(translate('holiday.rate.delete.failure') + error));
		doClose();
	};

	return (
		<div className='flexGrowOne'>
			<TooltipHelpComponent page='holidayrates' />
			<Container className='container-fluid'>
				<h2 style={titleStyle}>
					{translate('holiday.rates')}
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='holidayrates' helpTextId={tooltipStyle.tooltipHolidayRateView} />
					</div>
				</h2>

				<div className='text-center' style={createRowStyle}>
					<Button color='secondary' onClick={openCreate}>
						{translate('holiday.rate.create')}
					</Button>
				</div>

				{/* Instance cards */}
				<div className='card-container'>
					{instances.map(instance => (
						<div key={instance.id} className='card' title={instance.name}>
							<div className='identifier-container'>
								{clip(instance.name, MAX_NAME_LENGTH)}
							</div>
							<div className='item-container'>
								<b>{translate('holiday.base')}</b> {holidayName(instance.holidayId)}
							</div>
							<div className='item-container'>
								<b>{translate('day.pattern')}</b> {patternName(instance.dayPatternId)}
							</div>
							{(instance.note ?? '').trim().length > 0 && (
								<div className='item-container'>
									<b>{translate('note')}</b> {clip(instance.note ?? '', MAX_NOTE_LENGTH)}
								</div>
							)}
							<div className='edit-btn'>
								<Button color='secondary' onClick={() => openEdit(instance)}>
									{translate('holiday.rate.edit')}
								</Button>
							</div>
						</div>
					))}
					{instances.length === 0 && (
						<p style={subtitleStyle}>{translate('holiday.rate.none')}</p>
					)}
				</div>
			</Container>

			{/* Create / Edit modal */}
			<Modal isOpen={showModal} toggle={attemptClose} size='lg'>
				<ModalHeader>
					{modalMode === 'create' ? translate('holiday.rate.create') : translate('holiday.rate.edit')}
				</ModalHeader>
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								{/* Base holiday: searchable combobox on create; locked on
								    edit - changing the base holiday invalidates the record,
								    so delete and recreate instead. */}
								<FormGroup>
									<Label for='baseHoliday'>{translate('holiday.base')}</Label>
									{modalMode === 'create' ? (
										<>
											<Select
												inputId='baseHoliday'
												name='baseHoliday'
												options={holidayOptions}
												value={selectedHolidayOption}
												onChange={option => {
													const newId = option ? option.value : NO_HOLIDAY;
													// Warn if a real selection changes while a name is set.
													setShowBaseChangeWarning(
														draft.holidayId !== NO_HOLIDAY &&
														newId !== draft.holidayId &&
														draft.name.trim().length > 0
													);
													setDraft(d => ({ ...d, holidayId: newId }));
												}}
												placeholder={translate('holiday.base.select')}
												isClearable
												styles={isHolidayInvalid ? invalidSelectStyles : undefined}
											/>
											{/* react-select is not a reactstrap input, so FormFeedback
											    needs d-block to render next to it. */}
											{isHolidayInvalid && (
												<FormFeedback className='d-block'>
													{translate('holiday.base.required')}
												</FormFeedback>
											)}
											{showBaseChangeWarning && !isHolidayInvalid && (
												<FormFeedback className='d-block text-warning'>
													{translate('holiday.base.changed.warning')}
												</FormFeedback>
											)}
										</>
									) : (
										<Input
											id='baseHoliday'
											name='baseHoliday'
											type='text'
											value={holidayName(draft.holidayId)}
											disabled
										/>
									)}
								</FormGroup>
							</Col>
							<Col>
								{/* Instance name - required */}
								<FormGroup>
									<Label for='name'>{translate('holiday.day.name')}</Label>
									<Input
										id='name'
										name='name'
										type='text'
										value={draft.name}
										maxLength={MAX_NAME_DB_LENGTH}
										onChange={e =>
											setDraft(d => ({ ...d, name: e.target.value }))
										}
										invalid={isNameInvalid}
									/>
									<FormFeedback>{translate('holiday.rate.name.required')}</FormFeedback>
								</FormGroup>
							</Col>
						</Row>

						{/* Day pattern - required. Placeholder option uses the hidden/
						    disabled sentinel option convention. */}
						<FormGroup>
							<Label for='dayPattern'>{translate('day.pattern')}</Label>
							<Input
								id='dayPattern'
								name='dayPattern'
								type='select'
								value={draft.dayPatternId}
								onChange={e =>
									setDraft(d => ({ ...d, dayPatternId: Number(e.target.value) }))
								}
								invalid={isPatternInvalid}
							>
								<option
									value={NO_PATTERN}
									hidden={draft.dayPatternId !== NO_PATTERN}
									disabled
								>
									{translate('day.pattern.select')}
								</option>
								{dayPatterns.map(pattern => (
									<option value={pattern.id} key={pattern.id}>{pattern.name}</option>
								))}
							</Input>
							<FormFeedback>{translate('day.pattern.required')}</FormFeedback>
						</FormGroup>

						{/* Note - optional */}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								value={draft.note ?? ''}
								onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
							/>
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					{modalMode === 'edit' && (
						<Button
							color='danger'
							onClick={() => setShowDeleteConfirm(true)}
							style={{ marginRight: 'auto' }}
						>
							{translate('holiday.rate.delete')}
						</Button>
					)}
					<Button color='secondary' onClick={attemptClose}>
						{translate('discard.changes')}
					</Button>
					<Button color='primary' onClick={handleSave} disabled={!canSave}>
						{modalMode === 'create' ? translate('holiday.rate.create.save') : translate('holiday.rate.save')}
					</Button>
				</ModalFooter>
			</Modal>

			{/* Unsaved-changes warning */}
			<ConfirmModal
				isOpen={showCloseConfirm}
				message={translate('unsaved.warning')}
				confirmText={translate('discard.changes')}
				confirmColor='danger'
				onConfirm={doClose}
				onCancel={() => setShowCloseConfirm(false)}
			/>

			{/* Delete guard */}
			<ConfirmModal
				isOpen={showDeleteConfirm}
				message={translate('holiday.rate.delete.confirm')}
				confirmText={translate('holiday.rate.delete')}
				confirmColor='danger'
				onConfirm={handleDeleteConfirmed}
				onCancel={() => setShowDeleteConfirm(false)}
			/>
		</div>
	);
}

/* Local style objects.
   TODO: candidates for styles/modalStyle if other pages want them. */

const subtitleStyle: React.CSSProperties = {
	fontSize: '1rem',
	color: 'gray',
	fontWeight: 500
};

const createRowStyle: React.CSSProperties = {
	margin: '10px 0'
};

// Mimics Bootstrap's .is-invalid red outline on the react-select control so
// the required-field cue matches the reactstrap inputs.
const invalidSelectStyles = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	control: (base: any) => ({
		...base,
		borderColor: '#dc3545',
		'&:hover': { borderColor: '#dc3545' }
	})
};
