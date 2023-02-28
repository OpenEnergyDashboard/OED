/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import ReactTooltip from 'react-tooltip';

interface TooltipTextProps {
	tip: string;
	text: string;
}

/**
 * Component that renders text that shows a tooltip on hover
 * @param {TooltipTextProps} props defined above
 * @returns {Element} Tooltip text element
 */
export default function TooltipTextComponent(props: TooltipTextProps) {
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
