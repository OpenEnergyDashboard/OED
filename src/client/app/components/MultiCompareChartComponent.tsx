/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { UncontrolledAlert } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import CompareChartContainer from '../containers/CompareChartContainer';
import { CompareEntity } from '../containers/MultiCompareChartContainer';

interface MultiCompareChartProps {
	selectedCompareEntities: CompareEntity[];
	errorEntities: string[];
}

/**
 * Component that defines compare chart
 * @param props defined above
 * @returns Multi Compare Chart element
 */
export default function MultiCompareChartComponent(props: MultiCompareChartProps) {
	// Compute how much space should be used in the bootstrap grid system
	let size = 3;
	const numSelectedItems = props.selectedCompareEntities.length;
	if (numSelectedItems < 3) {
		size = numSelectedItems;
	}
	const childClassName = `col-12 col-lg-${12 / size}`;
	const centeredStyle = {
		marginTop: '20%'
	};

	return (
		<div>
			<div className='row'>
				{props.errorEntities.map(name =>
					<div className='col-12 clearfix' key={name}>
						<UncontrolledAlert color='danger' className='float-right text-right'>
							<FormattedMessage id='insufficient.readings' /> {name}
						</UncontrolledAlert>
					</div>
				)}
			</div>
			<div className='row'>
				{props.selectedCompareEntities.map(compareEntity =>
					<div className={childClassName} key={compareEntity.id + compareEntity.name}>
						{/* TODO These types of plotly containers expect a lot of passed
						values and it gives a TS error. Given we plan to  replace this
						with the react hooks version and it does not seem to cause any
						issues, this TS error is being suppressed for now.
						eslint-disable-next-line @typescript-eslint/ban-ts-comment
						@ts-ignore */}
						<CompareChartContainer
							key={compareEntity.id + compareEntity.name}
							entity={compareEntity}
						/>
					</div>
				)}
			</div>
			{props.selectedCompareEntities.length === 0 &&
				<div className='text-center' style={centeredStyle}>
					<FormattedMessage id='select.meter.group' />
				</div>
			}
		</div>
	);
}
