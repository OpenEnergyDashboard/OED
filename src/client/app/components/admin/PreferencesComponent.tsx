/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { cloneDeep, isEqual } from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Input, FormFeedback } from 'reactstrap';
import { UnsavedWarningComponent } from '../UnsavedWarningComponent';
import { preferencesApi } from '../../redux/api/preferencesApi';
import {
	MIN_DATE, MIN_DATE_MOMENT, MAX_DATE, MAX_DATE_MOMENT, MAX_ERRORS
} from '../../redux/selectors/adminSelectors';
import { PreferenceRequestItem } from '../../types/items';
import { ChartTypes } from '../../types/redux/graph';
import { LanguageTypes } from '../../types/redux/i18n';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { useTranslate } from '../../redux/componentHooks';
import TimeZoneSelect from '../TimeZoneSelect';
import { defaultAdminState } from '../../redux/slices/adminSlice';
import { checkboxStyle, labelStyle } from '../../styles/modalStyle';


/**
 * @returns Preferences Component for Administrative use
 */
export default function PreferencesComponent() {
	const translate = useTranslate();
	const { data: adminPreferences = defaultAdminState } = preferencesApi.useGetPreferencesQuery();
	const [localAdminPref, setLocalAdminPref] = React.useState<PreferenceRequestItem>(cloneDeep(adminPreferences));
	const [submitPreferences] = preferencesApi.useSubmitPreferencesMutation();
	const [hasChanges, setHasChanges] = React.useState<boolean>(false);

	// mutation will invalidate preferences tag and will be re-fetched.
	// On query response, reset local changes to response
	React.useEffect(() => { setLocalAdminPref(cloneDeep(adminPreferences)); }, [adminPreferences]);
	// Compare the API response against the localState to determine changes
	React.useEffect(() => { setHasChanges(!isEqual(adminPreferences, localAdminPref)); }, [localAdminPref, adminPreferences]);

	const makeLocalChanges = (key: keyof PreferenceRequestItem, value: PreferenceRequestItem[keyof PreferenceRequestItem]) => {
		setLocalAdminPref({ ...localAdminPref, [key]: value });
	};

	const discardChanges = () => {
		setLocalAdminPref(cloneDeep(adminPreferences));
	};

	// Functions for input validation and warnings. Each returns true if the user inputs invalid data into its field
	// Need to be functions due to static reference. If they were booleans they wouldn't update when localAdminPref updates
	const invalidFuncs = {
		readingFreq: (): boolean => {
			const frequency = moment.duration(localAdminPref.defaultMeterReadingFrequency);
			return !frequency.isValid() || frequency.asSeconds() <= 0;
		},
		minDate: (): boolean => {
			const minMoment = moment(localAdminPref.defaultMeterMinimumDate);
			const maxMoment = moment(localAdminPref.defaultMeterMaximumDate);
			return !minMoment.isValid() || !minMoment.isSameOrAfter(MIN_DATE_MOMENT) || !minMoment.isSameOrBefore(maxMoment);
		},
		maxDate: (): boolean => {
			const minMoment = moment(localAdminPref.defaultMeterMinimumDate);
			const maxMoment = moment(localAdminPref.defaultMeterMaximumDate);
			return !maxMoment.isValid() || !maxMoment.isSameOrBefore(MAX_DATE_MOMENT) || !maxMoment.isSameOrAfter(minMoment);
		},
		readingGap: (): boolean => { return Number(localAdminPref.defaultMeterReadingGap) < 0; },

		meterErrors: (): boolean => {
			return Number(localAdminPref.defaultMeterMaximumErrors) < 0
				|| Number(localAdminPref.defaultMeterMaximumErrors) > MAX_ERRORS;
		},

		warningFileSize: (): boolean => {
			return Number(localAdminPref.defaultWarningFileSize) < 0
				|| Number(localAdminPref.defaultWarningFileSize) > Number(localAdminPref.defaultFileSizeLimit);
		},

		fileSizeLimit: (): boolean => {
			return Number(localAdminPref.defaultFileSizeLimit) < 0
				|| Number(localAdminPref.defaultWarningFileSize) > Number(localAdminPref.defaultFileSizeLimit);
		}
	};

	return (
		<div className='d-flex flex-column '>
			<UnsavedWarningComponent
				hasUnsavedChanges={hasChanges}
				changes={localAdminPref}
				submitChanges={submitPreferences}
				successMessage='updated.preferences'
				failureMessage='failed.to.submit.changes'
			/>
			<h3 className='border-bottom'>{translate('graph.settings')}</h3>
			<div>
				<p className='mt-2' style={labelStyle}>
					<FormattedMessage id='default.graph.type' />:
				</p>
				{
					Object.values(ChartTypes).map(chartType => (
						<div className='radio' key={chartType}>
							<label >
								<input
									type='radio'
									name='chartTypes'
									style={checkboxStyle}
									value={chartType}
									onChange={e => makeLocalChanges('defaultChartToRender', e.target.value)}
									checked={localAdminPref.defaultChartToRender === chartType}
								/>
								{translate(chartType)}
							</label>
						</div>
					))
				}
			</div>
			<p className='mt-2' style={labelStyle}>
				<FormattedMessage id='default.graph.settings' />:
			</p>
			<div className='checkbox'>
				<label>
					<input
						type='checkbox'
						style={checkboxStyle}
						onChange={e => makeLocalChanges('defaultBarStacking', e.target.checked)}
						checked={localAdminPref.defaultBarStacking}
					/>
					{translate('default.bar.stacking')}
				</label>
			</div>
			<div className='checkbox'>
				<label>
					<input
						type='checkbox'
						style={checkboxStyle}
						onChange={e => makeLocalChanges('defaultAreaNormalization', e.target.checked)}
						checked={localAdminPref.defaultAreaNormalization}
					/>
					{translate('default.area.normalize')}

				</label>
			</div>
			<div>
				<p className='mt-2' style={labelStyle}>
					{translate('default.area.unit')}

				</p>
				<div className='radio'>
					<label>
						<input
							type='radio'
							name='areaUnitType'
							style={checkboxStyle}
							value={AreaUnitType.feet}
							onChange={e => makeLocalChanges('defaultAreaUnit', e.target.value)}
							checked={localAdminPref.defaultAreaUnit === AreaUnitType.feet}
						/>
						{translate('AreaUnitType.feet')}
					</label>
				</div>
				<div className='radio'>
					<label>
						<input
							type='radio'
							name='areaUnitType'
							style={checkboxStyle}
							value={AreaUnitType.meters}
							onChange={e => makeLocalChanges('defaultAreaUnit', e.target.value)}
							checked={localAdminPref.defaultAreaUnit === AreaUnitType.meters}
						/>
						{translate('AreaUnitType.meters')}
					</label>
				</div>
			</div>

			<h3 className='border-bottom mt-3'>{translate('meter.settings')}</h3>
			<div>
				<p style={titleStyle}>
					{`${translate('default.meter.reading.frequency')}:`}
				</p>
				<Input
					type='text'
					value={localAdminPref.defaultMeterReadingFrequency}
					onChange={e => makeLocalChanges('defaultMeterReadingFrequency', e.target.value)}
					invalid={invalidFuncs.readingFreq()}
				/>
				<FormFeedback>
					<FormattedMessage id="invalid.input" ></FormattedMessage>
				</FormFeedback>
			</div>
			<div>
				<p className='mt-2' style={titleStyle}>
					{`${translate('default.meter.minimum.date')}:`}
				</p>
				<Input
					type='text'
					value={localAdminPref.defaultMeterMinimumDate}
					onChange={e => makeLocalChanges('defaultMeterMinimumDate', e.target.value)}
					placeholder='YYYY-MM-DD HH:MM:SS'
					invalid={invalidFuncs.minDate()}
				/>
				<FormFeedback>
					<FormattedMessage id="error.bounds" values={{ min: MIN_DATE, max: moment(localAdminPref.defaultMeterMaximumDate).utc().format() }} />
				</FormFeedback>
			</div>
			<div>
				<p className='mt-2' style={titleStyle}>
					{`${translate('default.meter.maximum.date')}:`}
				</p>
				<Input
					type='text'
					value={localAdminPref.defaultMeterMaximumDate}
					onChange={e => makeLocalChanges('defaultMeterMaximumDate', e.target.value)}
					placeholder='YYYY-MM-DD HH:MM:SS'
					invalid={invalidFuncs.maxDate()}
				/>
				<FormFeedback>
					<FormattedMessage id="error.bounds" values={{ min: moment(localAdminPref.defaultMeterMinimumDate).utc().format(), max: MAX_DATE }} />
				</FormFeedback>
			</div>
			<div>
				<p className='mt-2' style={titleStyle}>
					{`${translate('default.meter.reading.gap')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultMeterReadingGap}
					onChange={e => makeLocalChanges('defaultMeterReadingGap', e.target.value)}
					min='0'
					maxLength={50}
					invalid={invalidFuncs.readingGap()}
				/>
				<FormFeedback>
					<FormattedMessage id="error.bounds" values={{ min: 0, max: Infinity }} />
				</FormFeedback>
			</div>
			<div>
				<p className='mt-2' style={titleStyle}>
					{`${translate('default.meter.maximum.errors')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultMeterMaximumErrors}
					onChange={e => makeLocalChanges('defaultMeterMaximumErrors', e.target.value)}
					min='0'
					max={MAX_ERRORS}
					maxLength={50}
					invalid={invalidFuncs.meterErrors()}
				/>
				<FormFeedback>
					<FormattedMessage id="error.bounds" values={{ min: 0, max: MAX_ERRORS }} />
				</FormFeedback>
			</div>
			<div>
				<h3 className='border-bottom mt-3'>{translate('site.settings')}</h3>
				<div>
					<p className='mt-2' style={titleStyle}>
						{`${translate('site.title')}:`}
					</p>
					<Input
						type='text'
						placeholder={translate('name')}
						value={localAdminPref.displayTitle}
						onChange={e => makeLocalChanges('displayTitle', e.target.value)}
						maxLength={50}
					/>
				</div>
				<p className='mt-2' style={labelStyle}>
					{translate('default.language')}
				</p>
				<div className='radio'>
					<label>
						<input
							type='radio'
							style={checkboxStyle}
							name='languageTypes'
							value={LanguageTypes.en}
							onChange={e => makeLocalChanges('defaultLanguage', e.target.value)}
							checked={localAdminPref.defaultLanguage === LanguageTypes.en}
						/>
						English
					</label>
				</div>
				<div className='radio'>
					<label>
						<input
							type='radio'
							style={checkboxStyle}
							name='languageTypes'
							value={LanguageTypes.fr}
							onChange={e => makeLocalChanges('defaultLanguage', e.target.value)}
							checked={localAdminPref.defaultLanguage === LanguageTypes.fr}
						/>
						Français
					</label>
				</div>
				<div className='radio'>
					<label>
						<input
							type='radio'
							style={checkboxStyle}
							name='languageTypes'
							value={LanguageTypes.es}
							onChange={e => makeLocalChanges('defaultLanguage', e.target.value)}
							checked={localAdminPref.defaultLanguage === LanguageTypes.es}
						/>
						Español
					</label>
				</div>
			</div>
			<div>
				<p className='mt-2' style={titleStyle}>
					{`${translate('default.time.zone')}:`}
				</p>
				<TimeZoneSelect
					current={localAdminPref.defaultTimezone}
					handleClick={e => makeLocalChanges('defaultTimezone', e)} />
			</div>
			<div>
				<p className='mt-2' style={titleStyle}>
					{`${translate('default.warning.file.size')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultWarningFileSize}
					onChange={e => makeLocalChanges('defaultWarningFileSize', e.target.value)}
					min='0'
					max={Number(localAdminPref.defaultFileSizeLimit)}
					maxLength={50}
					invalid={invalidFuncs.warningFileSize()}
				/>
				<FormFeedback>
					<FormattedMessage id="error.bounds" values={{ min: 0, max: Number(localAdminPref.defaultFileSizeLimit) }} />
				</FormFeedback>
			</div>
			<div>
				<p className='mt-2' style={titleStyle}>
					{`${translate('default.file.size.limit')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultFileSizeLimit}
					onChange={e => makeLocalChanges('defaultFileSizeLimit', e.target.value)}
					min={Number(localAdminPref.defaultWarningFileSize)}
					maxLength={50}
					invalid={invalidFuncs.fileSizeLimit()}
				/>
				<FormFeedback>
					<FormattedMessage id="error.bounds" values={{ min: Number(localAdminPref.defaultWarningFileSize), max: Infinity }} />
				</FormFeedback>
			</div>
			<div>
				<p className='mt-2' style={titleStyle}>
					<FormattedMessage id='default.help.url' />:
				</p>
				<Input
					type='text'
					value={localAdminPref.defaultHelpUrl}
					onChange={e => makeLocalChanges('defaultHelpUrl', e.target.value)}
				/>
			</div>
			<div className='d-flex justify-content-end mt-3'>
				<Button
					type='button'
					onClick={discardChanges}
					disabled={!hasChanges}
					style={{ marginRight: '20px' }}
					color='secondary'
				>
					{translate('discard.changes')}
				</Button>
				<Button
					type='submit'
					onClick={() =>
						submitPreferences(localAdminPref)
							.unwrap()
							.then(() => {
								showSuccessNotification(translate('updated.preferences'));
							})
							.catch(() => {
								showErrorNotification(translate('failed.to.submit.changes'));
							})
					}
					disabled={!hasChanges || Object.values(invalidFuncs).some(check => check())}
					color='primary'
				>
					{translate('submit')}
				</Button>
			</div>
		</div >
	);
}

const titleStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0,
	paddingBottom: '5px'
};
