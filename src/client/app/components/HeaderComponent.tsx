/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Link } from 'react-router-dom';
import LogoComponent from './LogoComponent';
import MenuModalComponent from './MenuModalComponent';
import HeaderButtonsComponent from './HeaderButtonsComponent';
import { useSelector } from 'react-redux';
import { State } from '../types/redux/state';

/**
 * React component that controls the header strip at the top of all pages
 */
export default function HeaderComponent() {
	const siteTitle = useSelector((state: State) => state.admin.displayTitle);
	const showOptions = useSelector((state: State) => state.graph.optionsVisibility);

	const divStyle = {
		marginTop: '5px',
		paddingBottom: '5px'
	};
	const largeTitleStyle = {
		display: 'inline-block'
	};
	const smallTitleStyle = {
		display: 'inline-block',
		marginTop: '10px'
	};

	return (
		<div className='container-fluid' style={divStyle}>
			<div className='row'>
				<div className='d-none d-lg-block col-4'>
					<Link to='/'><LogoComponent height={80} url='./logo.png' /></Link>
				</div>
				<div className='d-lg-none col-4'>
					<Link to='/'><LogoComponent height={50} url='./logo.png' /></Link>
				</div>
				<div className='d-none d-xl-block col-4 text-center'>
					<h1 style={largeTitleStyle}>{siteTitle}</h1>
				</div>
				<div className='d-xl-none d-none d-lg-block col-4 text-center'>
					<h3 style={largeTitleStyle}>{siteTitle}</h3>
				</div>
				<div className='d-lg-none col-4 text-center'>
					<h6 style={smallTitleStyle}>{siteTitle}</h6>
				</div>
				{/* Render menuModal regardless of settings if on a smaller screen */}
				<div className='col-4 justify-content-end d-lg-none d-flex'>
					<MenuModalComponent />
				</div>
				<div className='col-4 justify-content-end d-lg-flex d-none'>
					{/* collapse menu if optionsVisibility is false */}
					{!showOptions ?
						<MenuModalComponent /> :
						<HeaderButtonsComponent isModal={false} />
					}
				</div>
			</div>
		</div>
	);

}
