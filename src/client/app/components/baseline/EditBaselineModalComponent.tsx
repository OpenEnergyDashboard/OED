import * as React from 'react';
// Realize that * is already imported from react
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Button,
	Container,
	FormGroup,
	Input,
	Label,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	Table,
	Pagination,
	PaginationItem,
	PaginationLink
}
from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { baselineApi, baselineSegmentsApi } from '../../redux/api/baselineApi';
// import { selectMeterDataById } from '../../redux/api/metersApi';
// import { useAppSelector } from '../../redux/reduxHooks';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { Baseline, BaselineSegment } from '../../types/redux/baselines';
import { useTranslate } from '../../redux/componentHooks';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
// import MetersDetailComponent from 'components/meters/MetersDetailComponent';
import SplitBaselineSegmentComponent from './SplitBaselineSegmentComponent';
import DeleteBaselineSegmentComponent from './DeleteBaselineSegmentModalComponent';
import EditBaselineSegmentModalComponent from './EditBaselineSegmentModalComponent';
import '../../styles/modal.css';

interface EditBaselineModalComponentProps {
    show: boolean;
    baseline: Baseline;
    baselineIdentifier: string;
    // passed in to handle opening the modalq2
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
    const PER_PAGE = 10;
    const translate = useTranslate();
    // const meterDataById = useAppSelector(selectMeterDataById);

    // Set existing baseline values
    const values = { ...props.baseline };

    /* State */
    // Handlers for each type of input change
    const [state, setState] = useState(values);

