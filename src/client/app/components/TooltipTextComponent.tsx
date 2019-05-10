/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

interface TooltipTextProps {
	tip: string;
	text?: string;
	children?: React.ReactChild;
}

/**
 * Component that renders text that shows a tooltip on hover
 */
export default function TooltipTextComponent(props: TooltipTextProps) {
	const divStyle = {
		display: 'inline-block'
	};
	if (props.text !== null && props.text !== undefined) {
		return (
			<div style={divStyle}>
				<div data-tip={props.tip}>{props.text}</div>
				<ReactTooltip />
			</div>
		);
	} else {
		return (
			<div style={divStyle}>
				<div data-tip={props.tip}>{props.children}</div>
				<ReactTooltip />
			</div>
		)
	}
}
