/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
 import * as React from 'react';
 import { Conversion } from '../../types/items';
 import { Table } from 'reactstrap';
 import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
 import TooltipMarkerComponent from '../TooltipMarkerComponent';
 import { FormattedMessage } from 'react-intl';
 import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
 
 interface AdminConversionsComponentProps {
     conversions: Conversion[];
     deleteConversion: (source_id: number, destination_id: number) => Promise<void>; //add items in paranthesis
     edited: boolean;
     editConversion: (bidirectional: boolean, slope: number, intercept: number, note: string, source_id: number, destination_id: number) => void; //add items in paranthesis
     submitConversionEdits: () => Promise<void>;
 }
 
 class AdminConversions extends React.Component {
     render() {
 
         const titleStyle: React.CSSProperties = {
             textAlign: 'center'
         };
     
         const tableStyle: React.CSSProperties = {
             marginLeft: '10%',
             marginRight: '10%'
         };
     
         const buttonsStyle: React.CSSProperties = {
             display: 'flex',
             justifyContent: 'space-between'
         }
     
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
                         <FormattedMessage id='users'/>
                         <div style={tooltipStyle}>
                             <TooltipMarkerComponent page='users' helpTextId='help.admin.user' />
                         </div>
                     </h2>
                     <div style={tableStyle}>
                         <Table striped bordered hover>
                             <thead>
                                 <tr>
                                     <th> <FormattedMessage id='email'/> </th>
                                     <th> <FormattedMessage id='role'/> </th>
                                     <th> <FormattedMessage id='action'/> </th>
                                 </tr>
                             </thead>
                             <tbody>
                                 
                             </tbody>
                         </Table>
                         <div style={buttonsStyle}>
                         </div>
                     </div>
                 </div>
             </div>
         )
     }
 }
 
 export default AdminConversions;