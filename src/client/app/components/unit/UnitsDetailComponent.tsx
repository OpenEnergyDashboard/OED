/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { FormattedMessage } from 'react-intl';
import FooterContainer from '../../containers/FooterContainer';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { State } from '../../types/redux/state';
import { fetchUnitsDetailsIfNeeded } from '../../actions/units';
import UnitViewComponent from './UnitViewComponent';
import CreateUnitModalComponent from './CreateUnitModalComponent';
import { UnitData } from 'types/redux/units';
import SpinnerComponent from '../../components/SpinnerComponent';
import HeaderComponent from '../../components/HeaderComponent';

export default function UnitsDetailComponent() {
	// The route stops you from getting to this page if not an admin.

	const dispatch = useDispatch();

	useEffect(() => {
		// Makes async call to units API for units details if one has not already been made somewhere else, stores unit ids in state
		dispatch(fetchUnitsDetailsIfNeeded());
	}, []);

	const isUpdatingCikAndDBViews = useSelector((state: State) => state.admin.isUpdatingCikAndDBViews);

	//Units state
	const unitsState = useSelector((state: State) => state.units.units);

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// For now, only an admin can see the unit page.
		tooltipUnitView: 'help.admin.unitview'
	};

	return (
		<div>
			{ isUpdatingCikAndDBViews ? (
				<div className='text-center'>
					<SpinnerComponent loading width={50} height={50} />
					<FormattedMessage id='redo.cik.and.refresh.db.views'></FormattedMessage>
				</div>
			) : (
				<div>
					<HeaderComponent />
					<TooltipHelpContainer page='units' />

					<div className='container-fluid'>
						<h2 style={titleStyle}>
							<FormattedMessage id='units' />
							<div style={tooltipStyle}>
								<TooltipMarkerComponent page='units' helpTextId={tooltipStyle.tooltipUnitView} />
							</div>
						</h2>
						<div className="edit-btn">
							{/* The actual button for create is inside this component. */}
							< CreateUnitModalComponent />
						</div>
						<div className="card-container">
							{/* Create a UnitViewComponent for each UnitData in Units State after sorting by identifier */}
							{Object.values(unitsState)
								.sort((unitA: UnitData, unitB: UnitData) => (unitA.identifier.toLowerCase() > unitB.identifier.toLowerCase()) ? 1 :
									((unitB.identifier.toLowerCase() > unitA.identifier.toLowerCase()) ? -1 : 0))
								.map(unitData => (<UnitViewComponent unit={unitData as UnitData} key={(unitData as UnitData).id} />))}
						</div>
					</div>
					<FooterContainer />
				</div>
			)}
		</div>
	);
}
