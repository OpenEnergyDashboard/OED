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
import { useTranslate } from '../../redux/componentHooks';
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
 *  I18N (done 7/18): all user-facing strings go through translate('...') with
 *  keys in translations/data.ts. Generic keys (cancel, note, discard.changes,
 *  unsaved.warning) are reused per Steve's guidance; new keys live under
 *  holiday.* / day.pattern.* with lightning-bolt placeholders in fr/es.
 * -------------------------------------------------------------------------
 */

interface BaseHoliday {
	id: number;
	name: string;
	location: string;
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
		() => data.map(holiday => ({
			id: holiday.id,
			name: holiday.name,
			location: holiday.location
		})),
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
 */
const useHolidayInstances = () => {
	const translate = useTranslate();
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
			.then(() => showSuccessNotification(translate('holiday.rate.create.success')))
			.catch(error => showErrorNotification(translate('holiday.rate.create.failure') + error));
	};

	const editInstance = (patch: HolidayInstancePatch) => {
		// The edit route REQUIRES holidayId even though the UI locks the base
		// holiday after create — resend the stored (unchanged) value.
		const existing = data.find(i => i.id === patch.id);
		if (existing === undefined) {
			showErrorNotification(translate('holiday.rate.edit.failure'));
			return;
		}
		editMutation({
			id: patch.id,
			name: patch.instanceName,
			holidayId: existing.holidayId,
			dayPatternId: patch.patternId,
			note: patch.note
		}).unwrap()
			.then(() => showSuccessNotification(translate('holiday.rate.edit.success')))
			.catch(error => showErrorNotification(translate('holiday.rate.edit.failure') + error));
	};

	// TODO(meeting 5): interlock — before deleting, sweep Redux state to check
	// the instance is not used in a holiday group; otherwise the foreign key
	// makes the server return a database error.
	const deleteInstance = (id: number) => {
		deleteMutation({ id }).unwrap()
			.then(() => showSuccessNotification(translate('holiday.rate.delete.success')))
			.catch(error => showErrorNotification(translate('holiday.rate.delete.failure') + error));
	};

	return { data: instances, addInstance, editInstance, deleteInstance };
};

/* End data seam */

// Sentinel values for "nothing selected yet" dropdown state, mirroring the
// -999 placeholder convention used in the conversion modals.
const NO_HOLIDAY = -999;
const NO_PATTERN = -999;

/*
 * Card clipping (meeting 6): names clip at 15 chars (Steve: put the critical
 * information in the first characters); notes keep the conversion note/log
 * convention of 30.
 */
const MAX_NAME_LENGTH = 15;
const MAX_NOTE_LENGTH = 30;
const clip = (text: string, max: number) =>
	text.length > max ? `${text.slice(0, max)} ...` : text;

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

/**
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
 * Holiday Instance page. Follows OED's standard entity-page pattern (cf. Units):
 * a Create button at the top opens a create modal; every saved instance renders
 * as a card with a Details/Edit modal that can also delete it.
 * @returns Holiday Instance page element
 */
