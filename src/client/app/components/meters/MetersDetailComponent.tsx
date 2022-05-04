/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
// import { Table, Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import MeterViewContainer from '../../containers/meters/MeterViewContainer';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import store from '../../index';

interface MetersDetailProps {
	loggedInAsAdmin: boolean;
	meters: number[];
	unsavedChanges: boolean;
	fetchMetersDetails(): Promise<any>;
	submitEditedMeters(): Promise<any>;
}

export default class MetersDetailComponent extends React.Component<MetersDetailProps> {
	constructor(props: MetersDetailProps) {
		super(props);
		this.handleSubmitClicked = this.handleSubmitClicked.bind(this);
	}

	public componentDidMount() {
		this.props.fetchMetersDetails();
	}

	public render() {
		const loggedInAsAdmin = this.props.loggedInAsAdmin;

		const titleStyle: React.CSSProperties = {
			textAlign: 'center'
		};

		const tooltipStyle = {
			display: 'inline',
			fontSize: '50%',
			tooltipMeterView: loggedInAsAdmin ? 'help.admin.meterview' : 'help.meters.meterview'
		};

		return (
			<div>
				<UnsavedWarningContainer />
				<HeaderContainer />
				<TooltipHelpContainer page='meters' />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='meters' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='meters' helpTextId={tooltipStyle.tooltipMeterView} />
						</div>
					</h2>
					<div className="card-container">
						{this.props.meters.map(meterID =>
							(<MeterViewContainer key={meterID} id={meterID} show={false} onHide={false} onSubmitClicked={this.handleSubmitClicked} />))}
					</div>
				</div>
				<FooterContainer />
			</div>
		);
	}

	private removeUnsavedChanges() {
		store.dispatch(removeUnsavedChanges());
	}

	private handleSubmitClicked() {
		this.props.submitEditedMeters();
		// Notify that the unsaved changes have been submitted
		this.removeUnsavedChanges();
	}
}
