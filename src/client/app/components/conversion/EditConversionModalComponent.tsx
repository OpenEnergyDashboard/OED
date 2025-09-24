/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
// Realize that * is already imported from react
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormGroup, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { conversionsApi, selectConversionsDetails } from '../../redux/api/conversionsApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { selectGroupDataById } from '../../redux/api/groupsApi';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { ConversionData } from '../../types/redux/conversions';
import { UnitData, UnitType } from '../../types/redux/units';
import { useTranslate } from '../../redux/componentHooks';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { SimpleUnsavedWarningComponent } from '../SimpleUnsavedWarningComponent';


interface EditConversionModalComponentProps {
	show: boolean;
	conversion: ConversionData;
	conversionIdentifier: string;
	// passed in to handle opening the modal
	handleShow: () => void;
	// passed in to handle closing the modal
	handleClose: () => void;
}

/**
 * Defines the edit conversion modal form
 * @param props Props for the component
 * @returns Conversion edit element
 */
export default function EditConversionModalComponent(props: EditConversionModalComponentProps) {
	const translate = useTranslate();
	const [editConversion] = conversionsApi.useEditConversionMutation();
	const [triggerSimulate] = conversionsApi.useLazySimulateDeleteConversionQuery();
	const [deleteConversion] = conversionsApi.useDeleteConversionMutation();
	const unitDataById = useAppSelector(selectUnitDataById);
	const meterDataById = useAppSelector(selectMeterDataById);
	const groupDataById = useAppSelector(selectGroupDataById);
	const conversionDetails = useAppSelector(selectConversionsDetails);

	// boolean that updates if any change is made to any conversion modal
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
	// If there are no changes, then save is disabled
	const [canSave, setCanSave] = useState(false);

	// displays the unsaved warning component whenever there's unsaved
	// changes, otherwise closes out of the modal
	const handleToggle = () => {
		if (hasUnsavedChanges) {
			setShowUnsavedWarning(true);
		}
		else {
			// Proceed to close the modal
			props.handleClose();
		}
	};

	// Set existing conversion values
	const values = { ...props.conversion };

	/* State */
	// Handlers for each type of input change
	const [state, setState] = useState(values);
	const [metersWithLostDefault, setMetersWithLostDefault] = useState<number[]>([]);
	const [groupsWithLostDefault, setGroupsWithLostDefault] = useState<number[]>([]);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: Number(e.target.value) });
	};
	/* End State */

	// Determines whether the selected source is of type meter
	const isMeterSource = () => {
		const source = unitDataById[state.sourceId];
		return source?.typeOfUnit === UnitType.meter;
	};

	// Determine whether the selected source or destination is a suffix unit
	const isSuffixUsed = () => {
		const source = unitDataById[state.sourceId];
		const dest = unitDataById[state.destinationId];
		return source?.typeOfUnit === UnitType.suffix || dest?.typeOfUnit === UnitType.suffix;
	};

	/**
	 * Calculates the number of conversions that use a given unit as a source or destination (not both).
	 * @param unit The unit that is used for calculating the number of conversions.
	 * @param conversions An array of conversion data objects, each representing a conversion
	 * @returns The sum of conversions that use the provided unit.
	 */
	const getConversionCount = (unit: UnitData, conversions: ConversionData[]) => {
		let count = 0;
		const unitId = unit.id;
		// If the given unit is a source only count conversions that share the same source.
		if (unitId === state.sourceId) {
			for (const conversion of conversions) {
				if (conversion.sourceId === unitId) {
					count++;
				}
			}
			// If the given unit is a destination only count conversions that share the same destination.
		} else if (unitId === state.destinationId) {
			for (const conversion of conversions) {
				if (conversion.destinationId === unitId) {
					count++;
				}
			}
		}
		return count;
	};
	// Performs checks to warn the admin of the impact deleting a conversion will have on meter units and possible graphing units.
	const checkState = async () => {
		const source = unitDataById[state.sourceId];
		const dest = unitDataById[state.destinationId];
		const msgElements: React.ReactNode[] = [];
		let cancel = false;

		// Meter source orphan check
		if (source.typeOfUnit === UnitType.meter) {
			// How many conversions have this conversion's source so are conversions from a meter.
			const srcCount = getConversionCount(source, conversionDetails);
			// How many meters use this conversion, i.e., have the source as its unit.
			const relatedMeters = Object.values(meterDataById).filter(meter => meter.unitId === source.id);

			if (srcCount === 1 && relatedMeters.length !== 0) {
				// This is the only conversion for this meter unit so if it is removed then
				// you cannot graph any meters using this unit. Not allowed to delete if
				// any meters use this unit as in this case.
				msgElements.push(
					<div key="meter-orphan">
						<span className="bold">{translate('conversion.delete.meter.orphan')} </span>
						&quot;{source.name}&quot;.
						<br />
						<span className="bold">{translate('conversion.delete.meter.related')} </span>
						&quot;{source.name}&quot;:
						<ul>
							{relatedMeters.map(meter => (
								<li key={meter.id}>&quot;{meter.name}&quot;</li>
							))}
						</ul>
					</div>
				);
				cancel = true;
			} else if (relatedMeters.length !== 0) {
				// Some meters use this meter unit but there are other ways to graph it,
				// so warn the admin and tell each meter impacted.
				msgElements.push(
					<div key="meter-related">
						<span className="bold">{translate('conversion.delete.meter.related')} </span>
						&quot;{source.name}&quot;:
						<ul>
							{relatedMeters.map(meter => (
								<li key={meter.id}>&quot;{meter.name}&quot;</li>
							))}
						</ul>
						<span className="bold">{translate('conversion.delete.meter.reduce.graphable')} </span>
						&quot;{source.name}&quot;.
					</div>
				);
			} else if (srcCount === 1) {
				// No meters use this meter unit so warn that will is ungraphable if used.
				msgElements.push(
					<div key="meter-orphan-alone">
						<span className="bold">{translate('conversion.delete.meter.orphan')} </span>
						&quot;{source.name}&quot;.
					</div>
				);
			} else {
				// No meters use this meter unit so warn that reduced graphable units if used.
				msgElements.push(
					<div key="meter-reduce-graphable">
						<span className="bold">{translate('conversion.delete.meter.reduce.graphable')} </span>
						&quot;{source.name}&quot;.
					</div>
				);
			}
			//	TODO The following code did what was originally in issue #905 but there were issues
			//	with the design and usage of suffix units. It is commented out for now and needs
			//	to be revisited when the design for suffix is better.
			//	} else if (source.typeOfUnit === UnitType.suffix) {
			//		const srcCount = getConversionCount(source, conversionDetails);
			//		if (srcCount === 1) {
			//			msg += `${translate('conversion.delete.suffix.disable')} "${source.name}".\n`;
			//  }
		}

		// Unit-to-unit orphan check
		if (source.typeOfUnit === UnitType.unit && dest.typeOfUnit === UnitType.unit) {
			const destConversions = conversionDetails.filter(conversion =>
				(conversion.destinationId === dest.id) ||
				(conversion.bidirectional && conversion.sourceId === dest.id)
			);

			const remainingDestConversions = destConversions.filter(conversion =>
				!(conversion.sourceId === source.id && conversion.destinationId === dest.id)
			);

			if (remainingDestConversions.length === 0) {
				msgElements.push(
					<div key="unit-orphan">
						<span className="bold">{translate('conversion.delete.unit.orphan')} </span>
						"{dest.name}".
					</div>
				);
			}
		}

		// Only run simulation if the previous orphan check passed and it's unit-to-unit
		if (source.typeOfUnit !== UnitType.suffix && dest.typeOfUnit === UnitType.unit && !cancel) {
			try {
				const result = await triggerSimulate({
					sourceId: state.sourceId,
					destinationId: state.destinationId
				}).unwrap();

				// Orphaned groups check
				const orphanedGroups = result.affectedGroups?.filter(group => group.orphaned);
				if (orphanedGroups.length > 0) {
					msgElements.push(
						<div key="orphaned-groups">
							<span className="bold">{translate('conversion.delete.group.orphan')}:</span>
							<ul>
								{orphanedGroups.map(group => (
									<li key={group.groupName}>"{group.groupName}"</li>
								))}
							</ul>
						</div>
					);
					cancel = true;
				} else {
					// Group meters by lostUnits
					const meterLossMap = new Map<string, string[]>();
					result.affectedMeters.forEach(meter => {
						const key = JSON.stringify([...meter.lostUnits].sort());
						if (!meterLossMap.has(key)) {
							meterLossMap.set(key, []);
						}
						meterLossMap.get(key)!.push(meter.meterName);
					});
					meterLossMap.forEach((meterNames, lostUnitsKey) => {
						const lostUnits = JSON.parse(lostUnitsKey).map(Number);
						msgElements.push(
							<div key={`meters-${lostUnitsKey}`}>
								<span className="bold">{translate('conversion.delete.meter.affected')}: </span>
								<div style={{ marginLeft: 16 }}>
									{meterNames.map(name => (
										<div key={name}>"{name}"</div>
									))}
								</div>
								<span className="bold">{translate('conversion.delete.lost.units')}: </span>
								{lostUnits.map((id: number, i: number) => (
									<span key={id}>"{unitDataById[id]?.name || id}"{i < lostUnits.length - 1 ? ', ' : ''}</span>
								))}
								<br /><br />
							</div>
						);
					});

					// Group non-orphaned groups by lostUnits
					const groupLossMap = new Map<string, string[]>();
					const nonOrphanedGroups = result.affectedGroups?.filter(group => !group.orphaned);
					nonOrphanedGroups.forEach(group => {
						const key = JSON.stringify([...group.lostUnits].sort());
						if (!groupLossMap.has(key)) {
							groupLossMap.set(key, []);
						}
						groupLossMap.get(key)!.push(group.groupName);
					});
					groupLossMap.forEach((groupNames, lostUnitsKey) => {
						const lostUnits = JSON.parse(lostUnitsKey).map(Number);
						msgElements.push(
							<div key={`groups-${lostUnitsKey}`}>
								<span className="bold">{translate('conversion.delete.group.affected')}: </span>
								<div style={{ marginLeft: 16 }}>
									{groupNames.map(name => (
										<div key={name}>"{name}"</div>
									))}
								</div>
								<span className="bold">{translate('conversion.delete.lost.units')}: </span>
								{lostUnits.map((id: number, i: number) => (
									<span key={id}>"{unitDataById[id]?.name || id}"{i < lostUnits.length - 1 ? ', ' : ''}</span>
								))}
								<br /><br />
							</div>
						);
					});

					// After you get result from simulateDeleteConversion check default graphic units
					const metersLostDefault: number[] = [];
					const groupsLostDefault: number[] = [];

					result.affectedMeters.forEach(meter => {
						const meterData = meterDataById[meter.meterId];
						const lostDefault = meter.lostUnits.includes(meterData.defaultGraphicUnit);
						if (lostDefault) {
							metersLostDefault.push(meter.meterId);
							msgElements.push(
								<div key={`meter-default-${meter.meterId}`}>
									<span className="bold">{translate('conversion.delete.meter.default.lost')}</span>
									<br />
									"{meterData.name}"
									<br />
									({translate('conversion.default.graphic.unit')}: "<span>{unitDataById[meterData.defaultGraphicUnit].name}</span>")
								</div>
							);
						}
					});

					result.affectedGroups?.forEach(group => {
						const groupData = groupDataById[group.groupId];
						const lostDefault = group.lostUnits.includes(groupData.defaultGraphicUnit);
						if (lostDefault) {
							groupsLostDefault.push(group.groupId);
							msgElements.push(
								<div key={`group-default-${group.groupId}`}>
									<span className="bold">{translate('conversion.delete.group.default.lost')}</span>
									<br />
									"{groupData.name}"
									<br />
									({translate('conversion.default.graphic.unit')}: <span>{unitDataById[groupData.defaultGraphicUnit].name}</span>)
								</div>
							);
						}
					});
					setMetersWithLostDefault(metersLostDefault);
					setGroupsWithLostDefault(groupsLostDefault);
				}
			} catch (e) {
				msgElements.push(
					<div key="simulation-error">
						{translate('conversion.delete.simulation.error')}
					</div>
				);
				cancel = true;
			}
		}

		if (cancel) {
			msgElements.push(
				<div key="restricted">
					<br />
					{translate('conversion.delete.restricted')}
				</div>
			);
			setDeleteConfirmationMessage(msgElements);
			handleCancelModalOpen();
		} else {
			msgElements.push(
				<div key="final-confirm">
					{translate('conversion.delete.conversion')} [{props.conversionIdentifier}] ?
				</div>
			);
			setDeleteConfirmationMessage(msgElements);
			handleDeleteConfirmationModalOpen();
		}
	};
	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [deleteConfirmationMessage, setDeleteConfirmationMessage] = useState<React.ReactNode>(
		<div>{translate('conversion.delete.conversion')} [{props.conversionIdentifier}] ?</div>);
	const deleteConfirmText = translate('conversion.delete.conversion');
	const deleteRejectText = translate('cancel');
	// The first two handle functions below are required because only one Modal can be open at a time (properly)
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		handleShow();
	};
	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	};
	const handleDeleteConversion = async () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);

		const payload = {
			sourceId: state.sourceId,
			destinationId: state.destinationId,
			meterIds: metersWithLostDefault,
			groupIds: groupsWithLostDefault
		};
		deleteConversion(payload)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('conversion.delete.success'));
			}).catch(error => {
				showErrorNotification(translate('conversion.delete.failure') + error.data.message);
			});
	};

	const handleCancelModalClose = () => {
		// Hide the warning modal
		setShowCancelModal(false);
		// Show the edit modal
		handleShow();
	};
	const handleCancelModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowCancelModal(true);
	};
	const handleCancel = () => {
		// Closes the warning modal
		setShowCancelModal(false);
	};

	/* End Confirm Delete Modal */

	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateConversionModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit conversions will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setState(values);
	};

	const handleShow = () => {
		props.handleShow();
	};

	const handleClose = () => {
		props.handleClose();
		resetState();
	};
	/* Warning Modal State */
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [warningMessage, setWarningMessage] = useState('');

	const handleWarningConfirm = () => {
		// Close the warning modal
		setShowWarningModal(false);

		// Proceed with saving changes
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// Need to redo Cik if slope, intercept, or bidirectional changes.
		const shouldRedoCik = props.conversion.slope !== state.slope
			|| props.conversion.intercept !== state.intercept
			|| props.conversion.bidirectional !== state.bidirectional;
		// Check for changes by comparing state to props
		const conversionHasChanges = shouldRedoCik || props.conversion.note != state.note;
		// Only do work if there are changes
		if (conversionHasChanges) {
			// Save our changes
			editConversion({
				conversionData: {
					...state,
					bidirectional: (isMeterSource() || isSuffixUsed()) ? false : state.bidirectional
				}, shouldRedoCik
			});
		}
	};
	const handleWarningCancel = () => {
		// Close the warning modal
		setShowWarningModal(false);
	};

	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input i
	// Edit Conversion Validation: is not needed as no breaking edits can be made
	const handleSaveChanges = () => {
		// Check if slope and intercept are both 0
		if (state.slope === 0 && state.intercept === 0) {
			setWarningMessage(translate('conversion.slope.intercept.zero'));
			setShowWarningModal(true);
		} else {
			// Close the modal first to avoid repeat clicks
			props.handleClose();

			// Need to redo Cik if slope, intercept, or bidirectional changes.
			const shouldRedoCik = props.conversion.slope !== state.slope
				|| props.conversion.intercept !== state.intercept
				|| props.conversion.bidirectional !== state.bidirectional;
			// Check for changes by comparing state to props
			const conversionHasChanges = shouldRedoCik || props.conversion.note != state.note;
			// Only do work if there are changes
			if (conversionHasChanges) {
				// Save our changes
				editConversion({
					conversionData: {
						...state,
						bidirectional: (isMeterSource() || isSuffixUsed()) ? false : state.bidirectional
					}, shouldRedoCik
				});
			}
		}
	};

	// Checks if edit made.
	// References the original implementation in EditUnitModalComponent.tsx
	useEffect(() => {
		// Compare the local changes to the default values
		const editMade =
			props.conversion.sourceId !== state.sourceId
			|| props.conversion.destinationId !== state.destinationId
			|| props.conversion.bidirectional !== state.bidirectional
			|| props.conversion.slope !== state.slope
			|| props.conversion.intercept !== state.intercept
			|| props.conversion.note !== state.note;
		// Automatically checks for unsaved changes and addresses the issue
		// of having to manually set the setHasUnsavedChanges
		// If editMade is true, then hasUnsavedChanges will be set to true.
		setHasUnsavedChanges(editMade);
		// If editsMade, then canSave is true (saving is enabled)
		setCanSave(editMade);
	}, [state]);

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditConversionView: 'help.admin.conversionedit'
	};

	return (
		<>
			{/* Unsaved Warning Component */}
			{showUnsavedWarning && (
				<SimpleUnsavedWarningComponent
					isOpen={showUnsavedWarning}
					onDiscard={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						handleClose();
						resetState();
					}}
					onConfirm={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						handleSaveChanges();
						handleClose();
					}}
					onCancel={() => setShowUnsavedWarning(false)}
					disabled={!canSave}
				/>
			)}
			{/* Warning Modal */}
			<ConfirmActionModalComponent
				show={showWarningModal}
				actionConfirmMessage={warningMessage}
				handleClose={handleWarningCancel}
				actionFunction={handleWarningConfirm}
				actionConfirmText={translate('confirm.action')}
				actionRejectText={translate('cancel')} />
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteConversion}
				actionConfirmText={deleteConfirmText}
				actionRejectText={deleteRejectText} />
			<ConfirmActionModalComponent
				show={showCancelModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleCancelModalClose}
				actionFunction={handleCancel}
				actionConfirmText={deleteRejectText}
				actionRejectText={deleteRejectText}
				forceCancel={true} />
			<Modal isOpen={props.show} toggle={handleToggle}>
				<ModalHeader>
					<FormattedMessage id="conversion.edit.conversion" />
					<TooltipHelpComponent page='conversions-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='conversions-edit' helpTextId={tooltipStyle.tooltipEditConversionView} />
					</div>
				</ModalHeader>
				{/* when any of the conversion are changed call one of the functions. */}
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								{/* Source unit - display only */}
								<FormGroup>
									<Label for='sourceId'>{translate('conversion.source')}</Label>
									<Input
										id='sourceId'
										name='sourceId'
										type='text'
										defaultValue={unitDataById[state.sourceId]?.identifier}
										// Disable input to prevent changing ID value
										disabled>
									</Input>
								</FormGroup>
							</Col>
							<Col>
								{/* Destination unit - display only */}
								<FormGroup>
									<Label for='destinationId'>{translate('conversion.destination')}</Label>
									<Input
										id='destinationId'
										name='destinationId'
										type='text'
										defaultValue={unitDataById[state.destinationId]?.identifier}
										// Disable input to prevent changing ID value
										disabled>
									</Input>
								</FormGroup>
							</Col>
						</Row>
						{/* Bidirectional Y/N input */}
						<FormGroup>
							<Label for='bidirectional'>{translate('conversion.bidirectional')}</Label>
							<Input
								id='bidirectional'
								name='bidirectional'
								type='select'
								defaultValue={state.bidirectional.toString()}
								onChange={e => { handleBooleanChange(e); }}
								invalid={(isMeterSource() || isSuffixUsed()) && state.bidirectional === true}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
								})}
							</Input>
							{isMeterSource() && state.bidirectional === true && (
								<FormFeedback className='d-block'>
									<FormattedMessage id="conversion.bidirectional.disabled.meter" />
								</FormFeedback>
							)}
							{isSuffixUsed() && state.bidirectional === true && (
								<FormFeedback className='d-block'>
									<FormattedMessage id="conversion.bidirectional.disabled.suffix" />
								</FormFeedback>
							)}
						</FormGroup>
						<Row xs='1' lg='2'>
							<Col>
								{/* Slope input */}
								<FormGroup>
									<Label for='slope'>{translate('conversion.slope')}</Label>
									<Input
										id='slope'
										name='slope'
										type='number'
										value={state.slope}
										onChange={e => { handleNumberChange(e); }}
									/>
								</FormGroup>
							</Col>
							<Col>
								{/* Intercept input */}
								<FormGroup>
									<Label for='intercept'>{translate('conversion.intercept')}</Label>
									<Input
										id='intercept'
										name='intercept'
										type='number'
										value={state.intercept}
										onChange={e => { handleNumberChange(e); }}
									/>
								</FormGroup>
							</Col>
						</Row>
						{/* Note input */}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								defaultValue={state.note}
								placeholder='Note'
								onChange={e => { handleStringChange(e); }}
							/>
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button color='danger' onClick={checkState}>
						<FormattedMessage id="conversion.delete.conversion" />
					</Button>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSaveChanges} disabled={!canSave}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
