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
import { titleStyle } from '../../styles/modalStyle';
import { stableEmptyDays, useGetDaysQuery } from '../../redux/api/daysApi';
import {
	stableEmptyHolidayInstances,
	useAddHolidayInstanceMutation,
	useDeleteHolidayInstanceMutation,
	useEditHolidayInstanceMutation,
	useGetHolidayInstancesQuery
} from '../../redux/api/holidayInstancesApi';
import { stableEmptyHolidays, useGetHolidaysQuery } from '../../redux/api/holidaysApi';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';

/*
 * -------------------------------------------------------------------------
 *  DATA SEAM  (wired 7/18 — real RTK Query hooks)
 *
 *  The adapter hooks below consume the real API slices (holidaysApi, daysApi,
 *  holidayInstancesApi) and expose the same shape the component consumed from
 *  the old mocks, translating between this file's internal field names and the
 *  server's wire names (instanceName <-> name, baseHolidayId <-> holidayId,
 *  patternId <-> dayPatternId). The component body consumes only the hook
 *  return values, so it did not change in the swap.
 *
 *  REGION (meeting 4 / 7-2): Steve wants a region selector that auto-populates
 *  the base-holiday dropdown from the selected region's holidays. That is
 *  blocked on Rose's region API + the team's single-vs-multi-region decision,
 *  so it is stubbed below (see `REGION STUB`). For now the base-holiday
 *  dropdown is fed by the full mock holiday list.
 *
 *  UNIQUENESS (meeting 3, clarified 7/7): multiple instances of the SAME base
 *  holiday (at different rates) are allowed here on purpose — no uniqueness
 *  check belongs on this page. The "same holiday twice" guard lives on Jason's
 *  group page.
 *
 *  TERMINOLOGY (meeting 4): user-facing text says "Holiday Rate" (Steve's
 *  suggestion — "instance" is too technical for admins). Internal names keep
 *  "instance" to match the holiday_instance table and route names. Wording
 *  mirrors the Units page: "Holiday Rates" / "Create a Holiday Rate" /
 *  "Details/Edit Holiday Rate".
 *
 *  I18N (deferred on purpose): strings are hardcoded English for now so the
 *  page works without touching translations/data.ts. Before merging upstream,
 *  swap the STRINGS object values for translate('...') calls — every
 *  user-facing string routes through STRINGS below, so the refactor is
 *  confined to that one block.
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

/*
 * Create vs Edit types (meeting 4 / 7-2): the base payload carries NO id.
 * Create sends exactly this. Edit extends it with the id. This keeps `create`
 * from ever sending an id, matching OED's tightened route parameter checks.
 */
interface HolidayInstanceData {
	instanceName: string;
	baseHolidayId: number;
	patternId: number;
	note: string;
}

interface HolidayInstance extends HolidayInstanceData {
	id: number;
}

/*
 * Edit payload. The base holiday is immutable after create (meeting-4
 * decision: changing region/base holiday invalidates the instance — delete
 * and recreate instead), so the PATCH payload omits `baseHolidayId` entirely
 * rather than resending it. Matches OED's tightened route parameter checking:
 * don't send fields the route won't accept.
 */
type HolidayInstancePatch = Omit<HolidayInstanceData, 'baseHolidayId'> & { id: number };

// Base holidays from the `holidays` table (populated via Rose's page).
const useHolidays = () => {
	const { data = stableEmptyHolidays, isFetching } = useGetHolidaysQuery();
	const mapped = useMemo<BaseHoliday[]>(
		() => data.map(h => ({ id: h.id, name: h.name, date: h.startDate })),
		[data]
	);
	return { data: mapped, isFetching };
};

// Day patterns: OED's existing days slice (`day_patterns` table). Day
// ({ id, name, note }) structurally satisfies DayPatternOption.
const useDayPatterns = (): { data: DayPatternOption[]; isFetching: boolean } => {
	const { data = stableEmptyDays, isFetching } = useGetDaysQuery();
	return { data, isFetching };
};

