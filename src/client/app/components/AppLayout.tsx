import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { Slide, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import FooterComponent from './FooterComponent'
import HeaderComponent from './HeaderComponent'
/**
 * @returns The OED Application Layout. The current route as the outlet Wrapped in the header, and footer components
 */
export default function AppLayout() {
	return (
		<>
			<ToastContainer transition={Slide} />
			<HeaderComponent />
			<Outlet />
			<FooterComponent />
		</>
	)
}