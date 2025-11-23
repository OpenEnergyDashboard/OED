/* eslint-disable @typescript-eslint/indent */
/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { conversionsApi } from '../../redux/api/conversionsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectDefaultCreateConversionValues, selectIsValidConversion } from '../../redux/selectors/adminSelectors';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { showErrorNotification } from '../../utils/notifications';
import { useTranslate } from '../../redux/componentHooks';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import { UnitType } from '../../types/redux/units';

/**
 * Defines the create conversion modal form
 * @returns Conversion create element
 */
export default function CreateConversionModalComponent() {
	const translate = useTranslate();
	const [addConversionMutation] = conversionsApi.useAddConversionMutation();
	// Want units in sorted order by identifier regardless of case.

	const defaultValues = useAppSelector(selectDefaultCreateConversionValues);

	/* State */
	// Modal show
	const [showModal, setShowModal] = useState(false);

	// State for the warning modal
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [warningMessage, setWarningMessage] = useState('');

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};
	const handleShow = () => setShowModal(true);

	// Handlers for each type of input change
	const [conversionState, setConversionState] = useState({
  overallConversion: {
    sourceId: defaultValues.sourceId,
    destinationId: defaultValues.destinationId,
    bidirectional: defaultValues.bidirectional,
    note: defaultValues.overallConversionNote
  },
  initialConversion: {
    sourceId: defaultValues.sourceId,
    destinationId: defaultValues.destinationId,
    bidirectional: defaultValues.bidirectional,
    slope: defaultValues.slope,
    intercept: defaultValues.intercept,
    pattern: defaultValues.weeklyPattern,
    note: defaultValues.initialConversionNote
  },
  sourceOptions: defaultValues.sourceOptions,
  destinationOptions: defaultValues.destinationOptions,
  weeklyPatterns: defaultValues.weeklyPattern
});

	// If the currently selected conversion is valid
	// TODO: Add a check for the weekly pattern as well.
	const [validConversion, reason] = useAppSelector(state =>
		selectIsValidConversion(state, {
			sourceId: conversionState.initialConversion.sourceId,
			destinationId: conversionState.initialConversion.destinationId,
			bidirectional: conversionState.initialConversion.bidirectional,
			slope: conversionState.initialConversion.slope,
			intercept: conversionState.initialConversion.intercept,
			//pattern: conversionState.initialConversion.pattern,
			note: conversionState.initialConversion.note
		})
	);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'overallConversionNote') {
        setConversionState(prev => ({
            ...prev,
            overallConversion: {
                ...prev.overallConversion,
                note: value
            }
        }));
    } else if (name === 'initialConversionNote') {
        setConversionState(prev => ({
            ...prev,
            initialConversion: {
                ...prev.initialConversion,
                note: value
            }
        }));
    }
};
	// const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	setConversionState({ ...conversionState, [e.target.name]: JSON.parse(e.target.value) });
	// };

	// const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	// 	// once a source or destination is selected, it will be removed from the other options.
	// 	if (e.target.name === 'sourceId') {
	// 		setConversionState(state => ({
	// 			...state,
	// 			sourceId: Number(e.target.value),
	// 			destinationOptions: defaultValues.destinationOptions.filter(destination => destination.id !== Number(e.target.value))
	// 		}));
	// 	} else if (e.target.name === 'destinationId') {
	// 		setConversionState(state => ({
	// 			...state,
	// 			destinationId: Number(e.target.value),
	// 			sourceOptions: defaultValues.sourceOptions.filter(source => source.id !== Number(e.target.value))
	// 		}));
	// 	} else {
	// 		setConversionState(state => ({ ...state, [e.target.name]: Number(e.target.value) }));
	// 	}
	// };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = Number(value);

    setConversionState(prev => {
        if (name === 'sourceId') {
            return {
                ...prev,
                overallConversion: {
                    ...prev.overallConversion,
                    sourceId: newValue
                },
                initialConversion: {
                    ...prev.initialConversion,
                    sourceId: newValue
                },
                destinationOptions: defaultValues.destinationOptions.filter(destination => destination.id !== newValue)
            };
        } else if (name === 'destinationId') {
            return {
                ...prev,
                overallConversion: {
                    ...prev.overallConversion,
                    destinationId: newValue
                },
                initialConversion: {
                    ...prev.initialConversion,
                    destinationId: newValue
                },
                sourceOptions: defaultValues.sourceOptions.filter(source => source.id !== newValue)
            };
        } else {
            return {
                ...prev,
                initialConversion: {
                    ...prev.initialConversion,
                    [name]: newValue
                }
            };
        }
    });
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value === 'true';
		setConversionState(prev => ({
			...prev,
			overallConversion: {
				...prev.overallConversion,
				bidirectional: value
			},
			initialConversion: {
				...prev.initialConversion,
				bidirectional: value
			}
		}));
	};

	const handleInitialPatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedPattern = e.target.value;
		setConversionState(prev => ({
			...prev,
			initialConversion: {
				...prev.initialConversion,
				pattern: selectedPattern,
				slope: selectedPattern === 'No Pattern' ? prev.initialConversion.slope : 0,
				intercept: selectedPattern === 'No Pattern' ? prev.initialConversion.intercept : 0
			}
		}));
	};
	/* End State */

	// Determines whether the selected source is of type meter
	const isMeterSource = () => {
		const source = defaultValues.sourceOptions.find(u => u.id === conversionState.overallConversion.sourceId);
		return source?.typeOfUnit === UnitType.meter;
	};

	// Determine whether the selected source or destination is a suffix unit
	const isSuffixUsed = () => {
		const source = defaultValues.sourceOptions.find(u => u.id === conversionState.overallConversion.sourceId);
		const dest = defaultValues.sourceOptions.find(u => u.id === conversionState.overallConversion.destinationId);
		return source?.typeOfUnit === UnitType.suffix || dest?.typeOfUnit === UnitType.suffix;
	};

	/* Warning Modal */
	const handleWarningConfirm = () => {
		//Close the warning modal
		setShowWarningModal(false);

		// TODO: Replace this with a proper overall and initial conversion creation logic once the backend is ready
		// Create a placeholder payload for the conversion creation until backend is ready
		const payload = {
			sourceId: conversionState.overallConversion.sourceId,
			destinationId: conversionState.overallConversion.destinationId,
			bidirectional: (isMeterSource() || isSuffixUsed()) ? false : conversionState.overallConversion.bidirectional,
			note: conversionState.overallConversion.note,
			slope: conversionState.initialConversion.slope,
			intercept: conversionState.initialConversion.intercept,
			pattern: conversionState.initialConversion.pattern,
			initialNote: conversionState.initialConversion.note
		};
		console.log(
			'sourceId:', conversionState.overallConversion.sourceId, typeof conversionState.overallConversion.sourceId,
			'destinationId:', conversionState.overallConversion.destinationId, typeof conversionState.overallConversion.destinationId
		);
		addConversionMutation(payload);
		resetState();
	};

	const handleWarningCancel = () => {
		//Close the warning modal
		setShowWarningModal(false);
	};

	// Reset the state to default values
	const resetState = () => {
		setConversionState({
			overallConversion: {
				sourceId: defaultValues.sourceId,
				destinationId: defaultValues.destinationId,
				bidirectional: defaultValues.bidirectional,
				note: defaultValues.overallConversionNote
			},
			initialConversion: {
				sourceId: defaultValues.sourceId,
				destinationId: defaultValues.destinationId,
				bidirectional: defaultValues.bidirectional,
				slope: defaultValues.slope,
				intercept: defaultValues.intercept,
				pattern: defaultValues.weeklyPattern,
				note: defaultValues.initialConversionNote
			},
			sourceOptions: defaultValues.sourceOptions,
			destinationOptions: defaultValues.destinationOptions,
			weeklyPatterns: defaultValues.weeklyPattern
		});
	};
	/* End Warning Modal */

	// Submit
	const handleSubmit = () => {
		// Show warning modal if slope and intercept are both 0
		if (conversionState.initialConversion.slope === 0 && conversionState.initialConversion.intercept === 0) {
			setWarningMessage(translate('conversion.slope.intercept.zero'));
			setShowWarningModal(true);
		} else if (validConversion) {
			// Close modal first to avoid repeat clicks
			setShowModal(false);
			// Add the new conversion and update the store
			// Omit the source options , do not need to send in request so remove here.
			// If source is a meter, make bidirectional false
			// If source or destination is a suffix unit, make bidirectional false

			// TODO: Replace this with a proper overall and initial conversion creation logic once the backend is ready
			// Example updated logic for creating a conversion:
			// 1. Create overall conversion
			//const overallResult = await addConversionMutation(conversionState.overallConversion).unwrap();
			// 2. Create initial conversion with foreign key
			// await addConversionMutation({
			// 	...conversionState.initialConversion,
			// 	overallConversionId: overallResult.id
			// });

			// Create a placeholder payload for the conversion creation until backend is ready
			const payload = {
        sourceId: conversionState.overallConversion.sourceId,
        destinationId: conversionState.overallConversion.destinationId,
        bidirectional: (isMeterSource() || isSuffixUsed()) ? false : conversionState.overallConversion.bidirectional,
        note: conversionState.overallConversion.note,
        slope: conversionState.initialConversion.slope,
        intercept: conversionState.initialConversion.intercept,
        pattern: conversionState.initialConversion.pattern,
        initialNote: conversionState.initialConversion.note
			};
			addConversionMutation(payload);
			resetState();
		} else {
			showErrorNotification(reason);
		}
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateConversionView: 'help.admin.conversioncreate'
	};

	return (
		<>
			<ConfirmActionModalComponent
				show={showWarningModal}
				actionConfirmMessage={warningMessage}
				handleClose={handleWarningCancel}
				actionFunction={handleWarningConfirm}
				actionConfirmText={translate('confirm.action')}
				actionRejectText={translate('cancel')}
			/>
			{/* Show modal button */}
			<Button color='secondary' onClick={handleShow}>
				<FormattedMessage id="create.conversion" />
			</Button>

			<Modal isOpen={showModal} toggle={handleClose} size='lg'>
				<ModalHeader>
					<FormattedMessage id="create.conversion" />
					<TooltipHelpComponent page='conversions-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='conversions-create' helpTextId={tooltipStyle.tooltipCreateConversionView} />
					</div>
				</ModalHeader>
				{/* when any of the conversion are changed call one of the functions. */}
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								{/* Source unit input*/}
								<FormGroup>
									<Label for='sourceId'>{translate('conversion.source')}</Label>
									<Input
										id='sourceId'
										name='sourceId'
										type='select'
										value={conversionState.overallConversion.sourceId}
										onChange={e => handleNumberChange(e)}
										invalid={conversionState.overallConversion.sourceId === -999}>
										{<option
											value={-999}
											key={-999}
											hidden={conversionState.overallConversion.sourceId !== -999}
											disabled>
											{translate('conversion.select.source') + '...'}
										</option>}
										{Object.values(conversionState.sourceOptions).map(unitData => {
											return (<option value={unitData.id} key={unitData.id}>{unitData.identifier}</option>);
										})}
									</Input>
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
							<Col>
								{/* Destination unit input*/}
								<FormGroup>
									<Label for='destinationId'>{translate('conversion.destination')}</Label>
									<Input
										id='destinationId'
										name='destinationId'
										type='select'
										value={conversionState.overallConversion.destinationId}
										onChange={e => handleNumberChange(e)}
										invalid={conversionState.overallConversion.destinationId === -999}>
										{<option
											value={-999}
											key={-999}
											hidden={conversionState.overallConversion.destinationId !== -999}
											disabled>
											{translate('conversion.select.destination') + '...'}
										</option>}
										{Object.values(conversionState.destinationOptions).map(unitData => {
											return (<option value={unitData.id} key={unitData.id}>{unitData.identifier}</option>);
										})}
									</Input>
									<FormFeedback>
										<FormattedMessage id="error.required" />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						{/* Bidirectional Y/N input*/}
						<FormGroup>
							<Label for='bidirectional'>{translate('conversion.bidirectional')}</Label>
							<Input
								id='bidirectional'
								name='bidirectional'
								type='select'
								onChange={e => handleBooleanChange(e)}
								value={String(conversionState.overallConversion.bidirectional)}
								invalid={(isMeterSource() || isSuffixUsed()) && conversionState.overallConversion.bidirectional === true}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
								})}
							</Input>
							{isMeterSource() && conversionState.overallConversion.bidirectional === true && (
								<FormFeedback className='d-block'>
									<FormattedMessage id="conversion.bidirectional.disabled.meter"/>
								</FormFeedback>
							)}
							{isSuffixUsed() && conversionState.overallConversion.bidirectional === true &&  (
								<FormFeedback className='d=block'>
									<FormattedMessage id="conversion.bidirectional.disabled.suffix"/>
								</FormFeedback>
							)}
						</FormGroup>
						{/* Note input for overall conversion*/}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='overallConversionNote'
								name='overallConversionNote'
								type='textarea'
								onChange={e => handleStringChange(e)}
								value={conversionState.overallConversion.note} />
						</FormGroup>
						{/*Initial conversion*/}
						<h5 className="mt-3 mb-2">Initial Conversion</h5>
						<Row xs='1' lg='2'>
							<Col>
								{/* Slope input*/}
								<FormGroup>
									<Label for='slope'>{translate('conversion.slope')}</Label>
									<Input
										id='slope'
										name='slope'
										type='number'
										value={conversionState.initialConversion.slope}
										onChange={e => handleNumberChange(e)}
										disabled={conversionState.initialConversion.pattern !== 'No Pattern'} />
								</FormGroup>
							</Col>
							<Col>
								{/* Intercept input*/}
								<FormGroup>
									<Label for='intercept'>{translate('conversion.intercept')}</Label>
									<Input
										id='intercept'
										name='intercept'
										type='number'
										value={conversionState.initialConversion.intercept}
										onChange={e => handleNumberChange(e)}
										disabled={conversionState.initialConversion.pattern !== 'No Pattern'} />
								</FormGroup>
							</Col>
						</Row>
						{/* Pattern dropdown for weekly pattern or no pattern */}
						<FormGroup>
							<Label for='pattern'>{translate('conversion.pattern')}</Label>
							<Input
								id='pattern'
								name='pattern'
								type='select'
								value={conversionState.initialConversion.pattern}
								onChange={handleInitialPatternChange}>
								{/* TODO: Replace with actual patterns from the backend
									<option value='No Pattern'>No Pattern</option>
								{defaultValues.weeklyPatterns?.map(p => (
									<option key={p} value={p}>{p}</option>
								))} */}
								<option value='No Pattern'>No Pattern</option>
								<option value='Pattern 1'>Pattern 1</option>
								<option value='Pattern 2'>Pattern 2</option>
							</Input>
						</FormGroup>
						{/* Note input for initial conversion*/}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='initialConversionNote'
								name='initialConversionNote'
								type='textarea'
								onChange={e => handleStringChange(e)}
								value={conversionState.initialConversion.note} />
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					{
						// Todo looks kind of bad make a better visible notification
						!validConversion && <p>{reason}</p>
					}

					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSubmit} disabled={!validConversion} >
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
