/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

interface TooltipMarker {
	page: string; // Specifies page the marker is in.
	helpTextId: string; // This is the logical name of help text for the marker.
}
/**
 * Component that renders a help icon that shows a tooltip on hover
 */
export default function TooltipMarkerComponent(props: TooltipMarker) {
	return (
		<i data-for={props.page} data-tip={props.helpTextId} className='fa fa-question-circle' />
	);
}