/*
 * Instances + mutations. Each mutation invalidates the HolidayInstances cache
 * tag, so the list refetches from the server — global state is never written
 * from the local copy (Steve's state model, meeting 4).
 * TODO(i18n): notification strings move to translate('...') with the rest.
 */
const useHolidayInstances = () => {
	const { data = stableEmptyHolidayInstances } = useGetHolidayInstancesQuery();
	const [addMutation] = useAddHolidayInstanceMutation();
	const [editMutation] = useEditHolidayInstanceMutation();
	const [deleteMutation] = useDeleteHolidayInstanceMutation();

	const instances = useMemo<HolidayInstance[]>(
		() => data.map(i => ({
			id: i.id,
			instanceName: i.name,
			baseHolidayId: i.holidayId,
			patternId: i.dayPatternId,
			note: i.note ?? ''
		})),
		[data]
	);

	const addInstance = (draft: HolidayInstanceData) => {
		addMutation({
			name: draft.instanceName,
			holidayId: draft.baseHolidayId,
			dayPatternId: draft.patternId,
			note: draft.note
		}).unwrap()
			.then(() => showSuccessNotification(STRINGS.createSuccess))
			.catch(error => showErrorNotification(STRINGS.createFailure + error));
	};

	const editInstance = (patch: HolidayInstancePatch) => {
		// The edit route REQUIRES holidayId even though the UI locks the base
		// holiday after create — resend the stored (unchanged) value.
		const existing = data.find(i => i.id === patch.id);
		if (existing === undefined) {
			showErrorNotification(STRINGS.editFailure);
			return;
		}
		editMutation({
			id: patch.id,
			name: patch.instanceName,
			holidayId: existing.holidayId,
			dayPatternId: patch.patternId,
			note: patch.note
		}).unwrap()
			.then(() => showSuccessNotification(STRINGS.editSuccess))
			.catch(error => showErrorNotification(STRINGS.editFailure + error));
	};

	// TODO(meeting 5): interlock — before deleting, sweep Redux state to check
	// the instance is not used in a holiday group; otherwise the foreign key
	// makes the server return a database error.
	const deleteInstance = (id: number) => {
		deleteMutation({ id }).unwrap()
			.then(() => showSuccessNotification(STRINGS.deleteSuccess))
			.catch(error => showErrorNotification(STRINGS.deleteFailure + error));
	};

	return { data: instances, addInstance, editInstance, deleteInstance };
};

/* End data seam */

/*
 * All user-facing text, in one place. TODO(i18n): replace each value with the
 * matching translate('...') call and add the keys to translations/data.ts —
 * nothing outside this object needs to change.
 */
const STRINGS = {
	pageTitle: 'Holiday Rates',
	createButton: 'Create a Holiday Rate',
	detailsButton: 'Details/Edit Holiday Rate',
	noRates: 'No holiday rates have been created yet.',
	loading: 'Loading holidays...',
	baseHoliday: 'Base Holiday:',
	baseHolidaySelect: 'Select or search for a holiday...',
	baseHolidayRequired: 'Base holiday is required',
	baseHolidayUnknown: '(unknown holiday)',
	rateName: 'Holiday Rate Name:',
	nameRequired: 'Name is required',
	dayPattern: 'Day Pattern:',
	dayPatternSelect: 'Select a day pattern',
	dayPatternRequired: 'Day pattern is required',
	note: 'Note:',
	deleteButton: 'Delete Holiday Rate',
	discardButton: 'Discard Changes',
	createSaveButton: 'Create Holiday Rate',
	saveButton: 'Save Holiday Rate',
	cancel: 'Cancel',
	unsavedWarning: 'You have unsaved changes. Are you sure you want to discard them?',
	deleteWarning: 'Are you sure you want to delete this holiday rate? This cannot be undone.',
	createSuccess: 'Holiday rate created',
	createFailure: 'Failed to create holiday rate: ',
	editSuccess: 'Holiday rate saved',
	editFailure: 'Failed to save holiday rate: ',
	deleteSuccess: 'Holiday rate deleted',
	deleteFailure: 'Failed to delete holiday rate: '
};

