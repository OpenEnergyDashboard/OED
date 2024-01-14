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
			<HeaderComponent />
			{props.children ?? <Outlet />}
			<FooterComponent />
		</>
	)
}