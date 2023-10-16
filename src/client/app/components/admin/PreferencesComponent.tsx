/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Input, Button } from 'reactstrap';
import { ChartTypes } from '../../types/redux/graph';
import {
	ToggleDefaultBarStackingAction,
	UpdateDefaultChartToRenderAction,
	UpdateDefaultLanguageAction,
	UpdateDefaultTimeZone,
	UpdateDisplayTitleAction,
	UpdateDefaultWarningFileSize,
	UpdateDefaultFileSizeLimit,
	ToggleDefaultAreaNormalizationAction,
	UpdateDefaultAreaUnitAction,
	UpdateDefaultMeterReadingFrequencyAction,
	UpdateDefaultMeterMinimumValueAction,
	UpdateDefaultMeterMaximumValueAction,
	UpdateDefaultMeterMinimumDateAction,
	UpdateDefaultMeterMaximumDateAction,
	UpdateDefaultMeterReadingGapAction,
	UpdateDefaultMeterMaximumErrorsAction,
	UpdateDefaultMeterDisableChecksAction

} from '../../types/redux/admin';
import { removeUnsavedChanges, updateUnsavedChanges } from '../../actions/unsavedWarning';
import { defineMessages, FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { LanguageTypes } from '../../types/redux/i18n';
import TimeZoneSelect from '../TimeZoneSelect';
import { store }  from '../../store';
import { fetchPreferencesIfNeeded, submitPreferences } from '../../actions/admin';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import translate from '../../utils/translate';
import { TrueFalseType } from '../../types/items';

interface PreferencesProps {
	displayTitle: string;
	defaultChartToRender: ChartTypes;
	defaultBarStacking: boolean;
	defaultAreaNormalization: boolean;
	defaultTimeZone: string;
	defaultLanguage: LanguageTypes;
	disableSubmitPreferences: boolean;
	defaultWarningFileSize: number;
	defaultFileSizeLimit: number;
	defaultAreaUnit: AreaUnitType;
	defaultMeterReadingFrequency: string;
	defaultMeterMinimumValue: number;
	defaultMeterMaximumValue: number;
	defaultMeterMinimumDate: string;
	defaultMeterMaximumDate: string;
	defaultMeterReadingGap: number;
	defaultMeterMaximumErrors: number;
	defaultMeterDisableChecks: boolean;
	updateDisplayTitle(title: string): UpdateDisplayTitleAction;
	updateDefaultChartType(defaultChartToRender: ChartTypes): UpdateDefaultChartToRenderAction;
	toggleDefaultBarStacking(): ToggleDefaultBarStackingAction;
	toggleDefaultAreaNormalization(): ToggleDefaultAreaNormalizationAction;
	updateDefaultLanguage(defaultLanguage: LanguageTypes): UpdateDefaultLanguageAction;
	submitPreferences(): Promise<void>;
	updateDefaultTimeZone(timeZone: string): UpdateDefaultTimeZone;
	updateDefaultWarningFileSize(defaultWarningFileSize: number): UpdateDefaultWarningFileSize;
	updateDefaultFileSizeLimit(defaultFileSizeLimit: number): UpdateDefaultFileSizeLimit;
	updateDefaultAreaUnit(defaultAreaUnit: AreaUnitType): UpdateDefaultAreaUnitAction;
	updateDefaultMeterReadingFrequency(defaultMeterReadingFrequency: string): UpdateDefaultMeterReadingFrequencyAction;
	updateDefaultMeterMinimumValue(defaultMeterMinimumValue : number): UpdateDefaultMeterMinimumValueAction;
	updateDefaultMeterMaximumValue(defaultMeterMaximumValue: number): UpdateDefaultMeterMaximumValueAction;
	updateDefaultMeterMinimumDate(defaultMeterMinimumDate: string): UpdateDefaultMeterMinimumDateAction;
	updateDefaultMeterMaximumDate(defaultMeterMaximumDate: string): UpdateDefaultMeterMaximumDateAction;
	updateDefaultMeterReadingGap(defaultMeterReadingGap: number): UpdateDefaultMeterReadingGapAction;
	updateDefaultMeterMaximumErrors(defaultMeterMaximumErrors: number): UpdateDefaultMeterMaximumErrorsAction;
	updateDefaultMeterDisableChecks(defaultMeterDisableChecks: boolean): UpdateDefaultMeterDisableChecksAction;
}

type PreferencesPropsWithIntl = PreferencesProps & WrappedComponentProps;

// TODO: Add warning for invalid data
class PreferencesComponent extends React.Component<PreferencesPropsWithIntl> {
	constructor(props: PreferencesPropsWithIntl) {
		super(props);
		this.handleDisplayTitleChange = this.handleDisplayTitleChange.bind(this);
		this.handleDefaultChartToRenderChange = this.handleDefaultChartToRenderChange.bind(this);
		this.handleDefaultBarStackingChange = this.handleDefaultBarStackingChange.bind(this);
		this.handleDefaultTimeZoneChange = this.handleDefaultTimeZoneChange.bind(this);
		this.handleDefaultLanguageChange = this.handleDefaultLanguageChange.bind(this);
		this.handleSubmitPreferences = this.handleSubmitPreferences.bind(this);
		this.handleDefaultWarningFileSizeChange = this.handleDefaultWarningFileSizeChange.bind(this);
		this.handleDefaultFileSizeLimitChange = this.handleDefaultFileSizeLimitChange.bind(this);
		this.handleDefaultAreaNormalizationChange = this.handleDefaultAreaNormalizationChange.bind(this);
		this.handleDefaultAreaUnitChange = this.handleDefaultAreaUnitChange.bind(this);
		this.handleDefaultMeterReadingFrequencyChange = this.handleDefaultMeterReadingFrequencyChange.bind(this);
		this.handleDefaultMeterMinimumValueChange = this.handleDefaultMeterMinimumValueChange.bind(this);
		this.handleDefaultMeterMaximumValueChange = this.handleDefaultMeterMaximumValueChange.bind(this);
		this.handleDefaultMeterMinimumDateChange = this.handleDefaultMeterMinimumDateChange.bind(this);
		this.handleDefaultMeterMaximumDateChange = this.handleDefaultMeterMaximumDateChange.bind(this);
		this.handleDefaultMeterReadingGapChange = this.handleDefaultMeterReadingGapChange.bind(this);
		this.handleDefaultMeterMaximumErrorsChange = this.handleDefaultMeterMaximumErrorsChange.bind(this);
		this.handleDefaultMeterDisableChecksChange = this.handleDefaultMeterDisableChecksChange.bind(this);
	}

	public render() {
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
		const messages = defineMessages({ name: { id: 'name' } });

		return (
			<div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.site.title' />:
					</p>
					<Input
						type='text'
						placeholder={this.props.intl.formatMessage(messages.name)}
						value={this.props.displayTitle}
						onChange={this.handleDisplayTitleChange}
						maxLength={50}
					/>
				</div>
				<div>
					<p style={labelStyle}>
						<FormattedMessage id='default.graph.type' />:
					</p>
					<div className='radio'>
						<label >
							<input
								type='radio'
								name='chartTypes'
								style={{ marginRight: '10px' }}
								value={ChartTypes.line}
								onChange={this.handleDefaultChartToRenderChange}
								checked={this.props.defaultChartToRender === ChartTypes.line}
							/>
							<FormattedMessage id='line' />
						</label>
					</div>
					<div className='radio'>
						<label>
							<input
								type='radio'
								name='chartTypes'
								style={{ marginRight: '10px' }}
								value={ChartTypes.bar}
								onChange={this.handleDefaultChartToRenderChange}
								checked={this.props.defaultChartToRender === ChartTypes.bar}
							/>
							<FormattedMessage id='bar' />
						</label>
					</div>
					<div className='radio'>
						<label>
							<input
								type='radio'
								name='chartTypes'
								style={{ marginRight: '10px' }}
								value={ChartTypes.compare}
								onChange={this.handleDefaultChartToRenderChange}
								checked={this.props.defaultChartToRender === ChartTypes.compare}
							/>
							<FormattedMessage id='compare' />
						</label>
					</div>
					<div className='radio'>
						<label>
							<input
								type='radio'
								name='chartTypes'
								style={{ marginRight: '10px' }}
								value={ChartTypes.map}
								onChange={this.handleDefaultChartToRenderChange}
								checked={this.props.defaultChartToRender === ChartTypes.map}
							/>
							<FormattedMessage id='map' />
						</label>
					</div>
				</div>
				<p style={labelStyle}>
					<FormattedMessage id='default.graph.settings' />:
				</p>
				<div className='checkbox'>
					<label>
						<input
							type='checkbox'
							style={{ marginRight: '10px' }}
							onChange={this.handleDefaultBarStackingChange}
							checked={this.props.defaultBarStacking}
						/>
						<FormattedMessage id='default.bar.stacking' />
					</label>
				</div>
				<div className='checkbox'>
					<label>
						<input
							type='checkbox'
							style={{ marginRight: '10px' }}
							onChange={this.handleDefaultAreaNormalizationChange}
							checked={this.props.defaultAreaNormalization}
						/>
						<FormattedMessage id='default.area.normalize' />
					</label>
				</div>
				<div>
					<p style={labelStyle}>
						<FormattedMessage id='default.area.unit' />:
					</p>
					<div className='radio'>
						<label>
							<input
								type='radio'
								name='areaUnitType'
								style={{ marginRight: '10px' }}
								value={AreaUnitType.feet}
								onChange={this.handleDefaultAreaUnitChange}
								checked={this.props.defaultAreaUnit === AreaUnitType.feet}
							/>
							<FormattedMessage id='AreaUnitType.feet' />
						</label>
					</div>
					<div className='radio'>
						<label>
							<input
								type='radio'
								name='areaUnitType'
								style={{ marginRight: '10px' }}
								value={AreaUnitType.meters}
								onChange={this.handleDefaultAreaUnitChange}
								checked={this.props.defaultAreaUnit === AreaUnitType.meters}
							/>
							<FormattedMessage id='AreaUnitType.meters' />
						</label>
					</div>
				</div>
				<div>
					<p style={labelStyle}>
						<FormattedMessage id='default.language' />:
					</p>
					<div className='radio'>
						<label>
							<input
								type='radio'
								style={{ marginRight: '10px' }}
								name='languageTypes'
								value={LanguageTypes.en}
								onChange={this.handleDefaultLanguageChange}
								checked={this.props.defaultLanguage === LanguageTypes.en}
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
								onChange={this.handleDefaultLanguageChange}
								checked={this.props.defaultLanguage === LanguageTypes.fr}
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
								onChange={this.handleDefaultLanguageChange}
								checked={this.props.defaultLanguage === LanguageTypes.es}
							/>
							Español
						</label>
					</div>
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.time.zone' />:
					</p>
					<TimeZoneSelect current={this.props.defaultTimeZone} handleClick={this.handleDefaultTimeZoneChange} />
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.warning.file.size' />:
					</p>
					<Input
						type='number'
						value={this.props.defaultWarningFileSize}
						onChange={this.handleDefaultWarningFileSizeChange}
						maxLength={50}
					/>
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.file.size.limit' />:
					</p>
					<Input
						type='number'
						value={this.props.defaultFileSizeLimit}
						onChange={this.handleDefaultFileSizeLimitChange}
						maxLength={50}
					/>
				</div>
				{/* Reuse same style as title. */}
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.meter.reading.frequency' />:
					</p>
					<Input
						type='text'
						value={this.props.defaultMeterReadingFrequency}
						onChange={this.handleDefaultMeterReadingFrequencyChange}
					/>
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.meter.minimum.value' />:
					</p>
					<Input
						type='number'
						value={this.props.defaultMeterMinimumValue}
						onChange={this.handleDefaultMeterMinimumValueChange}
						maxLength={50}
					/>
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.meter.maximum.value' />:
					</p>
					<Input
						type='number'
						value={this.props.defaultMeterMaximumValue}
						onChange={this.handleDefaultMeterMaximumValueChange}
						maxLength={50}
					/>
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.meter.minimum.date' />:
					</p>
					<Input
						type='text'
						value={this.props.defaultMeterMinimumDate}
						onChange={this.handleDefaultMeterMinimumDateChange}
						placeholder='YYYY-MM-DD HH:MM:SS'
					/>
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.meter.maximum.date' />:
					</p>
					<Input
						type='text'
						value={this.props.defaultMeterMaximumDate}
						onChange={this.handleDefaultMeterMaximumDateChange}
						placeholder='YYYY-MM-DD HH:MM:SS'
					/>
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.meter.reading.gap' />:
					</p>
					<Input
						type='number'
						value={this.props.defaultMeterReadingGap}
						onChange={this.handleDefaultMeterReadingGapChange}
						maxLength={50}
					/>
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.meter.maximum.errors' />:
					</p>
					<Input
						type='number'
						value={this.props.defaultMeterMaximumErrors}
						onChange={this.handleDefaultMeterMaximumErrorsChange}
						maxLength={50}
					/>
				</div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.meter.disable.checks' />:
					</p>
					<Input
						type='select'
						value={this.props.defaultMeterDisableChecks?.toString()}
						onChange={this.handleDefaultMeterDisableChecksChange}>
						{Object.keys(TrueFalseType).map(key => {
							return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
						})}
					</Input>
				</div>
				<Button
					type='submit'
					onClick={this.handleSubmitPreferences}
					disabled={this.props.disableSubmitPreferences}
				>
					<FormattedMessage id='submit' />
				</Button>
			</div>
		);
	}

	private removeUnsavedChangesFunction(callback: () => void) {
		// The function is called to reset all the inputs to the initial state
		store.dispatch<any>(fetchPreferencesIfNeeded()).then(callback);
	}

	private submitUnsavedChangesFunction(successCallback: () => void, failureCallback: () => void) {
		// The function is called to submit the unsaved changes
		store.dispatch<any>(submitPreferences()).then(successCallback, failureCallback);
	}

	private updateUnsavedChanges() {
		// Notify that there are unsaved changes
		store.dispatch(updateUnsavedChanges(this.removeUnsavedChangesFunction, this.submitUnsavedChangesFunction));
	}

	private removeUnsavedChanges() {
		// Notify that there are no unsaved changes
		store.dispatch(removeUnsavedChanges());
	}

	private handleDisplayTitleChange(e: { target: HTMLInputElement; }) {
		this.props.updateDisplayTitle(e.target.value);
		this.updateUnsavedChanges();
	}

	private handleDefaultChartToRenderChange(e: React.FormEvent<HTMLInputElement>) {
		this.props.updateDefaultChartType((e.target as HTMLInputElement).value as ChartTypes);
		this.updateUnsavedChanges();
	}

	private handleDefaultBarStackingChange() {
		this.props.toggleDefaultBarStacking();
		this.updateUnsavedChanges();
	}

	private handleDefaultAreaNormalizationChange() {
		this.props.toggleDefaultAreaNormalization();
		this.updateUnsavedChanges();
	}

	private handleDefaultAreaUnitChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultAreaUnit(e.target.value as AreaUnitType);
		this.updateUnsavedChanges();
	}

	private handleDefaultLanguageChange(e: React.FormEvent<HTMLInputElement>) {
		this.props.updateDefaultLanguage((e.target as HTMLInputElement).value as LanguageTypes);
		this.updateUnsavedChanges();
	}

	private handleDefaultTimeZoneChange(value: string) {
		this.props.updateDefaultTimeZone(value);
		this.updateUnsavedChanges();
	}

	private handleSubmitPreferences() {
		this.props.submitPreferences();
		this.removeUnsavedChanges();
	}

	private handleDefaultWarningFileSizeChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultWarningFileSize(parseFloat(e.target.value));
		this.updateUnsavedChanges();
	}

	private handleDefaultFileSizeLimitChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultFileSizeLimit(parseFloat(e.target.value));
		this.updateUnsavedChanges();
	}

	private handleDefaultMeterReadingFrequencyChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultMeterReadingFrequency(e.target.value);
		this.updateUnsavedChanges();
	}

	private handleDefaultMeterMinimumValueChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultMeterMinimumValue(parseFloat(e.target.value));
		this.updateUnsavedChanges();
	}

	private handleDefaultMeterMaximumValueChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultMeterMaximumValue(parseFloat(e.target.value));
		this.updateUnsavedChanges();
	}

	private handleDefaultMeterMinimumDateChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultMeterMinimumDate(e.target.value);
		this.updateUnsavedChanges();
	}

	private handleDefaultMeterMaximumDateChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultMeterMaximumDate(e.target.value);
		this.updateUnsavedChanges();
	}

	private handleDefaultMeterReadingGapChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultMeterReadingGap(parseFloat(e.target.value));
		this.updateUnsavedChanges();
	}

	private handleDefaultMeterMaximumErrorsChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultMeterMaximumErrors(parseInt(e.target.value));
		this.updateUnsavedChanges();
	}

	private handleDefaultMeterDisableChecksChange(e: { target: HTMLInputElement; }) {
		this.props.updateDefaultMeterDisableChecks(JSON.parse(e.target.value))
		this.updateUnsavedChanges();
	}

}

export default injectIntl(PreferencesComponent);
