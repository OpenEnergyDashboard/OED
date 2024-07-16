/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
// import ReactTooltip from 'react-tooltip';
// import { ChartTypes } from '../types/redux/graph';
// import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
// import { selectChartToRender } from '../redux/slices/graphSlice';

export default function MoreOptionsComponent() {
	// const dispatch = useAppDispatch();
	// const chartToRender = useAppSelector(selectChartToRender);

	return (
		<>
			{
				<div>
					<Button color='secondary' outline>
						More Options
					</Button>
				</div>
			}
		</>
	);

}