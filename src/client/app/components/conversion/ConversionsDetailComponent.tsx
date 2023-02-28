/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { FormattedMessage } from 'react-intl';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { State } from '../../types/redux/state';
import { fetchConversionsDetailsIfNeeded } from '../../actions/conversions';
import ConversionViewComponent from './ConversionViewComponent';
import CreateConversionModalComponent from './CreateConversionModalComponent';
import { ConversionData } from 'types/redux/conversions';
import SpinnerComponent from '../../components/SpinnerComponent';

/**
 * Component which displays conversions page
 * @returns {Element} Conversion page element
 */
export default function ConversionsDetailComponent() {
	// The route stops you from getting to this page if not an admin.

	const dispatch = useDispatch();

	useEffect(() => {
		// Makes async call to conversions API for conversions details if one has not already been made somewhere else, stores conversion by ids in state
		dispatch(fetchConversionsDetailsIfNeeded());
	}, []);

	// Conversions state
	const conversionsState = useSelector((state: State) => state.conversions.conversions);

	const isUpdatingCikAndDBViews = useSelector((state: State) => state.admin.isUpdatingCikAndDBViews);

	// Units state
	const unitsState = useSelector((state: State) => state.units.units);
	const unitsFetchedOnce = useSelector((state: State) => state.units.hasBeenFetchedOnce);
	// Check if the units state is fully loaded
	const unitsStateLoaded = unitsFetchedOnce && Object.keys(unitsState).length > 0;

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// For now, only an admin can see the conversion page.
		tooltipConversionView: 'help.admin.conversionview'
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
					<HeaderContainer />
					<TooltipHelpContainer page='conversions' />

					<div className='container-fluid'>
						<h2 style={titleStyle}>
							<FormattedMessage id='conversions' />
							<div style={tooltipStyle}>
								<TooltipMarkerComponent page='conversions' helpTextId={tooltipStyle.tooltipConversionView} />
							</div>
						</h2>
						{unitsStateLoaded &&
							<div className="edit-btn">
								<CreateConversionModalComponent
									conversionsState={conversionsState}
									unitsState={unitsState} />
							</div>}
						<div className="card-container">
							{/* Attempt to create a ConversionViewComponent for each ConversionData in Conversions State after sorting by
					the combination of the identifier of the source and destination of the conversion. */}
							{unitsStateLoaded && Object.values(conversionsState)
								.sort((conversionA: ConversionData, conversionB: ConversionData) =>
									((unitsState[conversionA.sourceId].identifier + unitsState[conversionA.destinationId].identifier).toLowerCase() >
										(unitsState[conversionB.sourceId].identifier + unitsState[conversionB.destinationId].identifier).toLowerCase()) ? 1 :
										(((unitsState[conversionB.sourceId].identifier + unitsState[conversionB.destinationId].identifier).toLowerCase() >
											(unitsState[conversionA.sourceId].identifier + unitsState[conversionA.destinationId].identifier).toLowerCase()) ? -1 : 0))
								.map(conversionData => (<ConversionViewComponent conversion={conversionData as ConversionData}
									key={String((conversionData as ConversionData).sourceId + '>' + (conversionData as ConversionData).destinationId)}
									units={unitsState} />))}
						</div>
					</div>
					<FooterContainer />
				</div>
			)}
		</div>
	);
}
