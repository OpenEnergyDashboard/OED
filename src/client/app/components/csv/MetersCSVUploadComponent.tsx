/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Col, Container, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { MetersCSVUploadPreferences } from '../../types/csvUploadForm';
import { submitMeters } from '../../utils/api/UploadCSVApi';
import { MetersCSVUploadDefaults } from '../../utils/csvUploadDefaults';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { useTranslate } from '../../redux/componentHooks';
import FormFileUploaderComponent from '../FormFileUploaderComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { authApi, authPollInterval } from '../../redux/api/authApi';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import { selectVisibleMeterAndGroupData } from '../../redux/selectors/adminSelectors';
import SpinnerComponent from '../SpinnerComponent';
import { tooltipBaseStyle } from '../../styles/modalStyle';

import { SimpleUnsavedWarningComponent } from '../SimpleUnsavedWarningComponent';
import { useState } from 'react';
import { useBlocker } from 'react-router-dom';
//import { useNavigate } from 'react-router-dom';

/**
 * Defines the CSV Meters page
 * @returns CSV Meters page element
 */
export default function MetersCSVUploadComponent() {
	const translate = useTranslate();
	const [meterData, setMeterData] = React.useState<MetersCSVUploadPreferences>(MetersCSVUploadDefaults);
	const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
	const [isValidFileType, setIsValidFileType] = React.useState<boolean>(false);
	// tracks if should show spinner (true while loading data, false otherwise)
	const [showSpinner, setShowSpinner] = React.useState<boolean>(false);
	const dispatch = useAppDispatch();
	// Check for admin status
	const isAdmin = useAppSelector(selectIsAdmin);
	// page may contain admin info so verify admin status while admin is authenticated.
	authApi.useTokenPollQuery(undefined, { skip: !isAdmin, pollingInterval: authPollInterval });
	// We only want displayable meters if non-admins because they still have
	// non-displayable in state.
	const { visibleMeters } = useAppSelector(selectVisibleMeterAndGroupData);
	// tracks whether or not a meter has been selected
	const meterIsSelected = meterData.meterIdentifier !== '';

	const handleSelectedMeterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setMeterData(prevData => ({
			...prevData,
			[name]: value
		}));
	};

	const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setMeterData(prevData => ({
			...prevData,
			[name]: checked
		}));
	};

	const handleFileChange = (file: File) => {
		setSelectedFile(file);
		if (file.name.slice(-4) === '.csv' || file.name.slice(-3) === '.gz') {
			setIsValidFileType(true);
		} else {
			setIsValidFileType(false);
			setSelectedFile(null);
			showErrorNotification(translate('csv.file.error') + file.name);
		}
	};

	const handleClear = () => {
		setMeterData(MetersCSVUploadDefaults);
		setIsValidFileType(false);
	};

	const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (selectedFile) {
			// show spinner before calling api, then stop it immediately after
			setShowSpinner(true);
			const { success, message } = await submitMeters(meterData, selectedFile, dispatch);
			setShowSpinner(false);
			if (success) {
				showSuccessNotification(message);
			} else {
				showErrorNotification(message);
			}
		}
	};

	const spinContainerStyle = {
		display: 'flex',
		justifyContent: 'center'
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipReadings: 'help.csv.meters'
	};

	const checkBox = {
		display: 'flex'
	};

	// boolean that updates if any change is made to any meter modal
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

	const blocker = useBlocker(hasUnsavedChanges);

	// Stores the path that the user tries to go before being blocked
	// by the Unsaved Warning. Once the user tries to 'leave,' the
	// user will be redirected to the stored path.
	// NOTE: Not working, have not figured out why it is unable to navigate
	// to the stored path. Instead, the user has to reattempt to leave the
	// page again.
	//const navigate = useNavigate();
	//const [attemptedPath, setAttemptedPath] = useState<string | null>(null);

	// displays the unsaved warning component whenever there's unsaved
	// changes, otherwise closes out of the modal
	const handleToggle = () => {
		if (hasUnsavedChanges && blocker.state === 'blocked') {
			setShowUnsavedWarning(true);
		}
		else {
			handleClear(); // Proceed to close the modal
			/*
			if (attemptedPath) {
				navigate(attemptedPath);
			}
			*/
		}
	};

	// logic borrowed from UnsavedWarningComponent.tsx
	// since there is no Modal used here, instead uses useEffect()
	// to prevent the user from navigating to a different page if
	// there are unsaved changes
	React.useEffect(() => {
		if (blocker.state === 'blocked') {
			handleToggle();
		}
	}, [blocker.state, hasUnsavedChanges]);

	return (
		<>
			{/* Unsaved Warning Component */}
			{showUnsavedWarning && (
				<SimpleUnsavedWarningComponent
					isOpen={showUnsavedWarning}
					onDiscard={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						//blocker.reset?.();
						// Note: This does not work cleanly, instead of immediately
						// leaving after pressing "Leave", it instead clears the boolean
						// values that display the warning, and the user just has to
						// leave the page again.
						handleClear();
						//blocker.state = 'unblocked';
					}}
					onConfirm={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						handleSubmit;
						handleClear();
						//setMeterData(MetersCSVUploadDefaults);
						//setSelectedFile(null);
						//setIsValidFileType(false);
						//blocker.state = 'unblocked';

					}}
					onCancel={() => {
						setShowUnsavedWarning(false);
						//blocker.state = 'unblocked';
					}}
				/>
			)}
			<Container className="min-vh-100">
				{showSpinner ? (
					<div style={spinContainerStyle}>
						<SpinnerComponent loading width={50} height={50} />
					</div>
				) : (<>
					<TooltipHelpComponent page='help.csv.meters' />
					<Form onSubmit={handleSubmit}>
						<Row className="justify-content-md-center">
							<Col md='auto'>
								<div className="text-center">
									<h2>
										{translate('csv.upload.meters')}
										<div style={tooltipStyle}>
											<TooltipMarkerComponent page='help.csv.meters' helpTextId={tooltipStyle.tooltipReadings} />
										</div>
									</h2>
								</div>
								<FormFileUploaderComponent
									onFileChange={handleFileChange}
									isInvalid={!!selectedFile}
								/>
								<FormGroup>
									<Row>
										<Col>
											<Label for='gzip'>
												<div style={checkBox}>
													<Input
														type='checkbox'
														id='gzip'
														name='gzip'
														onChange={e => {
															handleCheckboxChange(e);
															setHasUnsavedChanges(true); // Mark as unsaved
															handleToggle();
														}}
													/>
													<div className='ps-2'>
														{translate('csv.common.param.gzip')}
													</div>
												</div>
											</Label>
										</Col>
									</Row>
									<Row>
										<Col>
											<Label for='headerRow'>
												<div style={checkBox}>
													<Input
														type='checkbox'
														id='headerRow'
														name='headerRow'
														onChange={e => {
															handleCheckboxChange(e);
															setHasUnsavedChanges(true); // Mark as unsaved
															handleToggle();
														}}
													/>
													<div className='ps-2'>
														{translate('csv.common.param.header.row')}
													</div>
												</div>
											</Label>
										</Col>
									</Row>
									<Row>
										<Col>
											<Label for='update'>
												<div style={checkBox}>
													<Input
														type='checkbox'
														id='update'
														name='update'
														onChange={e => {
															handleCheckboxChange(e);
															setHasUnsavedChanges(true); // Mark as unsaved
															handleToggle();
														}}
													/>
													<div className='ps-2'>
														{translate('csv.common.param.update')}
													</div>
												</div>
											</Label>
										</Col>
									</Row>
								</FormGroup>
								{meterData.update && (
									<FormGroup>
										<Label for='meterIdentifier'>
											<div className='pb-1'>
												{translate('csv.readings.param.meter.identifier')}
											</div>
										</Label>
										<Input
											id='meterIdentifier'
											name='meterIdentifier'
											type='select'
											value={meterData.meterIdentifier || ''}
											onChange={e => {
												handleSelectedMeterChange(e);
												setHasUnsavedChanges(true); // Mark as unsaved
												//handleToggle();
											}}
											invalid={!meterIsSelected}
										>
											{
												<option value={''} key={-999} hidden disabled>
													{translate('select.meter')}
												</option>
											}
											{
												Array.from(visibleMeters).map(meter => {
													return (<option value={meter.identifier} key={meter.id}>{meter.identifier}</option>);
												})
											}
										</Input>
									</FormGroup>
								)}
								<div className='d-flex flex-row-reverse'>
									<div className='p-3'>
										<Button color='primary' type='submit' disabled={!isValidFileType || (meterData.update && !meterData.meterIdentifier)}>
											{translate('csv.submit.button')}
										</Button>
									</div>
									<div className='p-3'>
										<Button color='secondary' type='reset' onClick={handleClear}>
											{translate('csv.clear.button')}
										</Button>
									</div>
								</div>
							</Col>
						</Row>
					</Form>
				</>)}
			</Container>
		</>
	);
}