/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';

export default function ListDisplayComponent(props) {
	const defaultHeightItems = 8;
	const itemHeightPx = 18;
	const heightPx = (props.height || defaultHeightItems) * itemHeightPx;

	// The list wrapper is of a fixed height, with  grey border and a slight curve
	// It imposes a scrollbar when there is too much content to display
	const listWrapperStyle = {
		border: '1px solid #cccccc',
		borderRadius: '2px',
		minHeight: `${heightPx}px`,
		maxHeight: `${heightPx}px`,
		overflowY: 'scroll'
	};

	// The list itself has no bullets and pads items as if they were in a <select>
	const listStyle = {
		listStyleType: 'none',
		paddingTop: '6px',
		paddingBottom: '6px',
		paddingLeft: '12px',
		paddingRight: '12px',
	};

	return (
		<div className="list-wrapper" style={listWrapperStyle} >
			<ul id="meterList" style={listStyle} >
				{ props.items.map((item, i) => <li key={i}>{ item.toString() }</li>) }
			</ul>
		</div>
	);
}
