import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { prevHistory, forwardHistory, selectBackHistoryStack, selectForwardHistoryStack } from '../reducers/appStateSlice';
/**
 * @returns Renders a history component with previous and next buttons.
 */
export default function HistoryComponent() {
	const dispatch = useAppDispatch();
	const backStack = useAppSelector(selectBackHistoryStack)
	const forwardStack = useAppSelector(selectForwardHistoryStack)

	return (
		<div style={{ width: '80%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
			<svg width={20} height={20} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
				style={{
					visibility: backStack.length <= 1 ? 'hidden' : 'visible',
					cursor: 'pointer'
				}}
				onClick={() => dispatch(prevHistory())}
			>
				<path d="M5 1L1 5L5 9" stroke={'black'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<svg width={20} height={20} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
				style={{
					visibility: forwardStack.length < 1 ? 'hidden' : 'visible',
					cursor: 'pointer'
				}}
				onClick={() => dispatch(forwardHistory())}
			>
				<path d="M5 1L9 5L5 9" stroke={'black'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</div >
	)
}