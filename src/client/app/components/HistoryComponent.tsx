/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectForwardHistory, selectPrevHistory } from '../redux/slices/graphSlice';
import { historyStepBack, historyStepForward } from '../redux/actions/extraActions';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns Renders a history component with previous and next buttons.
 */
export default function HistoryComponent() {
	const dispatch = useAppDispatch();
	const backStack = useAppSelector(selectPrevHistory);
	const forwardStack = useAppSelector(selectForwardHistory);

	return (
		<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'start' }}>
			<svg width={20} height={20} style={{ visibility: !backStack.length ? 'hidden' : 'visible', cursor: 'pointer' }}
				onClick={() => dispatch(historyStepBack())}
				viewBox="0 0 10 10" fill="none"
			>
				<path d="M5 1L1 5L5 9" stroke={'black'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<svg width={20} height={20} style={{ visibility: !forwardStack.length ? 'hidden' : 'visible', cursor: 'pointer' }}
				viewBox="0 0 10 10" fill="none"
				onClick={() => dispatch(historyStepForward())}
			>
				<path d="M5 1L9 5L5 9" stroke={'black'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<div style={{ marginLeft: '5px', visibility: !forwardStack.length && !backStack.length ? 'hidden' : 'visible' }}>
				<TooltipMarkerComponent page='home' helpTextId={'help.home.history'} />
			</div>
		</div >
	);
}