/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import SpinnerComponent from '../SpinnerComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import { conversionsApi, stableEmptyConversions } from '../../redux/api/conversionsApi';
import { stableEmptyUnitDataById, unitsAdapter, unitsApi } from '../../redux/api/unitsApi';
import { ConversionData } from '../../types/redux/conversions';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import ConversionViewComponent from './ConversionViewComponent';
import CreateConversionModalComponent from './CreateConversionModalComponent';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectSelectedLanguage } from '../../redux/slices/appStateSlice';

/**
 * Defines the conversions page card view
 * @returns Conversion page element
 */
export default function ConversionsDetailComponent() {
	// The route stops you from getting to this page if not an admin.
	const locale = useAppSelector(selectSelectedLanguage);
	// Conversions state
	const { data: conversionsState = stableEmptyConversions, isFetching: conversionsFetching } = conversionsApi.useGetConversionsDetailsQuery();
	// Units DataById
	const { unitDataById = stableEmptyUnitDataById, isFetching: unitsFetching } = unitsApi.useGetUnitsDetailsQuery(undefined, {
		selectFromResult: ({ data, ...result }) => ({
			...result,
			unitDataById: data && unitsAdapter.getSelectors().selectEntities(data)
		})
	});

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
		<div className='flexGrowOne'>
			{(conversionsFetching || unitsFetching) ? (
				<div className='text-center'>
					<SpinnerComponent loading width={50} height={50} />
					<FormattedMessage id='redo.cik.and.refresh.db.views'></FormattedMessage>
				</div>
			) : (
				<div>
					<TooltipHelpComponent page='conversions' />

					<div className='container-fluid'>
						<h2 style={titleStyle}>
							<FormattedMessage id='conversions' />
							<div style={tooltipStyle}>
								<TooltipMarkerComponent page='conversions' helpTextId={tooltipStyle.tooltipConversionView} />
							</div>
						</h2>
						<div className="edit-btn">
							<CreateConversionModalComponent />
						</div>
						<div className="card-container">
							{/* Attempt to create a ConversionViewComponent for each ConversionData in Conversions State after sorting by
					the combination of the identifier of the source and destination of the conversion. */}
							{
								Object.values(conversionsState)
									.sort((conversionA: ConversionData, conversionB: ConversionData) =>
										((unitDataById[conversionA.sourceId]?.identifier + unitDataById[conversionA.destinationId]?.identifier).toLowerCase().localeCompare((
											unitDataById[conversionB.sourceId]?.identifier + unitDataById[conversionB.destinationId]?.identifier).toLowerCase(), locale,
										{ sensitivity: 'accent'})))
									.map(conversionData => (
										<ConversionViewComponent
											conversion={conversionData}
											key={conversionData?.sourceId + '>' + conversionData?.destinationId}
										/>
									))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
