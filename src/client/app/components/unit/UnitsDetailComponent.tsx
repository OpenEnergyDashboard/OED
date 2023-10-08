/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';
import { UnitData } from 'types/redux/units';
import HeaderComponent from '../../components/HeaderComponent';
import SpinnerComponent from '../../components/SpinnerComponent';
import FooterContainer from '../../containers/FooterContainer';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { useAppSelector } from '../../redux/hooks';
import { State } from '../../types/redux/state';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateUnitModalComponent from './CreateUnitModalComponent';
import UnitViewComponent from './UnitViewComponent';
import { unitsSlice } from '../../reducers/units';

/**
 * Defines the units page card view
 * @returns Units page element
 */
export default function UnitsDetailComponent() {
	// The route stops you from getting to this page if not an admin.
	const isUpdatingCikAndDBViews = useSelector((state: State) => state.admin.isUpdatingCikAndDBViews);

	//Units state
	const unitDataById = useAppSelector(state => unitsSlice.selectors.unitDataById(state));


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
			{isUpdatingCikAndDBViews ? (
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
							{Object.values(unitDataById)
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
