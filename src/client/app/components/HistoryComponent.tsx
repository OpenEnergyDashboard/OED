import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
	selectForwardHistory, selectPrevHistory,
	historyStepBack, historyStepForward
} from '../reducers/graph';
/**
 * @returns Renders a history component with previous and next buttons.
 */
export default function HistoryComponent() {
	const dispatch = useAppDispatch();
	const backStack = useAppSelector(selectPrevHistory)
	const forwardStack = useAppSelector(selectForwardHistory)

	return (
		<div style={{ width: '80%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
			<svg width={20} height={20} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
				style={{ visibility: !backStack.length ? 'hidden' : 'visible', cursor: 'pointer' }}
				onClick={() => dispatch(historyStepBack())}
			>
				<path d="M5 1L1 5L5 9" stroke={'black'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<svg width={20} height={20} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
				style={{ visibility: !forwardStack.length ? 'hidden' : 'visible', cursor: 'pointer' }}
				onClick={() => dispatch(historyStepForward())}
			>
				<path d="M5 1L9 5L5 9" stroke={'black'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</div >
	)
}