export default function HolidayInstancePage() {
	const translate = useTranslate();
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

	const holidayLabel = (holiday: BaseHoliday) => {
		return `${holiday.name} (${holiday.location})`;
	};

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
	// Meeting 5 to-do: warn (non-blocking) when the base holiday changes after
	// a name was already entered, since the name may no longer match.
	const [showBaseChangeWarning, setShowBaseChangeWarning] = useState<boolean>(false);

	/* ---- Lookups (names are derived; IDs stay internal) ---- */
	// TODO(region): once holidays are region-filtered, an instance whose base
	// holiday falls outside the fetched set would have no name here. The
	// instances query should return the joined holiday name (or names should be
	// fetched by id) — until then, fall back to a visible placeholder rather
	// than rendering blank.
	const holidayName = (id: number) => {
		const holiday = availableHolidays.find(item => item.id === id);

		if (holiday === undefined) {
			return translate('holiday.base.unknown');
		}

		return holidayLabel(holiday);
	};
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
		() => availableHolidays.map(holiday => ({
			value: holiday.id,
			label: holidayLabel(holiday)
		})),
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
		setShowBaseChangeWarning(false);
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
					<p>{translate('holiday.rate.loading')}</p>
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
				<h2 style={titleStyle}>{translate('holiday.rates')}</h2>

				{/* ---------- Create button (mirrors "Create a Unit") ---------- */}
				<div className='text-center' style={createRowStyle}>
					<Button color='secondary' onClick={openCreate}>
						{translate('holiday.rate.create')}
					</Button>
				</div>

				{/* ---------- Instance cards ---------- */}
				<div className='card-container'>
					{instances.map(instance => (
						<div key={instance.id} className='card' title={instance.instanceName}>
							<div className='identifier-container'>
								{clip(instance.instanceName, MAX_NAME_LENGTH)}
							</div>
							{/* Bold "Label:" + value lines, like the Units cards. */}
							<div className='item-container'>
								<b>{translate('holiday.base')}</b> {holidayName(instance.baseHolidayId)}
							</div>
							<div className='item-container'>
								<b>{translate('day.pattern')}</b> {patternName(instance.patternId)}
							</div>
							{instance.note.trim().length > 0 && (
								<div className='item-container'>
									<b>{translate('note')}</b> {clip(instance.note, MAX_NOTE_LENGTH)}
								</div>
							)}
							{/* Mirrors the Units card's "Details/Edit Unit" button. */}
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

			{/* ---------- Create / Edit modal ---------- */}
			<Modal isOpen={showModal} toggle={attemptClose} size='lg'>
				{/* Headers mirror Units: "Create a Holiday Rate" / "Details/Edit Holiday Rate". */}
				<ModalHeader>
					{modalMode === 'create' ? translate('holiday.rate.create') : translate('holiday.rate.edit')}
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
														draft.baseHolidayId !== NO_HOLIDAY &&
														newId !== draft.baseHolidayId &&
														draft.instanceName.trim().length > 0
													);
													setDraft(d => ({ ...d, baseHolidayId: newId }));
												}}
												placeholder={translate('holiday.base.select')}
												isClearable
												// Red-outline the control while invalid, matching the
												// reactstrap `invalid` look on the other fields.
												styles={isHolidayInvalid ? invalidSelectStyles : undefined}
											/>
											{/* react-select isn't a reactstrap input, so FormFeedback
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
											value={holidayName(draft.baseHolidayId)}
											disabled
										/>
									)}
								</FormGroup>
							</Col>
							<Col>
								{/* Instance name — required */}
								<FormGroup>
									<Label for='instanceName'>{translate('holiday.day.name')}</Label>
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
									<FormFeedback>{translate('holiday.rate.name.required')}</FormFeedback>
								</FormGroup>
							</Col>
						</Row>

						{/* Day pattern — required. Placeholder option mirrors the conversion
						    modal's hidden/disabled -999 sentinel option. */}
						<FormGroup>
							<Label for='dayPattern'>{translate('day.pattern')}</Label>
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
									{translate('day.pattern.select')}
								</option>
								{dayPatterns.map(pattern => (
									<option value={pattern.id} key={pattern.id}>{pattern.name}</option>
								))}
							</Input>
							<FormFeedback>{translate('day.pattern.required')}</FormFeedback>
						</FormGroup>

						{/* Note — optional */}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
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

			{/* Unsaved-changes warning (meeting 4: "you're about to lose your work"). */}
			<ConfirmModal
				isOpen={showCloseConfirm}
				message={translate('unsaved.warning')}
				confirmText={translate('discard.changes')}
				confirmColor='danger'
				onConfirm={doClose}
				onCancel={() => setShowCloseConfirm(false)}
			/>

			{/* Delete guard. */}
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
