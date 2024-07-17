/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { cloneDeep, isEqual } from 'lodash';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Input } from 'reactstrap';
import { UnsavedWarningComponent } from '../UnsavedWarningComponent';
import { preferencesApi } from '../../redux/api/preferencesApi';
import { PreferenceRequestItem, TrueFalseType } from '../../types/items';
import { ChartTypes } from '../../types/redux/graph';
import { LanguageTypes } from '../../types/redux/i18n';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import TimeZoneSelect from '../TimeZoneSelect';
import { defaultAdminState } from '../../redux/slices/adminSlice';


// TODO: Add warning for invalid data
/**
 * @returns Preferences Component for Administrative use
 */
export default function PreferencesComponent() {
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

	return (
		<div>
			<UnsavedWarningComponent
				hasUnsavedChanges={hasChanges}
				changes={localAdminPref}
				submitChanges={submitPreferences}
				successMessage='updated.preferences'
				failureMessage='failed.to.submit.changes'
			/>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.site.title')}:`}
				</p>
				<Input
					type='text'
					placeholder={translate('name')}
					value={localAdminPref.displayTitle}
					onChange={e => makeLocalChanges('displayTitle', e.target.value)}
					maxLength={50}
				/>
			</div>
			<div>
				<p style={labelStyle}>
					<FormattedMessage id='default.graph.type' />:
				</p>
				{
					Object.values(ChartTypes).map(chartType => (
						<div className='radio' key={chartType}>
							<label >
								<input
									type='radio'
									name='chartTypes'
									style={{ marginRight: '10px' }}
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
			<p style={labelStyle}>
				<FormattedMessage id='default.graph.settings' />:
			</p>
			<div className='checkbox'>
				<label>
					<input
						type='checkbox'
						style={{ marginRight: '10px' }}
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
						style={{ marginRight: '10px' }}
						onChange={e => makeLocalChanges('defaultAreaNormalization', e.target.checked)}
						checked={localAdminPref.defaultAreaNormalization}
					/>
					{translate('default.area.normalize')}

				</label>
			</div>
			<div>
				<p style={labelStyle}>
					{translate('default.area.unit')}

				</p>
				<div className='radio'>
					<label>
						<input
							type='radio'
							name='areaUnitType'
							style={{ marginRight: '10px' }}
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
							style={{ marginRight: '10px' }}
							value={AreaUnitType.meters}
							onChange={e => makeLocalChanges('defaultAreaUnit', e.target.value)}
							checked={localAdminPref.defaultAreaUnit === AreaUnitType.meters}
						/>
						{translate('AreaUnitType.meters')}
					</label>
				</div>
			</div>
			<div>
				<p style={labelStyle}>
					{translate('default.language')}
				</p>
				<div className='radio'>
					<label>
						<input
							type='radio'
							style={{ marginRight: '10px' }}
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
							style={{ marginRight: '10px' }}
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
							style={{ marginRight: '10px' }}
							name='languageTypes'
							value={LanguageTypes.es}
							onChange={e => makeLocalChanges('defaultLanguage', e.target.value)}
							checked={localAdminPref.defaultLanguage === LanguageTypes.es}
						/>
						Español
					</label>
				</div>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.time.zone')}:`}
				</p>
				<TimeZoneSelect
					current={localAdminPref.defaultTimezone}
					handleClick={e => makeLocalChanges('defaultTimezone', e)} />
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.warning.file.size')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultWarningFileSize}
					onChange={e => makeLocalChanges('defaultWarningFileSize', e.target.value)}
					maxLength={50}
				/>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.file.size.limit')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultFileSizeLimit}
					onChange={e => makeLocalChanges('defaultFileSizeLimit', e.target.value)}
					maxLength={50}
				/>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.meter.reading.frequency')}:`}
				</p>
				<Input
					type='text'
					value={localAdminPref.defaultMeterReadingFrequency}
					onChange={e => makeLocalChanges('defaultMeterReadingFrequency', e.target.value)}
				/>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.meter.minimum.value')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultMeterMinimumValue}
					onChange={e => makeLocalChanges('defaultMeterMinimumValue', e.target.value)}
					maxLength={50}
				/>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.meter.maximum.value')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultMeterMaximumValue}
					onChange={e => makeLocalChanges('defaultMeterMaximumValue', e.target.value)}
					maxLength={50}
				/>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.meter.minimum.date')}:`}
				</p>
				<Input
					type='text'
					value={localAdminPref.defaultMeterMinimumDate}
					onChange={e => makeLocalChanges('defaultMeterMinimumDate', e.target.value)}
					placeholder='YYYY-MM-DD HH:MM:SS'
				/>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.meter.maximum.date')}:`}
				</p>
				<Input
					type='text'
					value={localAdminPref.defaultMeterMaximumDate}
					onChange={e => makeLocalChanges('defaultMeterMaximumDate', e.target.value)}
					placeholder='YYYY-MM-DD HH:MM:SS'
				/>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.meter.reading.gap')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultMeterReadingGap}
					onChange={e => makeLocalChanges('defaultMeterReadingGap', e.target.value)}
					maxLength={50}
				/>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.meter.maximum.errors')}:`}
				</p>
				<Input
					type='number'
					value={localAdminPref.defaultMeterMaximumErrors}
					onChange={e => makeLocalChanges('defaultMeterMaximumErrors', e.target.value)}
					maxLength={50}
				/>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					{`${translate('default.meter.disable.checks')}:`}
				</p>
				<Input
					type='select'
					value={localAdminPref.defaultMeterDisableChecks?.toString()}
					onChange={e => makeLocalChanges('defaultMeterDisableChecks', e.target.value)}>
					{Object.keys(TrueFalseType).map(key => {
						return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
					})}
				</Input>
			</div>
			<div style={bottomPaddingStyle}>
				<p style={titleStyle}>
					<FormattedMessage id='default.help.url' />:
				</p>
				<Input
					type='text'
					value={localAdminPref.defaultHelpUrl}
					onChange={e => makeLocalChanges('defaultHelpUrl', e.target.value)}
				/>
			</div>
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
				disabled={!hasChanges}
			>
				{translate('submit')}
			</Button>
		</div >
	);
}

const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};
const bottomPaddingStyle: React.CSSProperties = {
	paddingBottom: '15px'
};

const titleStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0,
	paddingBottom: '5px'
};
