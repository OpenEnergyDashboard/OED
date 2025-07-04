/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button, Table } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import MapViewContainer from '../../containers/maps/MapViewContainer';
import { hasToken } from '../../utils/token';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { titleStyle, tooltipBaseStyle } from '../../styles/modalStyle';

import { SimpleUnsavedWarningComponent } from '../SimpleUnsavedWarningComponent';
import { useState } from 'react';
import { useBlocker } from 'react-router-dom';
//import { useNavigate } from 'react-router-dom';
interface MapsDetailProps {
	maps: number[];
	unsavedChanges: boolean;
	fetchMapsDetails(): Promise<any>;
	submitEditedMaps(): Promise<any>;
	createNewMap(): any;
}

/**
 * Defines the Maps page
 * @param props for the maps component
 * @returns Maps page element
 */
export default function MapsDetailComponent(props: MapsDetailProps) {
	// constructor(props: MapsDetailProps) {
	// 	super(props);
	// 	this.handleSubmitClicked = this.handleSubmitClicked.bind(this);
	// }


	// public componentDidMount() {
	// 	this.props.fetchMapsDetails();
	// }

	React.useEffect(() => {
		props.fetchMapsDetails();
	}, []);

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

	const tableStyle: React.CSSProperties = {
		marginLeft: '5%',
		marginRight: '5%'
	};

	const buttonContainerStyle: React.CSSProperties = {
		minWidth: '150px',
		width: '10%',
		marginLeft: '40%',
		marginRight: '40%'
	};

	const handleSubmitClicked = () => {
		props.submitEditedMaps();
		// Notify that the unsaved changes have been submitted
		//this.removeUnsavedChanges();
	};

	const handleClear = () => {
		setShowUnsavedWarning(false);
		setHasUnsavedChanges(false);
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
						handleSubmitClicked;
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
			<div className='flexGrowOne'>
				{/* <UnsavedWarningContainer /> */}
				<TooltipHelpComponent page='maps' />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='maps' />
						<div style={tooltipBaseStyle}>
							<TooltipMarkerComponent page='maps' helpTextId='help.admin.mapview' />
						</div>
					</h2>
					<div style={tableStyle}>
						<Table striped bordered hover>
							<thead>
								<tr>
									<th> <FormattedMessage id='map.id' /> </th>
									<th> <FormattedMessage id='map.name' /> </th>
									{hasToken() && <th> <FormattedMessage id='map.displayable' /> </th>}
									{hasToken() && <th> <FormattedMessage id='map.circle.size' /> </th>}
									{hasToken() && <th> <FormattedMessage id='map.modified.date' /> </th>}
									{hasToken() && <th> <FormattedMessage id='map.filename' /> </th>}
									{hasToken() && <th> <FormattedMessage id='note' /> </th>}
									{hasToken() && <th> <FormattedMessage id='map.calibration' /> </th>}
									{hasToken() && <th> <FormattedMessage id='remove' /> </th>}
								</tr>
							</thead>
							<tbody>
								{props.maps.map(mapID =>
									(<MapViewContainer
										key={mapID}
										id={mapID}
										onMapChange={() => setHasUnsavedChanges(true)} />))
								}
								<tr>
									<td colSpan={8}>
										<Link to='/calibration' onClick={() => {
											props.createNewMap();
											setHasUnsavedChanges(true); // Mark as unsaved
										}}>
											<Button style={buttonContainerStyle} color='primary'>
												<FormattedMessage id='create.map' />
											</Button>
										</Link>
									</td>
								</tr>
							</tbody>
						</Table>
					</div>
					{hasToken() && <Button
						color='success'
						style={buttonContainerStyle}
						// disabled={!this.props.unsavedChanges}
						onClick={handleSubmitClicked}
					>
						<FormattedMessage id='save.map.edits' />
					</Button>}
				</div>
			</div>
		</>
	);
	// public render() {
	// 	const tableStyle: React.CSSProperties = {
	// 		marginLeft: '5%',
	// 		marginRight: '5%'
	// 	};

	// 	const buttonContainerStyle: React.CSSProperties = {
	// 		minWidth: '150px',
	// 		width: '10%',
	// 		marginLeft: '40%',
	// 		marginRight: '40%'
	// 	};
	// }

	// private removeUnsavedChanges() {
	// 	// store.dispatch(unsavedWarningSlice.actions.removeUnsavedChanges());
	// }

	// private handleSubmitClicked() {
	// 	this.props.submitEditedMaps();
	// 	// Notify that the unsaved changes have been submitted
	// 	//this.removeUnsavedChanges();
	// }
}
