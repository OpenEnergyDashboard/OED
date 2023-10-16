/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import ReactTooltip from 'react-tooltip';

interface TooltipMarker {
	page: string; // Specifies page the marker is in.
	helpTextId: string; // This is the logical name of help text for the marker.
}

/**
 * Component that renders a help icon that shows a tooltip on hover
 * @param props defined above
 * @returns Tooltip Marker element
 */
export default function TooltipMarkerComponent(props: TooltipMarker) {

	// TODO This is trying to fix the fact that when the rate menu appears and disappears and you don't go to a new page
	// then the help pop up does not occur. This works reasonably well but you have to click the help icon twice
	// to see the pop up in this case. A better fix would be desirable in the long term since there have been issues with
	// tooltips in multiple places.
	// Handle click event after the component is toggled between hidden and visible (e.g GraphicRateMenuComponent).
	const handleClick = () => {
		ReactTooltip.rebuild();
	};

	return (
		<i data-for={props.page} data-tip={props.helpTextId} className='fa fa-question-circle' onClick={handleClick}/>
	);
}
