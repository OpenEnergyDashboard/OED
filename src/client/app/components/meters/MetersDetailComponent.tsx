/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Table } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import MeterViewContainer from '../../containers/meters/MeterViewContainer';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterComponent from '../FooterComponent';

interface MetersDetailProps {
	meters: number[];
	fetchMetersDetailsIfNeeded(): Promise<any>;
}

export default class MetersDetailComponent extends React.Component<MetersDetailProps, {}> {
	public componentWillMount() {
		this.props.fetchMetersDetailsIfNeeded();
	}

	public render() {
		const flexContainerStyle = {
			display: 'flex',
			flexFlow: 'row wrap'
		};
		const flexChildStyle = {
			marginRight: '10px'
		};
		const titleStyle: React.CSSProperties = {
			textAlign: 'center'
		};
		const tableStyle: React.CSSProperties = {
			marginLeft: '10%',
			marginRight: '10%'
		};
		return (
			<div>
				<HeaderContainer />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='meters' />
					</h2>
					<div style={tableStyle}>
					<Table striped bordered hover>
					<thead>
						<tr>
						<th> <FormattedMessage id='meter.id' /> </th>
						<th> <FormattedMessage id='meter.name' /> </th>
						<th> <FormattedMessage id='meter.type' /> </th>
						<th> <FormattedMessage id='meter.ip'/> </th>
						<th> <FormattedMessage id='meter.enabled' /> </th>
						<th> <FormattedMessage id='meter.displayable' /> </th>
						</tr>
					</thead>
					{ this.props.meters.map(meterID =>
						( <MeterViewContainer key={meterID} id={meterID} /> ))}
					</Table>
					</div>
				</div>
				<FooterComponent />
			</div>
		);
	}
}
