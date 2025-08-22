/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from "react";
import { toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { Button, ButtonGroup,Input} from "reactstrap";
import { useAppDispatch, useAppSelector } from "../redux/reduxHooks";
import { selectChartLink } from "../redux/selectors/uiSelectors";
import {
selectChartLinkHideOptions, selectIsKeepCurrent, setChartLinkOptionsVisibility,
setIsKeepCurrent
} from "../redux/slices/appStateSlice";
import {
	selectSelectedGroups,
	selectSelectedMeters,
	selectQueryTimeInterval,
} from "../redux/slices/graphSlice";
import {
	showErrorNotification,
	showInfoNotification,
} from "../utils/notifications";
import { useTranslate } from "../redux/componentHooks";
import TooltipMarkerComponent from "./TooltipMarkerComponent";
import { wellStyle, rowFlexStart, labelStyle } from "../styles/modalStyle";
import { checkboxStyle } from "../styles/modalStyle";



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
	const queryTimeInterval = useAppSelector(selectQueryTimeInterval);
  const isKeepCurrent = useAppSelector(selectIsKeepCurrent)
	const ref = React.useRef<HTMLDivElement>(null);

	// THIS react.UseMemo ONLY RETURNS TRUE WHEN THE CONDITIONS ARE MET FOR USING KEEP CURRENT (left is is bounded and right is unbounded)
	const shouldShowKeepCurrentCheckbox = React.useMemo(() => {
		if (!queryTimeInterval) return false;
		if (queryTimeInterval.getIsBounded()) return false;
		if (
			queryTimeInterval.getStartTimestamp() == null &&
			!queryTimeInterval.getIsBounded()
		)
			return false;
		return true;
	}, [queryTimeInterval]);

	const handleButtonClick = () => {
		// First attempt to write directly to user's clipboard.
		navigator.clipboard
			.writeText(linkText)
			.then(() => {
				showInfoNotification(
					translate("clipboard.copied"),
					toast.POSITION.TOP_RIGHT,
					1000
				);
			})
			.catch(() => {
				// if operation fails, open copyable text for manual copy.
				showErrorNotification(
					translate("clipboard.not.copied"),
					toast.POSITION.TOP_RIGHT,
					1000
				);
				setLinkTextVisible(true);
			});
	};
	if (selectedMeters.length > 0 || selectedGroups.length > 0) {
		return (
			<div>
				{/* inputting new "keep chart current" feature */}
				<div style={labelStyle}>{translate("chart.link.options.title")}</div>
				{/* hide options checkbox */}
				<div className="checkbox">
					<Input
						type="checkbox"
						style={checkboxStyle}
						defaultChecked={linkHideOptions}
						onClickCapture={(e) => {
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
					<label>{translate("hide.options.when.using.this.label")}</label>
					<TooltipMarkerComponent
						page="home"
						helpTextId="help.home.toggle.chart.link"
					/>
				</div>
				{/* keep current checkbox ----> */}
				{/* USE shouldShowKeepCurrentCheckbox AS THE CONDITIONAL BOOLEAN */}
				<div className="checkbox">
					<Input
						type="checkbox"
						style={checkboxStyle}
						onMouseOver={() => {
							ref.current && ReactTooltip.show(ref.current);
						}}
						onMouseLeave={() => {
							ref.current && ReactTooltip.hide(ref.current);
						}}
						checked={isKeepCurrent}
						onChange={e => dispatch(setIsKeepCurrent(e.target.checked))}
						disabled={!shouldShowKeepCurrentCheckbox}
						// shouldShow is the value we use to tell if it should be disabled or not
						//when disabled = true, you CANNOT click the checkbox
					/>

					<label
					// uses the default value when shouldShowKeepCurrentCheckbox is true, and the greyed out color when it's false
						style={{
							color: shouldShowKeepCurrentCheckbox
								? undefined
								: "hsl(0, 0%, 70%)",
						}}
					>
						{translate("keep.chart.current.label")}
					</label>
					{/* we need to create a tool tip for "keep chart current" checkbox */}
					<TooltipMarkerComponent page="home" helpTextId="help.home.toggle.chart.link.keep.current" />
				</div>

				<div style={rowFlexStart}>

					<ButtonGroup>
						<Button outline onClick={handleButtonClick}>
							<div
								style={{
									display: "flex",
									flexDirection: "row",
									justifyContent: "space-evenly",
									gap: "1em",
									alignItems: "center",
								}}
							>
								{translate("chart.link")}

							</div>
						</Button>
						<Button
							outline
							onClick={() => setLinkTextVisible((visible) => !visible)}
						>
							{linkTextVisible ? "x" : "v"}
						</Button>
						
					</ButtonGroup>
				</div>
				{linkTextVisible && <div style={wellStyle}>{linkText}</div>}
			</div>
		);
	} else {
		return null;
	}
}
