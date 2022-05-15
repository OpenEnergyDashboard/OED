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
				{props.errorEntities.map( name =>
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
						<CompareChartContainer
							key={compareEntity.id + compareEntity.name}
							entity={compareEntity}
						/>
					</div>
				)}
			</div>
			{props.selectedCompareEntities.length === 0 &&
				<div className='text-center' style={centeredStyle}>
					<b><FormattedMessage id='empty.compare' /> </b>
				</div>
			}
		</div>
	);
}
