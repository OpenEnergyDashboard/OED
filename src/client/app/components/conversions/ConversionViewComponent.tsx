/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
 import * as React from 'react';
 import { Conversion, ConversionBidirectional } from '../../types/items';
 import { Button, Input } from 'reactstrap';
 import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
 import TooltipMarkerComponent from '../TooltipMarkerComponent';
 import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
 import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
 import { updateUnsavedChanges, removeUnsavedChanges } from '../../actions/unsavedWarning';
 import store from '../../index'
 import { Card, Row, Modal } from 'react-bootstrap'
 import { useState } from "react";
import { EditConversionDetailsAction } from '../../types/redux/conversions';

 
 interface ConversionViewProps {
     conversion: Conversion;
     isEdited: boolean;
     isSubmitting: boolean;
     loggedInAsAdmin: boolean;
     //functions used to dispatch the edit actions
     editConversionDetails(conversion: Conversion): EditConversionDetailsAction;
     log(level: string, message: string): any;
 }

 interface ConversionViewState {

 }

 type ConversionViewPropsWithIntl = ConversionViewProps & WrappedComponentProps;

 class ConversionViewComponent extends React.Component<ConversionViewPropsWithIntl, ConversionViewState> {
     constructor(props: ConversionViewPropsWithIntl) {
         super(props);
     }

     public render(){
        const cardStyle: React.CSSProperties = {
            width: '20%',
            margin: '5px 5px 5px 5px',
            textAlign: 'center',
        };

        const tableStyle: React.CSSProperties = {
            marginLeft: '10%',
            marginRight: '10%'
        };

        return (
            

            <Card style={cardStyle}>
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
                <Button> Placer </Button>
            </Card>
            
        )
     }
 }
 export default injectIntl(ConversionViewComponent);