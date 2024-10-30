/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { useAppSelector } from '../redux/reduxHooks';
import { selectChartToRender } from '../redux/slices/graphSlice';
import { ChartTypes } from '../types/redux/graph';
import '../styles/modal.css';
import AreaUnitSelectComponent from './AreaUnitSelectComponent';
import ChartLinkComponent from './ChartLinkComponent';
import DateRangeComponent from './DateRangeComponent';
import ErrorBarComponent from './ErrorBarComponent';
import ExportComponent from '../components/ExportComponent';
import GraphicRateMenuComponent from './GraphicRateMenuComponent';
import { useTranslate } from '../redux/componentHooks';

/**
 * Modal popup control for various graph types
 * @returns Custom Modal depending on selected graph type
 */
export default function MoreOptionsComponent() {
	const translate = useTranslate();
	const chartToRender = useAppSelector(selectChartToRender);
	const [showModal, setShowModal] = useState(false);
	const handleShow = () => setShowModal(true);
	const handleClose = () => {
		setShowModal(false);
	};

	return (
		<>
			{
				<div style={{marginTop: '10px'}}>
					<Button color='secondary' outline onClick={handleShow}>
						{translate('more.options')}
					</Button>
					<Modal isOpen={showModal} toggle={handleClose} size='md'>
						<ModalHeader>
							{translate('more.options')}
						</ModalHeader>
						<ModalBody>
							{/* More UI options for line graphic */}
							{chartToRender == ChartTypes.line && <GraphicRateMenuComponent />}
							{chartToRender == ChartTypes.line && <DateRangeComponent />}
							{chartToRender == ChartTypes.line && <AreaUnitSelectComponent />}
							{chartToRender == ChartTypes.line && <ErrorBarComponent />}
							{chartToRender == ChartTypes.line && <ExportComponent />}
							{chartToRender == ChartTypes.line && <ChartLinkComponent />}

							{/* More UI options for bar graphic */}
							{chartToRender == ChartTypes.bar && <DateRangeComponent />}
							{chartToRender == ChartTypes.bar && <AreaUnitSelectComponent />}
							{chartToRender == ChartTypes.bar && <ExportComponent />}
							{chartToRender == ChartTypes.bar && <ChartLinkComponent />}

							{/* More UI options for compare graphic */}
							{chartToRender == ChartTypes.compare && <AreaUnitSelectComponent />}
							{chartToRender == ChartTypes.compare && <ChartLinkComponent />}

							{/* More UI options for map graphic */}
							{chartToRender == ChartTypes.map && <DateRangeComponent />}
							{chartToRender == ChartTypes.map && <AreaUnitSelectComponent />}
							{chartToRender == ChartTypes.map && <ChartLinkComponent />}

							{/* More UI options for 3D graphic */}
							{chartToRender == ChartTypes.threeD && <GraphicRateMenuComponent />}
							{chartToRender == ChartTypes.threeD && <AreaUnitSelectComponent />}
							{chartToRender == ChartTypes.threeD && <ChartLinkComponent />}

							{/* More UI options for radar graphic */}
							{chartToRender == ChartTypes.radar && <GraphicRateMenuComponent />}
							{chartToRender == ChartTypes.radar && <DateRangeComponent />}
							{chartToRender == ChartTypes.radar && <AreaUnitSelectComponent />}
							{chartToRender == ChartTypes.radar && <ChartLinkComponent />}
						</ModalBody>
						<ModalFooter></ModalFooter>
					</Modal>
				</div>
			}
		</>
	);

}
