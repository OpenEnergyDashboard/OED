/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { defineMessages, injectIntl, intlShape, FormattedMessage } from 'react-intl';
import { FormControl, Button, ButtonToolbar, DropdownButton, MenuItem } from 'react-bootstrap';
import { chartTypes } from '../reducers/graph';
import HeaderContainer from '../containers/HeaderContainer';
import FooterComponent from '../components/FooterComponent';

class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleDisplayTitleChange = this.handleDisplayTitleChange.bind(this);
		this.handleDefaultChartToRenderChange = this.handleDefaultChartToRenderChange.bind(this);
		this.handleDefaultBarStackingChange = this.handleDefaultBarStackingChange.bind(this);
		this.handleSubmitPreferences = this.handleSubmitPreferences.bind(this);
		this.handleSelectedLanguage = this.handleSelectedLanguage.bind(this);
	}

	handleSelectedLanguage(language) {
		this.props.updateDefaultLanguage(language);
	}

	handleDisplayTitleChange(e) {
		this.props.updateDisplayTitle(e.target.value);
	}

	handleDefaultChartToRenderChange(e) {
		this.props.updateDefaultGraphType(e.target.value);
	}

	handleDefaultBarStackingChange() {
		this.props.toggleDefaultBarStacking();
	}

	handleSubmitPreferences() {
		this.props.submitPreferences();
	}

	render() {
		const labelStyle = {
			fontWeight: 'bold',
			margin: 0,
		};
		const bottomPaddingStyle = {
			paddingBottom: '15px'
		};
		const titleStyle = {
			fontWeight: 'bold',
			margin: 0,
			paddingBottom: '5px'
		};
		const messages = defineMessages({
			name: {
				id: 'name',
				defaultMessage: 'Name'
			},
			lang: {
				id: 'choose.language',
				defaultMessage: 'Choose a Language'
			},
			language: {
				id: 'language',
				defaultMessage: 'Language'
			}
		});
		const { formatMessage } = this.props.intl;
		return (
			<div>
				<HeaderContainer />
				<div className="container-fluid">
					<div className="col-xs-3">
						<div style={bottomPaddingStyle}>
							<p style={titleStyle}><FormattedMessage
								id="site.title"
								defaultMessage="Default Site Title:"
							/></p>
							<FormControl type="text" placeholder={formatMessage(messages.name)} value={this.props.displayTitle} onChange={this.handleDisplayTitleChange} maxLength={50} />
						</div>
						<div>
							<p style={labelStyle}><FormattedMessage
								id="default.graph.type"
								defaultMessage="Default Graph Type:"
							/></p>
							<div className="radio">
								<label>
									<input
										type="radio"
										name="chartTypes"
										value={chartTypes.line}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === chartTypes.line}
									/>
									<FormattedMessage
										id="line"
										defaultMessage="Line"
									/>
								</label>
							</div>
							<div className="radio">
								<label>
									<input
										type="radio"
										name="chartTypes"
										value={chartTypes.bar}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === chartTypes.bar}
									/>
									<FormattedMessage
										id="bar"
										defaultMessage="Bar"
									/>
								</label>
							</div>
							<div className="radio">
								<label>
									<input
										type="radio"
										name="chartTypes"
										value={chartTypes.compare}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === chartTypes.compare}
									/>
									<FormattedMessage
										id="compare"
										defaultMessage="Compare"
									/>
								</label>
							</div>
						</div>
						<div className="checkbox">
							<label><input type="checkbox" onChange={this.handleDefaultBarStackingChange} checked={this.props.defaultBarStacking} /><FormattedMessage
								id="default.bar.stacking"
								defaultMessage="Default Bar Stacking"
							/></label>
						</div>
						<div style={bottomPaddingStyle}>
							<ButtonToolbar>
								<DropdownButton title={formatMessage(messages.language)} id="dropdown-language">
									<MenuItem eventKey="en" onSelect={this.handleSelectedLanguage}>English</MenuItem>
									<MenuItem eventKey="fr" onSelect={this.handleSelectedLanguage} >French</MenuItem>
								</DropdownButton>
							</ButtonToolbar>
						</div>
						<Button type="submit" onClick={this.handleSubmitPreferences} disabled={this.props.disableSubmitPreferences}><FormattedMessage
							id="submit"
							defaultMessage="Submit"
						/></Button>
					</div>
				</div>
				<FooterComponent />
			</div>
		);
	}
}
AdminComponent.propTypes = {
	intl: intlShape.isRequired
};

export default injectIntl(AdminComponent);