// Sentinel values for "nothing selected yet" dropdown state, mirroring the
// -999 placeholder convention used in the conversion modals.
const NO_HOLIDAY = -999;
const NO_PATTERN = -999;

// Cards truncate long names at 30 chars, matching the conversion note/log convention.
const MAX_NAME_LENGTH = 30;
const truncate = (text: string) =>
	text.length > MAX_NAME_LENGTH ? `${text.slice(0, MAX_NAME_LENGTH)} ...` : text;

// Default (empty) create draft. Discard / open-create resets to this.
const EMPTY_DRAFT: HolidayInstanceData = {
	instanceName: '',
	baseHolidayId: NO_HOLIDAY,
	patternId: NO_PATTERN,
	note: ''
};

type ModalMode = 'create' | 'edit';

/*
 * Small yes/no confirmation modal shaped like OED's ConfirmActionModalComponent.
 * TODO(repo): once this file lives in the OED repo, replace this local
 * stand-in with the shared ConfirmActionModalComponent.
 */
interface ConfirmModalProps {
	isOpen: boolean;
	message: string;
	confirmText: string;
	// 'danger' for delete, 'primary'/'secondary' otherwise.
	confirmColor: string;
	onConfirm: () => void;
	onCancel: () => void;
}

function ConfirmModal(props: ConfirmModalProps) {
	return (
		<Modal isOpen={props.isOpen} toggle={props.onCancel} centered>
			<ModalBody>{props.message}</ModalBody>
			<ModalFooter>
				<Button color='secondary' onClick={props.onCancel}>
					{STRINGS.cancel}
				</Button>
				<Button color={props.confirmColor} onClick={props.onConfirm}>
					{props.confirmText}
				</Button>
			</ModalFooter>
		</Modal>
	);
}

/**
 * Holiday Instance page. Follows OED's standard entity-page pattern (cf. Units):
 * a Create button at the top opens a create modal; every saved instance renders
 * as a card with a Details/Edit modal that can also delete it.
 * @returns Holiday Instance page element
 */
