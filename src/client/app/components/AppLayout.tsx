/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { Slide, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import FooterComponent from './FooterComponent'
import HeaderComponent from './HeaderComponent'

interface LayoutProps {
	children?: React.ReactNode | undefined
}
/**
 * @param props Optional Children prop to render instead of using Outlet
 * @returns The OED Application Layout. The current route as the outlet Wrapped in the header, and footer components
 */
export default function AppLayout(props: LayoutProps) {
	return (
		<>
			<ToastContainer transition={Slide} />
			<div style={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				flexWrap: 'nowrap',
				margin: '0',
				padding: '0'
			}}>
				<HeaderComponent />
				{
					// For the vast majority of cases we utilize react-router's outlet here.
					// However we can use app layout with children.
					// Refer to ErrorComponent.tsx for children usage.
					// Refer to RouteComponent for outlet usage
					props.children ?? <Outlet />
				}
				<FooterComponent />
			</div>
		</>
	)
}