/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
 import * as React from 'react';
 import { Conversion } from '../../types/items';
 import { Button } from 'reactstrap';
 //import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
 //import TooltipMarkerComponent from '../TooltipMarkerComponent';
 import {  injectIntl, WrappedComponentProps } from 'react-intl';
 //import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
 //import { updateUnsavedChanges, removeUnsavedChanges } from '../../actions/unsavedWarning';
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
            textAlign: 'center',
        };

        return (
            

            <Card key= {this.props.conversion.note} style={cardStyle}>
                <Card.Title style={{ margin: '5px 0px 5px 0px'}}>
                    <span style={{ padding: '0px 0px 5px 0px'}}>
                        Source: {this.props.conversion.sourceId} <br/>
                    </span>
                    <span>
                        Destination: {this.props.conversion.destinationId}
                    </span>
                </Card.Title>
                <Card.Text>
                    Bidirectional: {String(this.props.conversion.bidirectional)}
                </Card.Text>
                <Card.Text>
                    Slope: {this.props.conversion.slope}
                </Card.Text>
                <Card.Text>
                    Intercept: {this.props.conversion.intercept}
                </Card.Text>
                <Card.Text>
                    Note: {this.props.conversion.note}
                </Card.Text>
                <Button onClick={this.handleShow}> Edit Conversion </Button>
                <ConversionEditDetailContainer conversion= {this.props.conversion} show= {this.state.show} onHide = {this.handleClose} />
            </Card>
            
        )
     }
 }
 export default injectIntl(ConversionViewComponent);