/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import MapViewContainer from '../../containers/maps/MapViewContainer';
import { hasToken } from '../../utils/token';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import '../../styles/card-page.css';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectMaps } from '../../redux/selectors/maps';
	const maps: number[] = useAppSelector(selectMaps);

interface MapsDetailProps {
	maps: number[];
	unsavedChanges: boolean;
	fetchMapsDetails(): Promise<any>;
	submitEditedMaps(): Promise<any>;
	createNewMap(): any;
}

export default class MapsDetailComponent extends React.Component<MapsDetailProps> {
	constructor(props: MapsDetailProps) {
		super(props);
		this.handleSubmitClicked = this.handleSubmitClicked.bind(this);
	}

	public componentDidMount() {
		this.props.fetchMapsDetails();
	}

	public render() {
		return (
			<div className='flexGrowOne'>
				<TooltipHelpComponent page='maps' />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='maps' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='maps' helpTextId='help.admin.mapview' />
						</div>
					</h2>
					<div className="edit-btn">
						<Link to='/calibration' onClick={() => this.props.createNewMap()}>
							<Button color='primary'>
								<FormattedMessage id='create.map' />
							</Button>
						</Link>
					</div>
					<div className="card-container">
						{this.props.maps.map(mapID => (
							<MapViewContainer key={mapID} id={mapID} />
						))}
					</div>
					{hasToken() && (
						<div className="edit-btn">
							<Button
								color='success'
								disabled={!this.props.unsavedChanges}
								onClick={this.handleSubmitClicked}
							>
								<FormattedMessage id='save.map.edits' />
							</Button>
						</div>
					)}
				</div>
			</div>
		);
	}

	private handleSubmitClicked() {
		this.props.submitEditedMaps();
		// Notify that the unsaved changes have been submitted
		// this.removeUnsavedChanges();
	}
}

const titleStyle: React.CSSProperties = {
	textAlign: 'center'
};

const tooltipStyle = {
	display: 'inline-block',
	fontSize: '50%'
};