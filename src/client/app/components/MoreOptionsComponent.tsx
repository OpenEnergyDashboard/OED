/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import '../styles/modal.css';
import { useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender } from '../redux/slices/graphSlice';
//import ExportComponent from '../components/ExportComponent';
//import AreaUnitSelectComponent from './AreaUnitSelectComponent';
//import ChartLinkComponent from './ChartLinkComponent';
//import ErrorBarComponent from './ErrorBarComponent';
//import GraphicRateMenuComponent from './GraphicRateMenuComponent';

export default function MoreOptionsComponent() {
	const chartToRender = useAppSelector(selectChartToRender);
	const [showModal, setShowModal] = useState(false);
	const handleShow = () => setShowModal(true);
	const handleClose = () => {
		setShowModal(false);
	};

	return (
		<>
			{
				<div>
					<Button color='secondary' outline onClick={handleShow}>
						More Options
					</Button>
					<Modal isOpen={showModal} toggle={handleClose} size='lg'>
						<ModalHeader>More options for '{chartToRender}' graph type:</ModalHeader>
						<ModalBody>
							Test test
						</ModalBody>
						<ModalFooter></ModalFooter>
					</Modal>
				</div>
			}
		</>
	);

}