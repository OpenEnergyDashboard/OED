/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ReactTooltip from 'react-tooltip';

/**
 * Component that renders a help icon that shows a tooltip on hover
 */
export default function TooltipHelpComponent(props) {
	const divStyle = {
		display: 'inline-block'
	};
	return (
		<div style={divStyle}>
			<i data-tip={props.tip} className="fa fa-question-circle" />
			<ReactTooltip />
		</div>
	);
}
