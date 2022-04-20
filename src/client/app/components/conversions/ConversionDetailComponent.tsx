/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
 import * as React from 'react';
 import { Conversion, ConversionBidirectional } from '../../types/items';
 import { Button, Input } from 'reactstrap';
 import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
 import TooltipMarkerComponent from '../TooltipMarkerComponent';
 import { FormattedMessage } from 'react-intl';
 import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
 import HeaderContainer from '../../containers/HeaderContainer';
 import ConversionViewContainer from '../../containers/conversions/ConversionViewContainer';
 import { updateUnsavedChanges, removeUnsavedChanges } from '../../actions/unsavedWarning';
 import store from '../../index'
 import { Card, Row, Modal } from 'react-bootstrap'
 import { useState } from "react";
import ConversionViewComponent from './ConversionViewComponent';
import { title } from 'process';

 interface ConversionDetailProps {
     loggedInAsAdmin: boolean;
     conversions: Conversion[];
     unsavedChanges: boolean;
     fetchConversionDetails(): Promise<any>;
     submitConversionsEdits(): Promise<any>;
 }

 class ConversionDetailComponent extends React.Component<ConversionDetailProps, {}> {
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
			tooltipMeterView: loggedInAsAdmin? 'help.admin.meterview' : 'help.meters.meterview'
		};
        
        const tableStyle: React.CSSProperties = {
            marginLeft: '10%',
            marginRight: '10%'
        };

        const cardStyle: React.CSSProperties = {
            width: '20%',
            margin: '5px 5px 5px 5px',
            textAlign: 'center',
        };


        return (
            <div>
                <UnsavedWarningContainer />
			    <HeaderContainer />
                <TooltipHelpContainerAlternative page='converions' />
                <div className='container-fluid'>
                    <h2 style={titleStyle}>
                        <FormattedMessage id='conversions' />
                        <div style={tooltipStyle}>
                            <TooltipMarkerComponent page='conversions' helpTextId={tooltipStyle.tooltipMeterView}></TooltipMarkerComponent>
                        </div>
                    </h2>
                    <div style={tableStyle}>
                        <Row xs={1} sm={3} md={4} lg={5} xl={5} className="g-4" style={{ justifyContent: 'center' }}>
                            <Card style={cardStyle} className='align-items-center justify-content-center'>
                                <Button style={{ backgroundColor: 'blue', margin: '0px 5px 5px 5px'}}>
                                    Create New Conversion
                                </Button>
                            </Card>
                            {this.props.conversions.map(
                                conversion => ( <ConversionViewContainer conversion={conversion} />)
                            )}
                        </Row>
                    </div>
                    

                </div>
            </div>
        )
     }
 } export default ConversionDetailComponent;
