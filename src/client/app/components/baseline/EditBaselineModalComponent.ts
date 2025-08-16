import * as React from 'react';
// Realize that * is already imported from react
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormGroup, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { baselineApi, selectBaselinesDetails } from '../../redux/api/baselineApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
// import { selectUnitDataById } from '../../redux/api/unitsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { Baseline } from '../../types/redux/baselines';
import { useTranslate } from '../../redux/componentHooks';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

interface EditBaselineModalComponentProps {
    show: boolean;
    baseline: Baseline;
    baselineIdentifier: string;
    // passed in to handle opening the modal
    handleShow: () => void;
    // passed in to handle closing the modal
    handleClose: () => void;
}

/**
 * Defines the edit baselin modal form
 * @param props Props for the component
 * @returns Baseline edit element
 */
export default function EditBaselineModalComponent(props: EditBaselineModalComponentProps) {
    const translate = useTranslate();
    const [editBaseline] = baselineApi.useEditBaselineMutation();
    const [deleteBaseline] = baselineApi.useDeleteBaselineMutation();
    const meterDataById = useAppSelector(selectMeterDataById);

    // Set existing baseline values
    const values = { ...props.baseline };

    /* State */
    // Handlers for each type of input change
    const [state, setState] = useState(values);

    const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, [e.target.name]: e.target.value });
    };

    const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState({...state, [e.target.name]: JSON.parse(e.target.value) });
    };
}