    const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, [e.target.name]: e.target.value });
    };

    const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
    };

    // const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setState({ ...state, [e.target.name]: Number(e.target.value) });
    // };
    /* End State */

    // Performs checks to warn the admin if the baseline is inactive
    const checkState = () => {
        if (!state.isActive) {
            alert(translate('baseline.inactiveWarning'));
        }
    };

	const { data: baselineSegments = [] } = baselineSegmentsApi.useGetBaselineSegmentsByMeterIdQuery(props.baseline.meterId);
	const [ editBaselineMutation, { isLoading: isSaving }] = baselineApi.useEditBaselineMutation();
    const handleSubmit = () => {
        props.handleClose();
        editBaselineMutation(state).unwrap()
            .then(() => {
                showSuccessNotification(translate('baseline.edit.success'));
            }).catch(error => {
                showErrorNotification(`${translate('baseline.edit.error')} ${error}`);
            });
    };
	
	// Pagination
	const [page, setPage] = React.useState(1);
	const totalPages = Math.ceil(baselineSegments.length / PER_PAGE);
	const paged = baselineSegments.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const isUnchanged = React.useMemo(() => {
		return props.baseline.isActive === state.isActive && props.baseline.note === state.note;
	}, [props.baseline, state]);

    // State to hold the modal for editing a baseline segment
	const [showEditSegmentModal, setShowEditSegmentModal] = React.useState(false);
	const [editSegment, setEditSegment] = React.useState<BaselineSegment | null>(null);

    // Function to open the edit segment modal
	const handleShowEditSegmentModal = (segment: BaselineSegment) => {
		setEditSegment(segment);
		setShowEditSegmentModal(true);
	};
	// Function to close the edit segment modal
	const handleCloseEditSegmentModal = () => {
		setShowEditSegmentModal(false);
		setEditSegment(null);
	};

	// State to hold the segment for showing segment notes in a modal
	const [noteSegment, setNoteSegment] = React.useState<BaselineSegment | null>(null);
	// The note modal is shown when a segment note is clicked
	const showNoteModal = Boolean(noteSegment);
	const handleShowNoteModal = (segment: BaselineSegment) => {
		setNoteSegment(segment);
	};
	const handleCloseNoteModal = () => {
		setNoteSegment(null);
	};

	// Delete baseline confirmation modal
	const [showDeleteModal, setShowDeleteModal] = React.useState(false);
	const [deleteBaselineMutation, { isLoading: isDeleting }] = baselineApi.useDeleteBaselineMutation();

	// Function to handle deleting the baseline
	const handleDeleteBaseline = () => {
		setShowDeleteModal(false);
		deleteBaselineMutation(state.meterId).unwrap()
			.then(() => {
				showSuccessNotification(translate('baseline.delete.success'));
				props.handleClose();
			})
			.catch(error => {
				showErrorNotification(`${translate('baseline.delete.error')} ${error}`);
			});
	};

    return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose} size="xl">
				<ModalHeader>
					<FormattedMessage id="baseline.edit" />
					<TooltipHelpComponent page="baseline-edit" />
					<div style={tooltipBaseStyle}>
						<TooltipMarkerComponent page="baseline-edit" helpTextId="help.admin.baselineedit" />
					</div>
				</ModalHeader>

				<ModalBody>
					<Container>
						{/* Name */}
						<FormGroup>
							<Label for="Active">{translate('active')}</Label>
							<Input id="active" name="active" type="select" required value={state.isActive.toString()} onChange={handleBooleanChange}>
								<option value="true">True</option>
								<option value="false">False</option>
							</Input>
						</FormGroup>
						{/* Note */}
						<FormGroup>
							<Label for="note">{translate('note')}</Label>
							<Input id="note" name="note" type="textarea" value={state.note} onChange={handleStringChange} />
						</FormGroup>

						<hr />
						{/* Table */}
						<h5 className="mt-3 mb-2"><FormattedMessage id="baseline.segments.table.title" /></h5>
						<Table striped bordered>
							<thead>
								<tr>
									<th><FormattedMessage id="baseline.segments.table.timeRange" /></th>
									<th><FormattedMessage id="baseline.value" /></th>
									<th><FormattedMessage id="note" /></th>
									<th><FormattedMessage id="edit" /></th>
									<th><FormattedMessage id="split.earlier" /></th>
									<th><FormattedMessage id="split.later" /></th>
									<th><FormattedMessage id="delete.earlier" /></th>
									<th><FormattedMessage id="delete.later" /></th>
								</tr>
							</thead>
							<tbody>
								{paged?.map(seg => (
									<tr key={seg.id}>
										<td>{seg.startHour} - {seg.endHour}</td>
										<td>{seg.baselineValue}</td>
										<td
											style={{ cursor: 'pointer' }}
											onClick={() => handleShowNoteModal(seg)}
											aria-label={seg.note}
										>
											{(seg.note ?? '').length > 30 ? `${seg.note?.slice(0, 30)} ...` : seg.note || ''}
										</td>
										<td>
											<Button color="secondary" size="sm" onClick={() => handleShowEditSegmentModal(seg)}>
												<FormattedMessage id="edit" />
											</Button>
										</td>
										<td>
											{/* only show split buttons if segment is longer than 1 hour */}
											{seg.endHour - seg.startHour > 1 && <SplitBaselineSegmentComponent baselineSegment={seg} direction="earlier" />}
										</td>
										<td>
											{seg.endHour - seg.startHour > 1 && <SplitBaselineSegmentComponent baselineSegment={seg} direction="later" />}
										</td>
										<td>
											{/* first segment cannot delete earlier */}
											{seg.startHour > 0 &&
												<DeleteBaselineSegmentComponent baselineSegment={seg} direction="earlier" />
											}
										</td>
										<td>
											{/* last segment cannot delete later */}
											{seg.endHour < 24 &&
												<DeleteBaselineSegmentComponent baselineSegment={seg} direction="later" />
											}
										</td>
									</tr>
								))}
							</tbody>
						</Table>

						{/* Pagination */}
						{baselineSegments && baselineSegments.length > PER_PAGE && (
							<Pagination style={{ justifyContent: 'center' }}>
								<PaginationItem disabled={page === 1}>
									<PaginationLink first onClick={() => setPage(1)} />
								</PaginationItem>
								<PaginationItem disabled={page === 1}>
									<PaginationLink previous onClick={() => setPage(p => p - 1)} />
								</PaginationItem>
								{Array.from({ length: totalPages }, (_, i) => (
									<PaginationItem key={i} active={page === i + 1}>
										<PaginationLink onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
									</PaginationItem>
								))}
								<PaginationItem disabled={page === totalPages}>
									<PaginationLink next onClick={() => setPage(p => p + 1)} />
								</PaginationItem>
								<PaginationItem disabled={page === totalPages}>
									<PaginationLink last onClick={() => setPage(totalPages)} />
								</PaginationItem>
							</Pagination>
						)}
					</Container>
				</ModalBody>

				<ModalFooter>
					{/* Delete baseline */}
					<Button color="danger" onClick={() => setShowDeleteModal(true)} disabled={isSaving || isDeleting}>
						{translate('baseline.delete.button')}
					</Button>
					<Button color="secondary" onClick={props.handleClose}>
						<FormattedMessage id="baseline.edit.discard" />
					</Button>
					<Button color="primary" onClick={() => { handleSubmit(); checkState(); }} disabled={isUnchanged || isSaving || isDeleting}>
						<FormattedMessage id="baseline.edit.save" />
					</Button>
				</ModalFooter>

				{/* Delete confirmation modal */}
				<ConfirmActionModalComponent
					show={showDeleteModal}
					actionConfirmMessage={translate('baseline.delete.confirm')}
					actionFunction={handleDeleteBaseline}
					handleClose={() => setShowDeleteModal(false)}
					actionConfirmText={translate('baseline.delete.button')}
					actionRejectText={translate('cancel')}
				/>

				{/* Segment note modal */}
				<Modal isOpen={showNoteModal} toggle={handleCloseNoteModal} centered>
					<ModalHeader>
						{noteSegment?.startHour} - {noteSegment?.endHour}
					</ModalHeader>
					<ModalBody>
						{noteSegment?.note}
					</ModalBody>
				</Modal>
			</Modal >

			{/* Edit Baseline Segment modal */}
			{editSegment && <EditBaselineSegmentModalComponent show={showEditSegmentModal} baselineSegment={editSegment} handleClose={handleCloseEditSegmentModal} />}
		</>
	);
}