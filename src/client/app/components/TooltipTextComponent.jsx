/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ReactTooltip from 'react-tooltip';

/**
 * Component that renders text that shows a tooltip on hover
 */
export default function TooltipTextComponent(props) {
	const divStyle = {
		display: 'inline-block'
	};
	return (
		<div style={divStyle}>
			<div data-tip={props.tip}>{props.text}</div>
			<ReactTooltip />
		</div>
	);
}
