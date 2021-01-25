/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ReactTooltip from 'react-tooltip';
import helpLinks from '../translations/helpLinks';
import '../styles/tooltip.css';

interface TooltipHelpProps {
	page: string; // Specifies which page the tip is in.
}

/**
 * Component that renders a help icon that shows a tooltip on hover
 */
export default function TooltipHelpComponentAlternative(props: TooltipHelpProps) {
	const divStyle = {
		display: 'inline-block'
	};

	return (
		<div style={divStyle}>
			<ReactTooltip className='tip' id={`${props.page}`} event='click' clickable effect='solid' globalEventOff="click" getContent={(dataTip) => {
				if (dataTip === null) {
					return;
				}
				// Create links
				const values = helpLinks[dataTip];
				const links: Record<string, JSX.Element> = {};
				Object.keys(values).forEach(key => {
					const link = values[key];
					links[key] = (<a target='_blank' rel='noopener noreferrer' href={link}>
						here
					</a>);
				});
				return (
					<div style={{ width: '300px' }}>
						<FormattedMessage
							id={dataTip}
							values={links}
						/>
					</div>
				);
			}} />

		</div>
	);
}
