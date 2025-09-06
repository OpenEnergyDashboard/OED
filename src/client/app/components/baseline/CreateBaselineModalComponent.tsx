/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { baselineApi } from '../../redux/api/baselineApi';
import { useTranslate } from '../../redux/componentHooks';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectDefaultCreateBaselineValues } from '../../redux/selectors/adminSelectors';
import '../../styles/modal.css';
import { TrueFalseType } from '../../types/items';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import { isAction } from '@reduxjs/toolkit';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

/**
 * Defines the create baseline modal form
 * @returns Baseline create element
 */
export default function CreateBaselineModalComponent({ currentMeterId }: { currentMeterId: number }) {
    // /* Hooks & Selectors */
    const translate = useTranslate();
    const [addBaselineMutation] = baselineApi.useAddBaselineMutation();



    const defaultValues = useAppSelector(state => selectDefaultCreateBaselineValues(state, currentMeterId));
    // /* End Hooks & Selectors */

    /* Utility Functions */
    // Utility to get the initial pattern state
    const getInitialPatternState = () => ({
        Baseline: {
            meterId: currentMeterId,
            isActive: defaultValues.isActive,
            note: defaultValues.note
        },
        initialSegment: {
            baselineValue: defaultValues.baselineValue,
            startTime: defaultValues.startTime,
            endTime: defaultValues.endTime,
            segmentNote: defaultValues.segmentNote
        }
    });

    // States
    const [showModal, setShowModal] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [patternState, setPatternState] = useState(getInitialPatternState());

    // Reset the state to default values
    const resetState = () => {
        setPatternState(getInitialPatternState());
    };

    const submitBaseline = () => {
        // Close modal first to avoid repeat clicks
        setShowModal(false);
        addBaselineMutation({
            meterId: patternState.Baseline.meterId,
            isActive: patternState.Baseline.isActive,
            note: patternState.Baseline.note,
            baselineValue: patternState.initialSegment.baselineValue,
            segmentNote: patternState.initialSegment.segmentNote
        }).unwrap()
            .then(() => {
                showSuccessNotification(translate('day.create.success'));
            })
            .catch(error => {
                showErrorNotification(translate('day.create.failure') + error);
            });
        resetState();
    };
    /* End Utility Functions */

    // /* Handlers */
    const handleInitialSegmentNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPatternState(prev => ({
            ...prev,
            initialSegment: {
                ...prev.initialSegment,
                segmentNote: e.target.value
            }
        }));
    };

    const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPatternState(prev => ({
            ...prev,
            Baseline: {
                ...prev.Baseline,
                [name]: value
            }
        }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newValue = Number(value);
        setPatternState(prev => ({
            ...prev,
            initialSegment: {
                ...prev.initialSegment,
                [name]: newValue
            }
        }));
    };

    const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPatternState({ ...patternState, [e.target.name]: JSON.parse(e.target.value) });
    };

    const handleClose = () => {
        setShowModal(false);
        // resetState();
    };

    const handleShow = () => setShowModal(true);

    const handleWarningConfirm = () => {
        //Close the warning modal
        setShowWarningModal(false);
        // submitDay();
    };

    const handleWarningCancel = () => {
        //Close the warning modal
        setShowWarningModal(false);
    };

    // Submit
    const handleSubmit = () => {
        // Show warning modal if baseline value is 0
        if (patternState.initialSegment.baselineValue === 0) {
            setWarningMessage(translate('baseline.value.zero'));
            setShowWarningModal(true);
        } else {
            submitBaseline();
        }
    };
    /* End Handlers */

    const tooltipStyle = {
        ...tooltipBaseStyle,
        tooltipCreateBaselineView: 'help.admin.baselinecreate'
    };

    return (
        <>
            <Button color='secondary' onClick={handleShow}>
                <FormattedMessage id="baseline.create" />
            </Button>
            <ConfirmActionModalComponent
                show={showWarningModal}
                actionConfirmMessage={warningMessage}
                handleClose={handleWarningCancel}
                actionFunction={handleWarningConfirm}
                actionConfirmText={translate('confirm.action')}
                actionRejectText={translate('cancel')}
            />
            <Modal isOpen={showModal} toggle={handleClose} size='lg'>
                <ModalHeader>
                    <FormattedMessage id="baseline.create" />
                    <TooltipHelpComponent page='baseline-create' />
                    <div style={tooltipStyle}>
                        <TooltipMarkerComponent page='baseline-create' helpTextId={tooltipStyle.tooltipCreateBaselineView} />
                    </div>
                </ModalHeader>
                <ModalBody>
                    <Container>
                        {/* Active status input for overall baseline*/}
                        <FormGroup>
                            <Label for='isActive'>{translate('baseline.active')}</Label>
                            <Input id='isActive' name='isActive' type='select'
                                value={patternState.Baseline.isActive.toString()}
                                onChange={e => handleBooleanChange(e)}>
                                {Object.keys(TrueFalseType).map(key => {
                                    return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
                                })}
                            </Input>
                        </FormGroup>
                        {/* Note input for overall baseline*/}
                        <FormGroup>
                            <Label for='note'>{translate('note')}</Label>
                            <Input
                                id='BaselineNote'
                                name='note'
                                type='textarea'
                                onChange={e => handleStringChange(e)}
                                value={patternState.Baseline.note} />
                        </FormGroup>
                        {/*Initial baseline segment*/}
						<h5>
							<FormattedMessage id="baseline.initial.segment" />
						</h5>
						<Row xs='1' lg='2'>
							<Col>
								{/* Baseline value input*/}
								<FormGroup>
									<Label for='baselineValue'>{translate('baseline.value')}</Label>
									<Input
										id='baselineValue'
										name='baselineValue'
										type='number'
										value={patternState.initialSegment.baselineValue}
										onChange={e => handleNumberChange(e)} />
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								{/* Start time input*/}
								<FormGroup>
									<Label for='startTime'>{translate('baseline.start.time')}</Label>
									<Input
										id='startTime'
										name='startTime'
										type='number'
										value={patternState.initialSegment.startTime}
										disabled
										readOnly
									/>
								</FormGroup>
							</Col>
							<Col>
								{/* End time input*/}
								<FormGroup>
									<Label for='endTime'>{translate('baseline.end.time')}</Label>
									<Input
										id='endTime'
										name='endTime'
										type='number'
										value={patternState.initialSegment.endTime}
										disabled
										readOnly
									/>
								</FormGroup>
							</Col>
						</Row>
						{/* Note input for initial pattern*/}
						<FormGroup>
							<Label for='segmentNote'>{translate('baseline.segment.note')}</Label>
							<Input
								id='initialSegmentNote'
								name='initialSegmentNote'
								type='textarea'
								onChange={e => handleInitialSegmentNoteChange(e)}
								value={patternState.initialSegment.segmentNote} />
						</FormGroup>
                    </Container>
                </ModalBody>
            </Modal>

        </>
    );
}