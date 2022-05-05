/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import CreateConversionModal from '../../components/conversions/CreateConversionModalComponent';
import { ConversionBidirectional, Conversion } from '../../types/items';
import { showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
interface CreateConversionContainerProps {
	createConversion(sourceId: number,
		destinationId: number,
		bidirectional: boolean,
		slope: number,
		intercept: number,
		note: string): any;
	conversions: Conversion[];

}
interface CreateConversionContainerState {
	sourceId: string,
	destinationId: string,
	bidirectional: ConversionBidirectional,
	slope: number,
	intercept: number,
	note: string,
	submittedOnce: boolean,
	trueBidirectional: boolean
}
//This is the component for the conversion modal when creating new conversions
export default class CreateConversionContainer extends React.Component<CreateConversionContainerProps, CreateConversionContainerState>{
	constructor(props: CreateConversionContainerProps) {
		super(props);
		this.handleSourceIdChange = this.handleSourceIdChange.bind(this)
		this.handleDestinationIdChange = this.handleDestinationIdChange.bind(this)
		this.handleBidirectionalChange = this.handleBidirectionalChange.bind(this)
		this.handleSlopeChange = this.handleSlopeChange.bind(this)
		this.handleInterceptChange = this.handleInterceptChange.bind(this)
		this.handleNoteChange = this.handleNoteChange.bind(this)
		this.submitNewConversion = this.submitNewConversion.bind(this)
		this.state = {
			sourceId: '',
			destinationId: '',
			bidirectional: ConversionBidirectional.FALSE,
			slope: 0,
			intercept: 0,
			note: '',
			submittedOnce: false,
			trueBidirectional: false
		}
	}



	//These will get the values that are entered into the form page when creating a new conversion

	private handleSourceIdChange = (newSourceId: string) => {
		this.setState({ sourceId: newSourceId })
	}

	private handleDestinationIdChange = (newDestinationId: string) => {
		this.setState({ destinationId: newDestinationId })
	}

	private handleBidirectionalChange = (newBidirectionalChange: string) => {
		if (newBidirectionalChange == 'true') {
			this.setState({ trueBidirectional: true });
		}else {
			this.setState({ trueBidirectional: false });
		}
	}

	private handleSlopeChange = (newSlopeChange: string) => {
		if (newSlopeChange == '') {
			const newSlopeChanges = 0;
			this.setState({ slope: newSlopeChanges})
		} else {
			this.setState({ slope: Number(newSlopeChange) });
		}

	}

	private handleInterceptChange = (newInterceptChange: string) => {
		if (newInterceptChange == '') {
			const newInterceptChanges = 0;
			this.setState({ intercept: newInterceptChanges});
		} else {
			this.setState({ intercept: Number(newInterceptChange) });
		}
	}

	private handleNoteChange = (newNoteChange: string) => {
		this.setState({ note: newNoteChange })
	}

	//Submit new conversion needs to be set up so that the function will actually create a new conversion
	private submitNewConversion = async () => {
		const sourceId = this.state.sourceId;
		const destinationId = this.state.destinationId;
		if (sourceId != '' && destinationId != '') {
			if (sourceId === destinationId){
				showErrorNotification(translate('conversion.failed.to.create.conversion'));
			} else {
				const exist = this.doesExist(Number(this.state.sourceId),Number(this.state.destinationId));
				if (exist) {
					showErrorNotification(translate('conversion.failed.to.create.conversion'));
				} else {
					this.props.createConversion(Number(this.state.sourceId),
						Number(this.state.destinationId),
						this.state.trueBidirectional,
						this.state.slope,
						this.state.intercept,
						this.state.note);
				}
			}
		}
	}

	private doesExist(source: number, destination: number) {
		const finder = (element: Conversion) => (
			((element.sourceId === source) && (element.destinationId === destination))
		);
		const inArr = this.props.conversions.filter(finder);
		if (inArr.length == 0) {
			return false;
		} else {
			return true;
		}
	}
	public render() {
		return (
			<div>
				<CreateConversionModal
					sourceId={this.state.sourceId}
					destinationId={this.state.destinationId}
					bidirectional={this.state.bidirectional}
					slope={this.state.slope}
					intercept={this.state.intercept}
					note={this.state.note}
					submittedOnce={this.state.submittedOnce}
					handleSourceIdChange={this.handleSourceIdChange}
					handleDestinationIdChange={this.handleDestinationIdChange}
					handleBidirectionalChange={this.handleBidirectionalChange}
					handleSlopeChange={this.handleSlopeChange}
					handleInterceptChange={this.handleInterceptChange}
					handleNoteChange={this.handleNoteChange}
					submitNewConversion={this.submitNewConversion}
				/>
			</div>
		)
	}
}