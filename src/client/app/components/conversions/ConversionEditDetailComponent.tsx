/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Modal, Button, Dropdown } from 'react-bootstrap';
import { Conversion, ConversionBidirectional } from '../../types/items';
import {  FormattedMessage } from 'react-intl';
interface ConversionEditDetailProps {
	loggedInAsAdmin: boolean;
	conversion: Conversion;
	removeConversion(conversion: Conversion): any;
	editConversionDetails(conversion: Conversion): any;
	submitConversionsEdits(): any;
	onHide: () => void;
	show: boolean;
}

interface ConversionEditDetailState {
	sourceId: number;
	destinationId: number;
	bidirectional: ConversionBidirectional;
	slope: number;
	intercept: number;
	note: string
}

//TODO: incorporate unsaved changes warning
//TODO: Source/Destination ID Translation

class ConversionEditDetailComponent extends React.Component<ConversionEditDetailProps, ConversionEditDetailState> {
	constructor(props: ConversionEditDetailProps){
		super(props);
		this.state = {
			sourceId: this.props.conversion.sourceId,
			destinationId: this.props.conversion.destinationId,
			bidirectional: this.props.conversion.bidirectional,
			slope: this.props.conversion.slope,
			intercept: this.props.conversion.intercept,
			note: this.props.conversion.note
		}
	}

	//these next functions control the component state and handle the input changes in the modal
	private handleBidirectionalChange(value: string | any ) {
		this.setState({ bidirectional: value });
	}

	// For these next two functions I set default values for the slope and intercept
	// null or empty answers would invalidate the post function
	// if no value was entered in the modal then defaults to 0
	private handleSlopeChange(event: React.ChangeEvent<HTMLInputElement>) {
		if (event.target.value === '') {
			this.setState({ slope: 0 });

		} else {
			this.setState({ slope: Number(event.target.value) });
		}

	}
	private handleInterceptChange(event: React.ChangeEvent<HTMLInputElement>) {
		if (event.target.value === '') {
			this.setState({ intercept: 0 });

		} else {
			this.setState({ intercept: Number(event.target.value) });
		}

	}
	private handleNoteChange(event: React.ChangeEvent<HTMLInputElement>) {
		this.setState({ note: event.target.value });
	}

	//These are the individial Components for each editable fiel

	private isSlope(slope: number) {
		return (
			<div>
				<FormattedMessage id='conversion.slope'/>: <span><br />
					<input type="number" defaultValue={slope} placeholder="Slope" onChange={event => this.handleSlopeChange(event) } /></span>
			</div>
		)
	}

	private isIntercept(intercept: number) {
		return (
			<div>
				<FormattedMessage id='conversion.intercept'/>: <span><br />
					<input type="number" defaultValue={intercept} placeholder="Intercept" onChange={event => this.handleInterceptChange(event) } /></span>
			</div>
		)
	}

	private isBidirectional(bidirectional: ConversionBidirectional) {
		return (
			<div>
				<FormattedMessage id='conversion.bidirectional'/>:
				<span>
					<Dropdown onSelect= {event => this.handleBidirectionalChange(event) }>
						<Dropdown.Toggle  id="dropdown-button-dark-example1" size="sm" variant="secondary">
							{String(this.state.bidirectional)}
						</Dropdown.Toggle>
						<Dropdown.Menu variant="dark">
							<Dropdown.Item eventKey= {ConversionBidirectional.TRUE}>{String(ConversionBidirectional.TRUE)}</Dropdown.Item>
							<Dropdown.Item eventKey= {ConversionBidirectional.FALSE}> {String(ConversionBidirectional.FALSE)}</Dropdown.Item>
						</Dropdown.Menu>
					</Dropdown>
				</span>
			</div>
		)
	}

	private isNote(note: string) {
		return (
			<div>
				<FormattedMessage id='conversion.note'/>: <br />
				<input type="textarea" defaultValue={note} placeholder="Intercept" onChange={event => this.handleNoteChange(event) } />
			</div>
		)
	}

	private closeMod() {
		this.props.onHide();
	}

	//This function is what calls the delete action once the delete button is pressed
	private deleteConv(conversion: Conversion) {
		this.props.removeConversion(conversion);
		this.props.onHide();
	}

	//this is the function that handles the editing and submitting of changes to the database
	private editSubmit() {
		const newConv = this.props.conversion;
		newConv.bidirectional = this.state.bidirectional;
		newConv.intercept = this.state.intercept;
		newConv.slope = this.state.slope;
		newConv.note = this.state.note;
		this.props.editConversionDetails(newConv);
		this.props.submitConversionsEdits();
		this.props.onHide();
	}

	public render() {

		return(
			<Modal show={this.props.show} onHide={this.props.onHide}>
				<Modal.Header>
					<Modal.Title><FormattedMessage id='conversion.edit.title'/></Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<div>
						<FormattedMessage id='conversion.source'/>: {String(this.props.conversion.sourceId)}
						<br/>
						<FormattedMessage id='conversion.destination'/>: {String(this.props.conversion.destinationId)}
						<br/>
						{this.isBidirectional(this.props.conversion.bidirectional)}
						{this.isSlope(this.props.conversion.slope)}
						{this.isIntercept(this.props.conversion.intercept)}
						{this.isNote(this.props.conversion.note)}
					</div>
				</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => this.closeMod()}> <FormattedMessage id='conversion.close'/> </Button>
					<br/>
					<Button onClick= {() => this.editSubmit()}> <FormattedMessage id='conversion.submit'/> </Button>
					<br/>
					<Button variant="danger" onClick={() => this.deleteConv(this.props.conversion)}><FormattedMessage id='conversion.delete'/></Button>
				</Modal.Footer>
			</Modal>
		)
	}
}
export default ConversionEditDetailComponent;


