import * as React from 'react';
import { Input } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectShiftAmount, selectShiftTimeInterval, updateShiftAmount, updateShiftTimeInterval } from '../redux/slices/graphSlice';
import translate from '../utils/translate';
import { FormattedMessage } from 'react-intl';
import { ShiftAmount } from '../types/redux/graph';
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import { dateRangeToTimeInterval, timeIntervalToDateRange } from '../utils/dateRangeCompatibility';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import { Value } from '@wojtekmaj/react-daterange-picker/dist/cjs/shared/types';

/**
 * @returns compare line control page
 */
export default function CompareLineControlsComponent() {
	const dispatch = useAppDispatch();
	const shiftAmount = useAppSelector(selectShiftAmount);
	const locale = useAppSelector(selectSelectedLanguage);
	const shiftInterval = useAppSelector(selectShiftTimeInterval);
	const [shiftOption, setShiftOption] = React.useState<ShiftAmount>(shiftAmount);
	const [showDatePicker, setShowDatePicker] = React.useState(false);
	const shiftAmountNotSelected = shiftAmount === ShiftAmount.none;

	const handleShiftOptionChange = (value: string) => {
		if (value === 'custom') {
			setShiftOption(ShiftAmount.custom);
			dispatch(updateShiftAmount(ShiftAmount.custom));
			setShowDatePicker(true);
		} else {
			setShowDatePicker(false);
			if (value === 'none') {
				setShiftOption(ShiftAmount.none);
				dispatch(updateShiftAmount(ShiftAmount.none));
			} else if (value === 'week') {
				setShiftOption(ShiftAmount.week);
				dispatch(updateShiftAmount(ShiftAmount.week));
			} else if (value === 'month') {
				setShiftOption(ShiftAmount.month);
				dispatch(updateShiftAmount(ShiftAmount.month));
			} else if (value === 'year') {
				setShiftOption(ShiftAmount.year);
				dispatch(updateShiftAmount(ShiftAmount.year));
			}
		}
	};

	const handleShiftDateChange = (value: Value) => {
		const shiftTimeInterval = dateRangeToTimeInterval(value);
		dispatch(updateShiftTimeInterval(shiftTimeInterval));
	}

	return (
		<>
			<div key='side-options'>
				<p style={labelStyle}>
					<FormattedMessage id='shift.date.interval' />
					{/* <TooltipMarkerComponent helpTextId='help.shift.date.interval' /> // TODO: Add later */}
				</p>
				<Input
					id='shiftDateInput'
					name='shiftDateInput'
					type='select'
					value={shiftOption}
					invalid={shiftAmountNotSelected}
					onChange={e => handleShiftOptionChange(e.target.value)}
				>
					<option value="none" hidden disabled>{translate('select.shift.amount')}</option>
					<option value="week">{translate('1.week')}</option>
					<option value="month">{translate('1.month')}</option>
					<option value="year">{translate('1.year')}</option>
					<option value="custom">{translate('custom.date.range')}</option>
				</Input>
				{showDatePicker &&
					<DateRangePicker
						value={timeIntervalToDateRange(shiftInterval)}
						onChange={handleShiftDateChange}
						calendarProps={{ defaultView: 'year' }}
						minDate={new Date(1970, 0, 1)}
						maxDate={new Date()}
						locale={locale} // Formats Dates, and Calendar months base on locale
						calendarIcon={null}
					/>}

			</div>
		</>
	);

}

const labelStyle: React.CSSProperties = { fontWeight: 'bold', margin: 0 };
