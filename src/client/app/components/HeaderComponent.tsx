/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { selectOptionsVisibility } from '../redux/slices/appStateSlice';
import { useAppSelector } from '../redux/reduxHooks';
import HeaderButtonsComponent from './HeaderButtonsComponent';
import LogoComponent from './LogoComponent';
import MenuModalComponent from './MenuModalComponent';

/**
 * React component that controls the header strip at the top of all pages
 * @returns header element
 */
export default function HeaderComponent() {
	const siteTitle = useAppSelector(state => state.admin.displayTitle);
	const showOptions = useAppSelector(selectOptionsVisibility);
	const { pathname } = useLocation()

	return (
		<div className='container-fluid' id='header'>
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
				<div className='d-xl-none d-none d-sm-block col-4 text-center'>
					<h3 style={largeTitleStyle}>{siteTitle}</h3>
				</div>
				<div className='d-sm-none col-4 text-center'>
					<h6 style={smallTitleStyle}>{siteTitle}</h6>
				</div>
				{/* Render menuModal regardless of settings if on a smaller screen */}
				<div className='col-4 justify-content-end d-lg-none d-flex'>
					<MenuModalComponent />
				</div>
				<div className='col-4 justify-content-end d-lg-flex d-none'>
					{/* collapse menu if optionsVisibility is false */}
					{
						pathname === '/' && !showOptions
							? <MenuModalComponent />
							: <HeaderButtonsComponent />
					}
				</div>
			</div>
		</div>
	);
}
const largeTitleStyle = {
	display: 'inline-block'
};
const smallTitleStyle = {
	display: 'inline-block',
	marginTop: '10px'
};