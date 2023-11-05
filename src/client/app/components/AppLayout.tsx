import * as React from 'react'
import { Outlet } from 'react-router-dom-v5-compat'
import FooterContainer from '../containers/FooterContainer'
import HeaderComponent from './HeaderComponent'
import { Slide, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
/**
 * @returns The OED Application, with the current route as an outlet
 */
export default function AppLayout() {
	return (
		<>
			<ToastContainer transition={Slide} />
			<HeaderComponent />

			<Outlet />
			<FooterContainer />
		</>
	)
}