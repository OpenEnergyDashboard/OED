/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import ReactTooltip from 'react-tooltip';

interface TooltipHelpProps {
	tip: string;
}

/**
 * Component that renders a help icon that shows a tooltip on hover
 */
export default function TooltipHelpComponent(props: TooltipHelpProps) {
	const divStyle = {
		display: 'inline-block'
	};
	return (
		<div style={divStyle}>
			<i data-tip={`<div style="max-width:300px">${props.tip}</div>`} className='fa fa-question-circle' />
			<ReactTooltip html event='click'/>
		</div>
	);
}