export default function HolidayInstancePage() {
	/* Data (real backend via the adapter hooks in the seam above) */
	const { data: holidaysData, isFetching: holidaysFetching } = useHolidays();
	const { data: dayPatterns, isFetching: patternsFetching } = useDayPatterns();
	const { data: instances, addInstance, editInstance, deleteInstance } = useHolidayInstances();

	/*
	 * REGION STUB (meeting 4): when the region selector lands, `availableHolidays`
	 * becomes "holidays for the selected region(s)" instead of the full list, and
	 * a <Input type='select'> for region gets added to the page header. The rest
	 * of this component does not need to change — it only reads `availableHolidays`.
	 *
	 * Sorted by name (meeting 4: ~50 holidays/region; date sorting is awkward
	 * because the date varies by year, so name is the safe default).
	 */
	const availableHolidays = useMemo(
		() => [...holidaysData].sort((a, b) => a.name.localeCompare(b.name)),
		[holidaysData]
	);

	/* ---- Local (modal) state — untied to global state until Save ---- */
	const [showModal, setShowModal] = useState<boolean>(false);
	const [modalMode, setModalMode] = useState<ModalMode>('create');
	// The id of the instance being edited (null in create mode).
	const [editingId, setEditingId] = useState<number | null>(null);
	// Working draft the modal edits. Reset on open/discard.
	const [draft, setDraft] = useState<HolidayInstanceData>(EMPTY_DRAFT);
	// Snapshot of the draft at open, used for the dirty check.
	const [initialDraft, setInitialDraft] = useState<HolidayInstanceData>(EMPTY_DRAFT);
	// Confirmation sub-modals: unsaved-changes warning and delete guard.
	const [showCloseConfirm, setShowCloseConfirm] = useState<boolean>(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

	/* ---- Lookups (names are derived; IDs stay internal) ---- */
	// TODO(region): once holidays are region-filtered, an instance whose base
	// holiday falls outside the fetched set would have no name here. The
	// instances query should return the joined holiday name (or names should be
	// fetched by id) — until then, fall back to a visible placeholder rather
	// than rendering blank.
	const holidayName = (id: number) =>
		availableHolidays.find(h => h.id === id)?.name ?? STRINGS.baseHolidayUnknown;
	const patternName = (id: number) =>
		dayPatterns.find(p => p.id === id)?.name ?? '';

	/*
	 * Searchable dropdown options (meeting 4: with up to ~50 holidays the
	 * dropdown should be searchable by name). react-select is already an OED
	 * dependency (meter/group pickers), and it handles the type-to-filter
	 * behavior itself — one combobox instead of a filter box + select.
	 * TODO(repo): if OED's shared SingleSelectComponent fits, swap to it.
	 */
	const holidayOptions = useMemo(
		() => availableHolidays.map(h => ({ value: h.id, label: h.name })),
		[availableHolidays]
	);
	const selectedHolidayOption =
		holidayOptions.find(o => o.value === draft.baseHolidayId) ?? null;

	/* ---- Validation (invalid/disabled pattern from the conversion modal) ---- */
	const isNameInvalid = draft.instanceName.trim().length === 0;
	const isHolidayInvalid = draft.baseHolidayId === NO_HOLIDAY;
	const isPatternInvalid = draft.patternId === NO_PATTERN;
	const isValid = !isNameInvalid && !isHolidayInvalid && !isPatternInvalid;

	// In create mode initialDraft === EMPTY_DRAFT, so isDirty doubles as the
	// "did they type anything at all" check for the unsaved-changes warning.
	const isDirty =
		draft.instanceName !== initialDraft.instanceName ||
		draft.baseHolidayId !== initialDraft.baseHolidayId ||
		draft.patternId !== initialDraft.patternId ||
		draft.note !== initialDraft.note;

	// Save is gated on validity AND, in edit mode, on an actual change being made
	// (mirrors OED: the Save button only lights up once something really changes).
	const canSave = isValid && (modalMode === 'create' || isDirty);

	/* ---- Handlers ---- */
	const openCreate = () => {
		setModalMode('create');
		setEditingId(null);
		setDraft(EMPTY_DRAFT);
		setInitialDraft(EMPTY_DRAFT);
		setShowModal(true);
	};

	const openEdit = (instance: HolidayInstance) => {
		const asDraft: HolidayInstanceData = {
			instanceName: instance.instanceName,
			baseHolidayId: instance.baseHolidayId,
			patternId: instance.patternId,
			note: instance.note
		};
		setModalMode('edit');
		setEditingId(instance.id);
		setDraft(asDraft);
		setInitialDraft(asDraft); // dirty check compares against this
		setShowModal(true);
	};

	// Unconditional close + reset. Only reachable via Save, or after the user
	// confirms they want to lose their changes.
	const doClose = () => {
		setShowModal(false);
		setShowCloseConfirm(false);
		setShowDeleteConfirm(false);
		setEditingId(null);
		setDraft(EMPTY_DRAFT);
		setInitialDraft(EMPTY_DRAFT);
	};

	/*
	 * Close attempt (backdrop click, X, or Discard). OED pattern (meeting 4):
	 * clicking off a modal with NO changes is safe — close silently. With
	 * changes, pop the "you're about to lose your work" warning. Discard goes
	 * through the same gate on purpose: mis-clicking Discard instead of Save is
	 * exactly the accidental loss Steve described.
	 */
	const attemptClose = () => {
		if (isDirty) {
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
			addInstance(draft);
		} else if (editingId !== null) {
			// baseHolidayId is immutable in edit mode (locked field below), so the
			// patch deliberately omits it — see HolidayInstancePatch.
			editInstance({
				id: editingId,
				instanceName: draft.instanceName,
				patternId: draft.patternId,
				note: draft.note
			});
		}
		doClose();
	};

	const handleDeleteConfirmed = () => {
		if (editingId === null) {
			return;
		}
		deleteInstance(editingId);
		doClose();
	};

	if (holidaysFetching || patternsFetching) {
		return (
			<div className='flexGrowOne'>
				<div className='text-center'>
					<p>{STRINGS.loading}</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flexGrowOne'>
			<Container className='container-fluid'>
				{/* ---------- Page title (mirrors "Units") ----------
				    TODO(repo): Units renders a TooltipMarkerComponent help icon next
				    to the title — add it once this lives in the OED repo. */}
				<h2 style={titleStyle}>{STRINGS.pageTitle}</h2>

				{/* ---------- Create button (mirrors "Create a Unit") ---------- */}
				<div className='text-center' style={createRowStyle}>
					<Button color='secondary' onClick={openCreate}>
						{STRINGS.createButton}
					</Button>
				</div>

				{/* ---------- Instance cards ---------- */}
				<div className='card-container'>
					{instances.map(instance => (
						<div key={instance.id} className='card' title={instance.instanceName}>
							<div className='identifier-container'>
								{truncate(instance.instanceName)}
							</div>
							{/* Bold "Label:" + value lines, like the Units cards. */}
							<div className='item-container'>
								<b>{STRINGS.baseHoliday}</b> {holidayName(instance.baseHolidayId)}
							</div>
							<div className='item-container'>
								<b>{STRINGS.dayPattern}</b> {patternName(instance.patternId)}
							</div>
							{instance.note.trim().length > 0 && (
								<div className='item-container'>
									<b>{STRINGS.note}</b> {truncate(instance.note)}
								</div>
							)}
							{/* Mirrors the Units card's "Details/Edit Unit" button. */}
							<div className='edit-btn'>
								<Button color='secondary' onClick={() => openEdit(instance)}>
									{STRINGS.detailsButton}
								</Button>
							</div>
						</div>
					))}
					{instances.length === 0 && (
						<p style={subtitleStyle}>{STRINGS.noRates}</p>
					)}
				</div>
			</Container>

			{/* ---------- Create / Edit modal ---------- */}
			<Modal isOpen={showModal} toggle={attemptClose} size='lg'>
				{/* Headers mirror Units: "Create a Holiday Rate" / "Details/Edit Holiday Rate". */}
				<ModalHeader>
					{modalMode === 'create' ? STRINGS.createButton : STRINGS.detailsButton}
				</ModalHeader>
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								{/* Base holiday.
								    CREATE: a required searchable combobox (react-select) — click
								    it and type to filter, e.g. "Thanks" -> Thanksgiving. Name-
								    sorted, up to ~50 per region (meeting 4).
								    EDIT: locked. Meeting-4 decision — changing the region/base
								    holiday effectively invalidates the instance, so it can't be
								    edited in place; delete + create a new one instead. */}
								<FormGroup>
									<Label for='baseHoliday'>{STRINGS.baseHoliday}</Label>
									{modalMode === 'create' ? (
										<>
											<Select
												inputId='baseHoliday'
												name='baseHoliday'
												options={holidayOptions}
												value={selectedHolidayOption}
												onChange={option =>
													setDraft(d => ({
														...d,
														baseHolidayId: option ? option.value : NO_HOLIDAY
													}))
												}
												placeholder={STRINGS.baseHolidaySelect}
												isClearable
												// Red-outline the control while invalid, matching the
												// reactstrap `invalid` look on the other fields.
												styles={isHolidayInvalid ? invalidSelectStyles : undefined}
											/>
											{/* react-select isn't a reactstrap input, so FormFeedback
											    needs d-block to render next to it. */}
											{isHolidayInvalid && (
												<FormFeedback className='d-block'>
													{STRINGS.baseHolidayRequired}
												</FormFeedback>
											)}
										</>
									) : (
										<Input
											id='baseHoliday'
											name='baseHoliday'
											type='text'
											value={holidayName(draft.baseHolidayId)}
											disabled
										/>
									)}
								</FormGroup>
							</Col>
							<Col>
								{/* Instance name — required */}
								<FormGroup>
									<Label for='instanceName'>{STRINGS.rateName}</Label>
									<Input
										id='instanceName'
										name='instanceName'
										type='text'
										value={draft.instanceName}
										onChange={e =>
											setDraft(d => ({ ...d, instanceName: e.target.value }))
										}
										invalid={isNameInvalid}
									/>
									<FormFeedback>{STRINGS.nameRequired}</FormFeedback>
								</FormGroup>
							</Col>
						</Row>

						{/* Day pattern — required. Placeholder option mirrors the conversion
						    modal's hidden/disabled -999 sentinel option. */}
						<FormGroup>
							<Label for='dayPattern'>{STRINGS.dayPattern}</Label>
							<Input
								id='dayPattern'
								name='dayPattern'
								type='select'
								value={draft.patternId}
								onChange={e =>
									setDraft(d => ({ ...d, patternId: Number(e.target.value) }))
								}
								invalid={isPatternInvalid}
							>
								<option
									value={NO_PATTERN}
									hidden={draft.patternId !== NO_PATTERN}
									disabled
								>
									{STRINGS.dayPatternSelect}
								</option>
								{dayPatterns.map(pattern => (
									<option value={pattern.id} key={pattern.id}>{pattern.name}</option>
								))}
							</Input>
							<FormFeedback>{STRINGS.dayPatternRequired}</FormFeedback>
						</FormGroup>

						{/* Note — optional */}
						<FormGroup>
							<Label for='note'>{STRINGS.note}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								value={draft.note}
								onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
							/>
						</FormGroup>
					</Container>
				</ModalBody>
				{/* Footer mirrors the Units modal: "Delete Unit" (danger, left) /
				    "Discard Changes" / Save (primary). Save is mode-dependent and
				    self-explanatory (meeting 4: every button should say the same,
				    self-explanatory thing). */}
				<ModalFooter>
					{/* TODO(page-3): once Jason's groups reference instances, deleting an
					    instance that belongs to a group needs an interlock check (block or
					    cascade per team decision). */}
					{modalMode === 'edit' && (
						<Button
							color='danger'
							onClick={() => setShowDeleteConfirm(true)}
							style={{ marginRight: 'auto' }}
						>
							{STRINGS.deleteButton}
						</Button>
					)}
					<Button color='secondary' onClick={attemptClose}>
						{STRINGS.discardButton}
					</Button>
					<Button color='primary' onClick={handleSave} disabled={!canSave}>
						{modalMode === 'create' ? STRINGS.createSaveButton : STRINGS.saveButton}
					</Button>
				</ModalFooter>
			</Modal>

			{/* Unsaved-changes warning (meeting 4: "you're about to lose your work"). */}
			<ConfirmModal
				isOpen={showCloseConfirm}
				message={STRINGS.unsavedWarning}
				confirmText={STRINGS.discardButton}
				confirmColor='danger'
				onConfirm={doClose}
				onCancel={() => setShowCloseConfirm(false)}
			/>

			{/* Delete guard. */}
			<ConfirmModal
				isOpen={showDeleteConfirm}
				message={STRINGS.deleteWarning}
				confirmText={STRINGS.deleteButton}
				confirmColor='danger'
				onConfirm={handleDeleteConfirmed}
				onCancel={() => setShowDeleteConfirm(false)}
			/>
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

const createRowStyle: React.CSSProperties = {
	margin: '10px 0'
};

// Mimics Bootstrap's .is-invalid red outline on the react-select control so the
// required-field cue matches the reactstrap inputs. `base` is react-select's
// CSSObjectWithLabel; typed loosely to avoid pinning a react-select version.
const invalidSelectStyles = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	control: (base: any) => ({
		...base,
		borderColor: '#dc3545',
		'&:hover': { borderColor: '#dc3545' }
	})
};
