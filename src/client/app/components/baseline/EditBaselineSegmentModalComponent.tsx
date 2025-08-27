/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { baselineSegmentsApi } from '../../redux/api/baselineApi';
import { BaselineSegment, UpdateBaselineSegmentPayload } from '../../types/redux/baselines';
import { showErrorNotification } from '../../utils/notifications';

interface EditBaselineSegmentModalComponentProps {
    show: boolean;
    baselineSegment: BaselineSegment;
    /**
     * Function to run when edit modal closes
     */
    handleClose: () => void;
}
/**
 * /**
 * Defines a modal that allows editing of an existing Baseline Segment.
 * @param props - The properties for the component
 * @returns Baseline segment edit element
 */
export default function EditBaselineSegmentModalComponent(props: EditBaselineSegmentModalComponentProps): React.ReactElement {

    const [baselineSegment, setBaselineSegment] = React.useState<UpdateBaselineSegmentPayload>(
        { ...props.baselineSegment, originalStartHour: props.baselineSegment.startHour, originalEndHour: props.baselineSegment.endHour }
    );

    // Fetch baseline segments by meter ID to validate start and end hours
    const { data: baselineSegments = [] } = baselineSegmentsApi.useGetBaselineSegmentsByMeterIdQuery(props.baselineSegment.meterId);
    const [editBaselineSegmentMutation, { isLoading: isSaving }] = baselineSegmentsApi.useEditBaselineSegmentMutation();
    const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBaselineSegment({ ...baselineSegment, [e.target.name]: e.target.value });
    };
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBaselineSegment({ ...baselineSegment, [e.target.name]: Number(e.target.value) });
    };
    const handleSubmit = () => {
        props.handleClose();
        editBaselineSegmentMutation(baselineSegment).unwrap()
            .then(() => {
            })
            .catch(error => {
                showErrorNotification(error);
            });
    };
    // The segment immediately before the current segment, if it exists
    const earlierSegment = React.useMemo(() => {
        const segmentIndex = baselineSegments.findIndex(s => s.meterId === props.baselineSegment.meterId);
        if (segmentIndex > 0) {
            return baselineSegments[segmentIndex - 1];
        }
        return null;
    }, [baselineSegments, props.baselineSegment.meterId]);
    // The segment immediately after the current segment, if it exists
    const laterSegment = React.useMemo(() => {
        const segmentIndex = baselineSegments.findIndex(s => s.meterId === props.baselineSegment.meterId);
        if (segmentIndex < baselineSegments.length - 1) {
            return baselineSegments[segmentIndex + 1];
        }
        return null;
    }, [baselineSegments, props.baselineSegment.meterId]);
    // Validate start hour
    const isStartHourValid = React.useMemo(() => {
        if (!Number.isInteger(baselineSegment.startHour) || baselineSegment.startHour < 0 || baselineSegment.startHour >= baselineSegment.endHour) {
            return false;
        }
        // Check if the start hour does not conflict with existing segments
        if (earlierSegment && baselineSegment.startHour <= earlierSegment.startHour) {
            return false;
        }

        return true;
    }, [baselineSegment.startHour, baselineSegment.endHour, earlierSegment]);
    // Validate end hour
    const isEndHourValid = React.useMemo(() => {
        if (!Number.isInteger(baselineSegment.endHour) || baselineSegment.endHour <= baselineSegment.startHour || baselineSegment.endHour > 24) {
            return false;
        }
        // Check if the end hour does not conflict with existing segments
        if (laterSegment && baselineSegment.endHour >= laterSegment.endHour) {
            return false;
        }

        return true;
    }, [baselineSegment.startHour, baselineSegment.endHour, laterSegment]);

    // Validate the segment as a whole
    // It should have valid start and end hours
    const isSegmentValid = React.useMemo(() => {
        return isStartHourValid && isEndHourValid;
    }, [baselineSegment.startHour, baselineSegment.endHour]);

    const isSegmentUnchanged = React.useMemo(() => {
        return props.baselineSegment.baselineValue === baselineSegment.baselineValue &&
            props.baselineSegment.startHour === baselineSegment.startHour &&
            props.baselineSegment.endHour === baselineSegment.endHour &&
            props.baselineSegment.note === baselineSegment.note;
    }, [props.baselineSegment, baselineSegment]);

    return (
        <>
            <Modal isOpen={props.show} toggle={props.handleClose}>
                <ModalHeader>
                    <FormattedMessage id="edit.segment.title" />
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="segment-baseline-value">
                            <FormattedMessage id="baseline.value" />
                        </Label>
                        <Input
                            id="segment-baseline-value"
                            name="baselineValue"
                            type="number"
                            required
                            value={baselineSegment.baselineValue}
                            onChange={handleNumberChange}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Row>
                            <Col>
                                <Label for="segment-start-hour">
                                    <FormattedMessage id="baseline.start.hour" />
                                </Label>
                                <Input
                                    id="segment-start-hour"
                                    name="startHour"
                                    type="number"
                                    min={earlierSegment ? earlierSegment.startHour + 1 : 0}
                                    max={baselineSegment.endHour - 1}
                                    step="1"
                                    value={baselineSegment.startHour}
                                    onChange={handleNumberChange}
                                    invalid={!isStartHourValid}
                                    disabled={baselineSegment.originalStartHour === 0}
                                />
                                <FormFeedback>
                                    <FormattedMessage id="baseline.segments.edit.start.hour.invalid" values={
                                        { min: earlierSegment?.startHour ?? 0 }
                                    } />
                                </FormFeedback>
                            </Col>
                            <Col>
                                <Label for="segment-end-hour">
                                    <FormattedMessage id="baseline.end.hour" />
                                </Label>
                                <Input
                                    id="segment-end-hour"
                                    name="endHour"
                                    type="number"
                                    min={baselineSegment.startHour + 1}
                                    max={laterSegment ? laterSegment.endHour - 1 : 24}
                                    step="1"
                                    value={baselineSegment.endHour}
                                    onChange={handleNumberChange}
                                    invalid={!isEndHourValid}
                                    disabled={baselineSegment.originalEndHour === 24}
                                />
                                <FormFeedback>
                                    <FormattedMessage id="baseline.segments.edit.end.hour.invalid" values={
                                        { max: laterSegment?.endHour ?? 24 }
                                    } />
                                </FormFeedback>
                            </Col>
                        </Row>
                    </FormGroup>
                    <FormGroup>
                        <Label for="segment-note">
                            <FormattedMessage id="note" />
                        </Label>
                        <Input
                            id="segment-note"
                            name="note"
                            type="textarea"
                            value={baselineSegment.note ?? ''}
                            onChange={handleStringChange}
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    {/* Discard changes */}
                    <Button color="secondary" onClick={props.handleClose}>
                        <FormattedMessage id="discard.changes" />
                    </Button>
                    {/* Save changes */}
                    <Button
                        color="primary"
                        onClick={handleSubmit}
                        disabled={isSegmentUnchanged || !isSegmentValid || isSaving}
                    >
                        <FormattedMessage id="baseline.segments.edit.save" />
                    </Button>
                </ModalFooter>
            </Modal>
        </>)
};