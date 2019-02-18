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
	UpdateDisplayTitleAction
} from '../../types/redux/admin';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import { LanguageTypes } from '../../types/i18n';

interface PreferencesProps {
	displayTitle: string;
	defaultChartToRender: ChartTypes;
	defaultBarStacking: boolean;
	defaultLanguage: LanguageTypes;
	disableSubmitPreferences: boolean;
	updateDisplayTitle(title: string): UpdateDisplayTitleAction;
	updateDefaultChartType(defaultChartToRender: ChartTypes): UpdateDefaultChartToRenderAction;
	toggleDefaultBarStacking(): ToggleDefaultBarStackingAction;
	updateDefaultLanguage(defaultLanguage: LanguageTypes): UpdateDefaultLanguageAction;
	submitPreferences(): Promise<void>;
}

type PreferencesPropsWithIntl = PreferencesProps & InjectedIntlProps;

class PreferencesComponent extends React.Component<PreferencesPropsWithIntl, {}> {
	constructor(props: PreferencesPropsWithIntl) {
		super(props);
		this.handleDisplayTitleChange = this.handleDisplayTitleChange.bind(this);
		this.handleDefaultChartToRenderChange = this.handleDefaultChartToRenderChange.bind(this);
		this.handleDefaultBarStackingChange = this.handleDefaultBarStackingChange.bind(this);
		this.handleDefaultLanguageChange = this.handleDefaultLanguageChange.bind(this);
		this.handleSubmitPreferences = this.handleSubmitPreferences.bind(this);
	}
	
	/*
	 * @returns JSX code to render components for *things*.
	 * TODO: confirm this. Also, figure out what exactly what this modifies.
	*/
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
		const messages = defineMessages({ name: {	id: 'name' }});
		const { formatMessage } = this.props.intl;
		// JSX code to return
		return (
			<div>
				<div style={bottomPaddingStyle}>
					<p style={titleStyle}>
						<FormattedMessage id='default.site.title' />:
					</p>
					<Input
						type='text'
						placeholder={formatMessage(messages.name)}
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
						<label>
							<input
								type='radio'
								name='chartTypes'
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
								value={ChartTypes.compare}
								onChange={this.handleDefaultChartToRenderChange}
								checked={this.props.defaultChartToRender === ChartTypes.compare}
							/>
							<FormattedMessage id='compare' />
						</label>
					</div>
				</div>
				<div className='checkbox'>
					<p style={labelStyle}>
						<FormattedMessage id='default.bar.stacking' />:
					</p>
					<label>
						<input
							type='checkbox'
							onChange={this.handleDefaultBarStackingChange}
							checked={this.props.defaultBarStacking}
						/>
						<FormattedMessage id='bar.stacking' />
					</label>
				</div>
				<div>
					<p style={labelStyle}>
						<FormattedMessage id='default.language' />:
					</p>
					<div className='radio'>
						<label>
							<input
								type='radio'
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
								name='languageTypes'
								value={LanguageTypes.fr}
								onChange={this.handleDefaultLanguageChange}
								checked={this.props.defaultLanguage === LanguageTypes.fr}
							/>
							Français
						</label>
					</div>
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
	
	/* Updates title desplay */
	private handleDisplayTitleChange(e: { target: HTMLInputElement; }) {
		this.props.updateDisplayTitle(e.target.value);
	}
	
	
	private handleDefaultChartToRenderChange(e: React.FormEvent<HTMLInputElement>) {
		this.props.updateDefaultChartType((e.target as HTMLInputElement).value as ChartTypes);
	}

	private handleDefaultBarStackingChange() {
		this.props.toggleDefaultBarStacking();
	}

	private handleDefaultLanguageChange(e: React.FormEvent<HTMLInputElement>) {
		this.props.updateDefaultLanguage((e.target as HTMLInputElement).value as LanguageTypes);
	}

	private handleSubmitPreferences() {
		this.props.submitPreferences();
	}
}

export default injectIntl<PreferencesProps>(PreferencesComponent);
