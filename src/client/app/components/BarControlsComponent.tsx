import * as moment from 'moment';
import sliderWithoutTooltips, { createSliderWithTooltip } from 'rc-slider';
import 'rc-slider/assets/index.css';
import * as React from 'react';
import { Button, ButtonGroup } from 'reactstrap';
import { graphSlice } from '../reducers/graph';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns controls for the Options Ui page.
 */
export default function BarControlsComponent() {
	const dispatch = useAppDispatch();
	const barDuration = useAppSelector(state => state.graph.barDuration);
	const barStacking = useAppSelector(state => state.graph.barStacking);
	const [showSlider, setShowSlider] = React.useState<boolean>(false);
	const [sliderVal, setSliderVal] = React.useState<number>(barDuration.asDays());

	const toggleSlider = () => {
		setShowSlider(showSlider => !showSlider)
	}

	const handleChangeBarStacking = () => {
		dispatch(graphSlice.actions.changeBarStacking())
	}

	const handleSliderChange = (value: number) => {
		setSliderVal(value)
	}
	const updateBarDurationChange = (value: number) => {
		dispatch(graphSlice.actions.updateBarDuration(moment.duration(value, 'days')))
	}
	const barDurationDays = barDuration.asDays();

	return (
		<div>
			<div className='checkbox'>
				<input type='checkbox' style={{ marginRight: '10px' }} onChange={handleChangeBarStacking} checked={barStacking} id='barStacking' />
				<label htmlFor='barStacking'>{translate('bar.stacking')}</label>
				<TooltipMarkerComponent page='home' helpTextId='help.home.bar.stacking.tip' />
			</div>
			<div>
				<p style={labelStyle}>{translate('bar.interval')}:</p>
				<ButtonGroup style={zIndexFix}>
					<Button outline={barDurationDays !== 1} onClick={() => updateBarDurationChange(1)}> {translate('day')} </Button>
					<Button outline={barDurationDays !== 7} onClick={() => updateBarDurationChange(7)}> {translate('week')} </Button>
					<Button outline={barDurationDays !== 28} onClick={() => updateBarDurationChange(28)}> {translate('4.weeks')} </Button>
				</ButtonGroup>
				<TooltipMarkerComponent page='home' helpTextId='help.home.bar.interval.tip' />
			</div>
			<div>
				<Button outline={!showSlider} onClick={toggleSlider}>{translate('toggle.custom.slider')}</Button>
				<TooltipMarkerComponent page='home' helpTextId='help.home.bar.custom.slider.tip' />
			</div>
			{showSlider &&
				<div style={divTopPadding}>
					<Slider
						min={1}
						max={365}
						value={sliderVal}
						onChange={handleSliderChange}
						onAfterChange={updateBarDurationChange}
						tipFormatter={formatSliderTip}
						trackStyle={{ backgroundColor: 'gray', height: 10 }}
						handleStyle={[{
							height: 28,
							width: 28,
							marginLeft: -14,
							marginTop: -9,
							backgroundColor: 'white'
						}]}
						railStyle={{ backgroundColor: 'gray', height: 10 }}
					/>
				</div>
			}
		</div>
	)
}

const Slider = createSliderWithTooltip(sliderWithoutTooltips);
const formatSliderTip = (value: number) => `${value} ${translate(value <= 1 ? 'day' : 'days')}`


const divTopPadding: React.CSSProperties = {
	paddingTop: '15px'
};

const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};

const zIndexFix: React.CSSProperties = {
	zIndex: 0
};