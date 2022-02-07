/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Table, Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import { hasToken } from '../../utils/token';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import MapViewContainer from '../../containers/maps/MapViewContainer';
import {Link} from 'react-router-dom';
import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import store from '../../index';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';

interface MapsDetailProps {
	maps: number[];
	unsavedChanges: boolean;
	fetchMapsDetails(): Promise<any>;
	submitEditedMaps(): Promise<any>;
	createNewMap(): any;
}

export default class MapsDetailComponent extends React.Component<MapsDetailProps, {}> {
	constructor(props: MapsDetailProps) {
		super(props);
		this.handleSubmitClicked = this.handleSubmitClicked.bind(this);
	}

	public componentDidMount() {
		this.props.fetchMapsDetails();
	}

	public render() {

		const titleStyle: React.CSSProperties = {
			textAlign: 'center'
		};

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

		const tooltipStyle = {
			display: 'inline-block',
			fontSize: '50%'
		};

		return (
			<div>
				<UnsavedWarningContainer />
				<HeaderContainer />
				<TooltipHelpContainerAlternative page='maps' />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='maps' />
						<div style={tooltipStyle}>
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
						{hasToken() && <th> <FormattedMessage id='map.circle.size'/> </th>}
						{hasToken() && <th> <FormattedMessage id='map.modified.date' /> </th>}
						{hasToken() && <th> <FormattedMessage id='map.filename'/> </th>}
						{hasToken() && <th> <FormattedMessage id='note'/> </th>}
						{hasToken() && <th> <FormattedMessage id='map.calibration'/> </th>}
						{hasToken() && <th> <FormattedMessage id='remove'/> </th>}
						</tr>
					</thead>
					<tbody>
					{ this.props.maps.map(mapID =>
						( <MapViewContainer key={mapID} id={mapID} /> ))}
					<tr>
						<td colSpan={8}>
							<Link to='/calibration' onClick={() => this.props.createNewMap()}>
								<Button style={buttonContainerStyle} color='primary'>
									<FormattedMessage id='create.map' />
								</Button>
							</Link>
						</td>
					</tr>
					</tbody>
					</Table>
					</div>
					{ hasToken() && <Button
						color='success'
						style={buttonContainerStyle}
						disabled={!this.props.unsavedChanges}
						onClick={this.handleSubmitClicked}
					>
						<FormattedMessage id='save.map.edits' />
					</Button> }
				</div>
				<FooterContainer />
			</div>
		);
	}

	private removeUnsavedChanges() {
		store.dispatch(removeUnsavedChanges());
	}

	private handleSubmitClicked() {
		this.props.submitEditedMaps();
		// Notify that the unsaved changes have been submitted
		this.removeUnsavedChanges();
	}
}
