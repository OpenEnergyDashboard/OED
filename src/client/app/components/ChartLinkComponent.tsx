/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { toast } from 'react-toastify';
import ReactTooltip from 'react-tooltip';
import { Button, ButtonGroup, Input } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectChartLink } from '../redux/selectors/uiSelectors';
import { selectChartLinkHideOptions, selectCurrentTime, setChartLinkOptionsVisibility, setCurrentTime } from '../redux/slices/appStateSlice';
import {selectQueryTimeInterval, selectSelectedGroups, selectSelectedMeters, selectSliderRangeInterval } from '../redux/slices/graphSlice';
import { showErrorNotification, showInfoNotification } from '../utils/notifications';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { wellStyle, rowFlexStart } from '../styles/modalStyle';


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
	const queryTimeInterval = useAppSelector(selectQueryTimeInterval)
	const currentTime = useAppSelector(selectCurrentTime)
	const range = useAppSelector(selectSliderRangeInterval)
	
	const ref = React.useRef<HTMLDivElement>(null);
	const shouldShowcurrentTimeCheckbox = React.useMemo(() => {
		if (!queryTimeInterval) return false
		if(queryTimeInterval.getIsBounded()) return false
		if(queryTimeInterval.getStartTimestamp() == null && !queryTimeInterval.getIsBounded()) return false
		return true
	}, [queryTimeInterval])
	
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
				<div style={rowFlexStart}>
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
					
							{shouldShowcurrentTimeCheckbox && (
								
								<label htmlFor="currentTimeCheckbox" style = {{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
								<Input
  									type="checkbox"
 									id="currentTimeCheckbox"
 									checked={currentTime}
  									onChange={e => dispatch(setCurrentTime(e.target.checked))}
									/>
								 Keep Current </label>
								 
							)}
						
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