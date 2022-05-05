/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Conversion } from '../../types/items';
import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { FormattedMessage } from 'react-intl';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import HeaderContainer from '../../containers/HeaderContainer';
import ConversionViewContainer from '../../containers/conversions/ConversionViewContainer';
import { Card, Row } from 'react-bootstrap';
import CreateConversionContainer from '../../containers/conversions/CreateConversionContainer';

interface ConversionDetailProps {
	loggedInAsAdmin: boolean;
	conversions: Conversion[];
	unsavedChanges: boolean;
	fetchConversionDetails(): any;
	submitConversionsEdits(): any;
	createConversion(sourceId: number,
		destinationId: number,
		bidirectional: boolean,
		slope: number,
		intercept: number,
		note: string): any;
}

class ConversionDetailComponent extends React.Component<ConversionDetailProps, unknown> {
	constructor(props: ConversionDetailProps) {
		super(props);
	}

	public componentDidMount() {
		this.props.fetchConversionDetails();
	}

	public render() {
		const loggedInAsAdmin = this.props.loggedInAsAdmin;
		const titleStyle: React.CSSProperties = {
			textAlign: 'center'
		};

		const tooltipStyle = {
			display: 'inline',
			fontSize: '50%',
			tooltipConversionView: loggedInAsAdmin? 'help.admin.conversions' : 'help.conversions.conversionview'
		};

		const tableStyle: React.CSSProperties = {
			marginLeft: '10%',
			marginRight: '10%'
		};

		const cardStyle: React.CSSProperties = {
			width: '20%',
			margin: '5px 5px 5px 5px',
			textAlign: 'center'
		};


		return (
			<div>
				<UnsavedWarningContainer />
				<HeaderContainer />
				<TooltipHelpContainerAlternative page='converions' />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='conversions.title.main' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='conversions' helpTextId={tooltipStyle.tooltipConversionView}/>
						</div>
					</h2>
					<div style={tableStyle}>
						<Row xs={1} sm={3} md={4} lg={5} xl={5} className="g-4" style={{ justifyContent: 'center' }}>
							<Card style={cardStyle} className='align-items-center justify-content-center'>
								<CreateConversionContainer createConversion={this.props.createConversion} conversions={this.props.conversions}/>
							</Card>
							{this.props.conversions.map(
								conversion => ( <ConversionViewContainer key={conversion.sourceId+conversion.note+conversion.destinationId} conversion={conversion} />)
							)}
						</Row>
					</div>


				</div>
			</div>
		)
	}
} export default ConversionDetailComponent;
