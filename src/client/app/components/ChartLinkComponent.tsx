/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { toast } from 'react-toastify';
import ReactTooltip from 'react-tooltip';
import { Button, ButtonGroup, Input } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectChartLink } from '../redux/selectors/uiSelectors';
import { selectChartLinkHideOptions, setChartLinkOptionsVisibility } from '../redux/slices/appStateSlice';
import { selectSelectedGroups, selectSelectedMeters } from '../redux/slices/graphSlice';
import { showErrorNotification, showInfoNotification } from '../utils/notifications';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns chartLinkComponent
 */
export default function ChartLinkComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const [linkTextVisible, setLinkTextVisible] = React.useState<boolean>(false);
	const linkText = useAppSelector(selectChartLink);
	const linkHideOptions = useAppSelector(selectChartLinkHideOptions);
	const selectedMeters = useAppSelector(selectSelectedMeters);
	const selectedGroups = useAppSelector(selectSelectedGroups);
	const ref = React.useRef<HTMLDivElement>(null);
	const handleButtonClick = () => {
		// First attempt to write directly to user's clipboard.
		navigator.clipboard.writeText(linkText)
			.then(() => {
				showInfoNotification(translate('clipboard.copied'), toast.POSITION.TOP_RIGHT, 1000);
			})
			.catch(() => {
				// if operation fails, open copyable text for manual copy.
				showErrorNotification(translate('clipboard.not.copied'), toast.POSITION.TOP_RIGHT, 1000);
				setLinkTextVisible(true);
			});
	};
	if (selectedMeters.length > 0 || selectedGroups.length > 0) {
		return (
			<div>
				<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'start' }}>
					<ButtonGroup >
						<Button outline onClick={handleButtonClick} >
							<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', gap: '1em', alignItems: 'center' }}>
								{translate('chart.link')}
								<div ref={ref} data-for={'home'} data-tip={'help.home.toggle.chart.link'}								>
									<Input type='checkbox' defaultChecked={linkHideOptions}
										onClickCapture={e => {
											e.stopPropagation();
											dispatch(setChartLinkOptionsVisibility(!linkHideOptions));
										}}
										onMouseOver={() => {
											ref.current && ReactTooltip.show(ref.current);
										}}
										onMouseLeave={() => {
											ref.current && ReactTooltip.hide(ref.current);
										}}
									/>
								</div>
							</div>
						</Button>
						<Button outline onClick={() => setLinkTextVisible(visible => !visible)}>
							{linkTextVisible ? 'x' : 'v'}
						</Button>
					</ButtonGroup>
					<TooltipMarkerComponent page='home' helpTextId='help.home.toggle.chart.link' />
				</div>
				{
					linkTextVisible &&
					<div style={wellStyle}>
						{linkText}
					</div>
				}
			</div >
		);
	}
	else {
		return null;
	}
}

const wellStyle: React.CSSProperties = {
	wordWrap: 'break-word',
	padding: '9px',
	minHeight: '20px',
	marginBottom: '20px',
	backgroundColor: '#f5f5f5',
	border: '1px solid #e3e3e3'
};
