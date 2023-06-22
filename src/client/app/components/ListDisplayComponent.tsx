/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

interface ListDisplayProps {
	height?: number;
	items: any[];
}

/**
 * Defines a list wrapper used in OED
 * @param props defined above
 * @returns List Display JSX Element
 */
export default function ListDisplayComponent(props: ListDisplayProps) {
	const defaultHeightItems = 8;
	const itemHeightPx = 18;
	const heightPx = (props.height || defaultHeightItems) * itemHeightPx;

	// The list wrapper is of a fixed height, with  grey border and a slight curve
	// It imposes a scrollbar when there is too much content to display
	const listWrapperStyle: React.CSSProperties = {
		border: '1px solid #cccccc',
		borderRadius: '2px',
		minHeight: `${heightPx}px`,
		maxHeight: `${heightPx}px`,
		overflowY: 'scroll'
	};

	// The list itself has no bullets and pads items as if they were in a <select>
	const listStyle: React.CSSProperties = {
		listStyleType: 'none',
		paddingTop: '6px',
		paddingBottom: '6px',
		paddingLeft: '12px',
		paddingRight: '12px'
	};

	return (
		<div className='list-wrapper' style={listWrapperStyle} >
			<ul id='meterList' style={listStyle} >
				{props.items.map((item: any) => (
					<li key={item.toString()}>{item.toString()}</li>
				))}
			</ul>
		</div>
	);
}
