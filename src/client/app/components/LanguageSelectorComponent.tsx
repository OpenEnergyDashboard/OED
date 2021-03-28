/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

import { LanguageTypes } from '../types/redux/i18n';
import { UpdateDefaultLanguageAction } from '../types/redux/admin';
import { FormattedMessage } from 'react-intl';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import Dropdown from 'reactstrap/lib/Dropdown';
import DropdownItem from 'reactstrap/lib/DropdownItem';
import DropdownToggle from 'reactstrap/lib/DropdownToggle';
import DropdownMenu from 'reactstrap/lib/DropdownMenu';

interface LanguageSelectProps {
	selectedLanguage: LanguageTypes;
	changeLanguage(languageType: LanguageTypes): UpdateDefaultLanguageAction;
}

interface DropdownState {
	dropdownOpen: boolean;
	compareSortingDropdownOpen: boolean;
}

/**
 * A component that allows users to select which language the page should be displayed in.
 */
export default class LanguageSelectorComponent extends React.Component<LanguageSelectProps, DropdownState, {}> {
	constructor(props: LanguageSelectProps) {
		super(props);
		this.handleChangeLanguage = this.handleChangeLanguage.bind(this);
		this.toggleDropdown = this.toggleDropdown.bind(this);
		this.state = {
			dropdownOpen: false,
			compareSortingDropdownOpen: false
		};
	}

	public render() {
		const divBottomPadding: React.CSSProperties = {
			paddingBottom: '15px'
		};

		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};

		return (
			<div style={divBottomPadding}>
				<p style={labelStyle}>
					<FormattedMessage id='language' />:
				</p>
				<Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
					<DropdownToggle outline caret>
						<FormattedMessage id='language.select' />
					</DropdownToggle>
					<DropdownMenu>
						<DropdownItem
							outline={this.props.selectedLanguage !== LanguageTypes.en}
							onClick={() => this.handleChangeLanguage(LanguageTypes.en)}
						>
							English
						</DropdownItem>
						<DropdownItem
							outline={this.props.selectedLanguage !== LanguageTypes.fr}
							onClick={() => this.handleChangeLanguage(LanguageTypes.fr)}
						>
							Français
						</DropdownItem>
						<DropdownItem
							outline={this.props.selectedLanguage !== LanguageTypes.es}
							onClick={() => this.handleChangeLanguage(LanguageTypes.es)}
						>
							Español
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
				<div>
					<TooltipMarkerComponent page='home' helpTextId='help.home.language'/>
				</div>
			</div>
		);
	}

	private handleChangeLanguage(value: LanguageTypes) {
		this.props.changeLanguage(value);
	}

	private toggleDropdown() {
		this.setState(prevState => ({dropdownOpen: !prevState.dropdownOpen}));
	}
}