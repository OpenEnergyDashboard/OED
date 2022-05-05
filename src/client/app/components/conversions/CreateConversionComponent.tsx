/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { ConversionBidirectional } from '../../types/items';
import {  Button } from 'reactstrap';
import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { FormattedMessage } from 'react-intl';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
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
						</div>

						<div style={formInputStyle}>
							<label> <FormattedMessage id='destination.id'/> </label><br />
						</div>

						<div style={formInputStyle}>
							<label> <FormattedMessage id='bidirectional'/> </label><br />
						</div>

						<div style={formInputStyle}>
							<label> <FormattedMessage id='slope'/> </label><br />
						</div>

						<div style={formInputStyle}>
							<label> <FormattedMessage id='intercept'/> </label><br />
						</div>

						<div style={formInputStyle}>
							<label> <FormattedMessage id='note'/> </label><br />
						</div>
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