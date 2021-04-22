/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Link } from 'react-router';
import LogoComponent from './LogoComponent';
import MenuModalComponent from './MenuModalComponent';
import HeaderButtonsContainer from '../containers/HeaderButtonsContainer';
import getPage from '../utils/getPage';

interface HeaderProps {
	title: string;
	optionsVisibility: boolean;
}

/**
 * React component that controls the header strip at the top of all pages
 */
function HeaderComponent(props: HeaderProps) {
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
	const divRightStyle = {
		display: 'flex'
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
				<div className='d-none d-lg-block col-4 text-center'>
					<h1 style={largeTitleStyle}>{props.title}</h1>
				</div>
				<div className='d-lg-none col-4 text-center'>
					<h6 style={smallTitleStyle}>{props.title}</h6>
				</div>
				<div className='col-4 justify-content-end' style={divRightStyle}>
					{ props.optionsVisibility ?
						<HeaderButtonsContainer showCollapsedMenuButton />
						: <MenuModalComponent
							showOptions={getPage() === ''}
							showCollapsedMenuButton={false}
						/>
					}
				</div>
			</div>
		</div>
	);
}

export default HeaderComponent;