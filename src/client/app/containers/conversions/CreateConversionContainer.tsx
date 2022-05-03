/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 import * as React from 'react';
 import CreateConversionModal from '../../components/conversions/CreateConversionModalComponent';
 import { ConversionBidirectional } from '../../types/items';
  
 //This is the component for the conversion modal when creating new conversions
 export default class CreateConversionContainer extends React.Component<{}, {}>{
     constructor(props: {}) {
         super(props);
         this.handleSourceIdChange = this.handleSourceIdChange.bind(this)
         this.handleDestinationIdChange = this.handleDestinationIdChange.bind(this)
         this.handleBidirectionalChange = this.handleBidirectionalChange.bind(this)
         this.handleSlopeChange = this.handleSlopeChange.bind(this)
         this.handleInterceptChange = this.handleInterceptChange.bind(this)
         this.handleNoteChange = this.handleNoteChange.bind(this)
         this.submitNewConversion = this.submitNewConversion.bind(this)
     }
 
     state = {
         sourceId: "",
         destinationId: "",
         bidirectional: ConversionBidirectional.FALSE,
         slope: 0,
         intercept: 0,
         note: "",
         submittedOnce: false,
     }
 
     //These will get the values that are entered into the form page when creating a new conversion
 
     private handleSourceIdChange = (newSourceId: string) => {
         this.setState({ sourceId: newSourceId })
     }
 
     private handleDestinationIdChange = (newDestinationId: string) => {
         this.setState({ destinationId: newDestinationId })
     }
 
     private handleBidirectionalChange = (newBidirectionalChange: string) => {
         this.setState({ bidirectional: newBidirectionalChange })
     }
 
     private handleSlopeChange = (newSlopeChange: string) => {
         this.setState({ slope: newSlopeChange })
     }
 
     private handleInterceptChange = (newInterceptChange: string) => {
         this.setState({ intercept: newInterceptChange })
     }
 
     private handleNoteChange = (newNoteChange: string) => {
         this.setState({ note: newNoteChange })
     }
 
     //Submit new conversion needs to be set up so that the function will actually create a new conversion
     private submitNewConversion = async () => {
         // try {
         //     await unitsApi.addUnit({
         //         id: -99,
         //         name: this.state.name,
         //         identifier: this.state.identifier,
         //         unitRepresent: this.state.unitRepresent,
         //         secInRate: this.state.secInRate,
         //         typeOfUnit: this.state.typeOfUnit,
         //         unitIndex: -99,
         //         suffix: this.state.suffix,
         //         displayable: this.state.displayable,
         //         preferredDisplay: this.state.preferredDisplay,
         //         note: this.state.note
 
         //     });
         //     showSuccessNotification(translate('units.successfully.create.unit'))
         //     browserHistory.push('/units');
         // } catch (error) {
         //     showErrorNotification(translate('units.failed.to.create.unit'));
         // }
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