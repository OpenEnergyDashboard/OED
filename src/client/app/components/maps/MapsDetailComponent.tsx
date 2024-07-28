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
import { fetchMapsDetails, setNewMap, submitEditedMaps } from '../../redux/actions/map';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectMaps } from '../../redux/selectors/maps';
import { AppDispatch } from 'store';

export default function MapsDetailComponent() {
	const dispatch: AppDispatch = useAppDispatch();
	// Load map IDs from state and store in number array
	const maps: number[] = useAppSelector(selectMaps);
	React.useEffect(() => {
		// Load maps from state on component mount (componentDidMount)
		dispatch(fetchMapsDetails());
	}, []);

	return (
		<div className='flexGrowOne'>
			<TooltipHelpComponent page='maps' />
			<div className='container-fluid'>
				<h2 className='text-center'>
					<FormattedMessage id='maps' />
					<div className='d-inline-block fs-5'>
						<TooltipMarkerComponent page='maps' helpTextId='help.admin.mapview' />
					</div>
				</h2>
				<div className="edit-btn">
					<Link to='/calibration' onClick={() => dispatch(setNewMap())}>
						<Button color='primary'>
							<FormattedMessage id='create.map' />
						</Button>
					</Link>
				</div>
				<div className="card-container">
					{maps.map(mapID => (
						<MapViewContainer key={mapID} id={mapID} />
					))}
				</div>
				{hasToken() && (
					<div className="edit-btn">
						<Button
							color='success'
							onClick={() => dispatch(submitEditedMaps())}
						>
							<FormattedMessage id='save.map.edits' />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}