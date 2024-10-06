/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import { selectMapIds } from '../../redux/api/mapsApi';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import '../../styles/card-page.css';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import MapViewComponent from './MapViewComponent';
import { localEditsSlice } from '../../redux/slices/localEditsSlice';

/**
 * Defines the maps page card view
 * @returns Maps page element
 */
// TODO: Migrate to RTK
export default function MapsDetailComponent() {
	const dispatch = useAppDispatch();
	// Load map IDs from state and store in number array
	const mapIds = useAppSelector(state => selectMapIds(state));
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
				{ /* TODO: Change Link to <CreateMapModalComponent /> when it is completed */}
				<div className="edit-btn">
					<Link to='/calibration' onClick={() => dispatch(localEditsSlice.actions.createNewMap())}>
						<Button color='primary'>
							<FormattedMessage id='create.map' />
						</Button>
					</Link>
				</div>
				<div className="card-container">
					{mapIds.map(mapID => (
						<MapViewComponent key={mapID} mapID={mapID} />
					))}
				</div>
			</div>
		</div>
	);
}
