/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
 import * as React from 'react';
 import { Conversion, ConversionBidirectional } from '../../types/items';
 import { Alert, Button, Input } from 'reactstrap';
 import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
 import TooltipMarkerComponent from '../TooltipMarkerComponent';
 import { FormattedMessage } from 'react-intl';
 import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
 import { updateUnsavedChanges, removeUnsavedChanges } from '../../actions/unsavedWarning';
 import store from '../../index'
 
 interface CreateConversionsComponentProps {
    sourceId: string;
    destinationId: string;
    bidirectional: ConversionBidirectional;
    slope: number;
    intercept: number;
    note: string;
    submittedOnce: boolean;
    handleSourceIdChange: (val: string) => void;
    handleDestinationIdChange: (val: string) => void;
	handleBidirectionalChange: (val: ConversionBidirectional) => void;
	handleSlopeChange: (val: number) => void;
	handleInterceptChange: (val: number) => void;
    handleNoteChange: (val: string) => void;
	submitNewConversion: () => void;
    // sourceId:string, destinationId: string, bidirectional:ConversionBidirectional, slope:number, intercept:number, note:string
 }
 
 //source_id, dest_id, bidirection, slope, intercept, note
 
 function CreateConversionFormComponent(props: CreateConversionsComponentProps) {
     
 
    //  const removeUnsavedChangesFunction = (callback: () => void) => {
    //  	// This function is called to reset all the inputs to the initial state
    //  	// Do not need to do anything since unsaved changes will be removed after leaving this page
    //  	callback();
    //  }
 
    //  const submitUnsavedChangesFunction = (successCallback: () => void, failureCallback: () => void) => {
    //  	// This function is called to submit the unsaved changes
    //  	props.submitConversionEdits().then(successCallback, failureCallback);
    //  }
 
 
    //  const addUnsavedChanges = () => {
    //  	// Notify that there are unsaved changes
    //  	store.dispatch(updateUnsavedChanges(removeUnsavedChangesFunction, submitUnsavedChangesFunction));
    //  }
 
    //  const clearUnsavedChanges = () => {
    //  	// Notify that there are no unsaved changes
    //  	store.dispatch(removeUnsavedChanges());
    //  }
 
     const formInputStyle: React.CSSProperties = {
		paddingBottom: '5px'
	}
     
     const titleStyle: React.CSSProperties = {
         textAlign: 'center'
     };
 
     const tableStyle: React.CSSProperties = {
         marginLeft: '10%',
         marginRight: '10%'
     };
 
     // const buttonsStyle: React.CSSProperties = {
     //     display: 'flex',
     //     justifyContent: 'space-between'
     // };
 
     const tooltipStyle = {
         display: 'inline-block',
         fontSize: '50%'
     };
 
     return (
         <div>
             <UnsavedWarningContainer />
             <TooltipHelpContainerAlternative page='users' />
             <div className='container-fluid'>
                <h2 style={titleStyle}>
                    <FormattedMessage id='Conversions'/>
                    <div style={tooltipStyle}>
                        <TooltipMarkerComponent page='users' helpTextId='help.admin.conversions' />
                    </div>
                </h2>
                <div style={tableStyle}>
                    <form onSubmit={e => { e.preventDefault(); props.submitNewConversion(); }}>

                        <div style={formInputStyle}>
                            <label> <FormattedMessage id='source.id'/> </label><br />
                            {/* <Input type='email' onChange={({ target }) => props.handleSourceIdChange(target.value)} required value={props.email} /> */}
                        </div>

                        <div style={formInputStyle}>
                            <label> <FormattedMessage id='destination.id'/> </label><br />
                            {/* <Input type='email' onChange={({ target }) => props.handleDestinationIdChange(target.value)} required value={props.email} /> */}
                        </div>

                        <div style={formInputStyle}>
                            <label> <FormattedMessage id='bidirectional'/> </label><br />
                            {/* <Input type='select' onChange={({ target }) => props.handleBidirectionalChange(target.value as ConversionBidirectional)} value={props.bidirectional}>
                                {Object.entries().map(([role, val]) => (
                                    <option value={val} key={val}> {role} </option>
                                ))}
                            </Input> */}
                        </div>

                        <div style={formInputStyle}>
                            <label> <FormattedMessage id='slope'/> </label><br />
                            {/* <Input type='number' onChange={({ target }) => props.handleSlopeChange(target.value)} required value={props.slope} /> */}
                        </div>

                        <div style={formInputStyle}>
                            <label> <FormattedMessage id='intercept'/> </label><br />
                            {/* <Input type='number' onChange={({ target }) => props.handleInterceptChange(target.value)} required value={props.intercept} /> */}
                        </div>

                        <div style={formInputStyle}>
                            <label> <FormattedMessage id='note'/> </label><br />
                            {/* <Input type='string' onChange={({ target }) => props.handleNoteChange(target.value)} required value={props.note} /> */}
                        </div>

                        {/* {props.submittedOnce && !props.doPasswordsMatch  && <Alert color='danger'>
                            Error: Passwords Do Not Match
                        </Alert>}
                        <div style={formInputStyle}>
                            <label> <FormattedMessage id='password'/> </label><br />
                            <Input type='password' onChange={({ target }) => props.handlePasswordChange(target.value)} required value={props.password} />
                        </div>
                        <div style={formInputStyle}>
                            <label> <FormattedMessage id='password.confirm'/> </label><br />
                            <Input type='password' onChange={({ target }) => props.handleConfirmPasswordChange(target.value)} required value={props.confirmPassword} />
                        </div> */}
                        <div>
                            <Button> <FormattedMessage id='submit.new.conversion'/> </Button>
                        </div>
                    </form>
                </div>
             </div>
         </div>
     )
 }
 
 export default CreateConversionFormComponent;