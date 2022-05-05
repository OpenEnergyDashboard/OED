/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Conversion, ConversionBidirectional } from '../../types/items';
import { Button } from 'reactstrap';
import {  FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import { Card} from 'react-bootstrap';
import ConversionEditDetailContainer from '../../containers/conversions/ConversionEditDetailContainer';

// TODO: implement tooltips
// TODO: implement unsaved warnings
interface ConversionViewProps {
	conversion: Conversion;
	isEdited: boolean;
	isSubmitting: boolean;
	loggedInAsAdmin: boolean;
	//actions for removing a conversion
	//functions used to dispatch the edit actions
	removeConversion(conversion: Conversion): any;
	editConversionDetails(conversion: Conversion): any;
	log(level: string, message: string): any;
}

interface ConversionViewState {
	show: boolean,
	onHide: boolean

}

 type ConversionViewPropsWithIntl = ConversionViewProps & WrappedComponentProps;

class ConversionViewComponent extends React.Component<ConversionViewPropsWithIntl, ConversionViewState> {
	constructor(props: ConversionViewPropsWithIntl) {
		super(props);
		this.state = {
			show: false,
			onHide: true
		};
		this.handleClose
	}

	handleShow = () => {
		this.setState({ show: true });
	}

	handleClose = () => {
		this.setState({ show: false });
	}

	public render(){
		const cardStyle: React.CSSProperties = {
			width: '20%',
			margin: '5px 5px 5px 5px',
			textAlign: 'center'
		};
		const bidirectional = this.props.conversion.bidirectional;
		let trueBidirectional: boolean;
		if (bidirectional == ConversionBidirectional.FALSE || !bidirectional){
			trueBidirectional = false;
		} else {
			trueBidirectional = true;
		}
		function arrow() {
			if (trueBidirectional) {
				return ('<->');
			} else {
				return ('->');
			}
		}

		return (
			<Card key= {this.props.conversion.note} style={cardStyle}>
				<Card.Title style={{ backgroundColor: 'aquamarine'}}>
					{this.props.conversion.sourceId} {arrow()} {this.props.conversion.destinationId}
				</Card.Title>
				<Card.Text>
					<FormattedMessage id='conversion.bidirectional'/>: {String(this.props.conversion.bidirectional)}
				</Card.Text>
				<Card.Text>
					<FormattedMessage id='conversion.slope'/>: {this.props.conversion.slope}
				</Card.Text>
				<Card.Text>
					<FormattedMessage id='conversion.intercept'/>: {this.props.conversion.intercept}
				</Card.Text>
				<Card.Footer>
					<Button onClick={this.handleShow}> <FormattedMessage id='conversion.edit'/> </Button>
					<ConversionEditDetailContainer conversion= {this.props.conversion} show= {this.state.show} onHide = {this.handleClose} />
				</Card.Footer>
			</Card>
		)
	}
}
export default injectIntl(ConversionViewComponent);