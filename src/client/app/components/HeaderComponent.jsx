/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Link } from 'react-router';
import LogoComponent from './LogoComponent';
import HeaderButtonsComponent from './HeaderButtonsComponent';

/**
 * React component that controls the header strip at the top of all pages
 */
export default function HeaderComponent(props) {
	const titleStyle = {
		marginTop: '5px',
		display: 'inline-block'
	};
	const divStyle = {
		paddingBottom: '5px'
	};
	const divRightStyle = {
		marginTop: '5px',
		display: 'flex'
	};

	return (
		<div className="container-fluid" style={divStyle}>
			<div className="row">
				<div className="col-4">
					<Link to="/"><LogoComponent url="./app/images/logo.png" /></Link>
				</div>
				<div className="col-4 text-center">
					<h1 style={titleStyle}>{props.title}</h1>
				</div>
				<div className="col-4 justify-content-end" style={divRightStyle}>
					<HeaderButtonsComponent renderOptionsButton />
				</div>
			</div>
		</div>
	);
}
