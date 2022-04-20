/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 import * as _ from 'lodash';
 import { ConversionActions, ConversionsState} from '../types/redux/conversions'
 import { ActionType } from '../types/redux/actions';

 import { Conversion } from 'types/items';


 const defaultState: ConversionsState = {
     isFetching: false,
     conversion: [],
     editedConversions: [],
     submitting: []
 }
 
 export default function conversions(state = defaultState, action: ConversionActions) {
     let submitting;
     let editedConversions;
     let conversion;
     switch (action.type) {
         case ActionType.RequestConversionDetails:
             return {
                 ...state,
                 isFetching: true
             };
         case ActionType.ReceiveConversionDetails:
             return {
                 ...state,
                 isFetching: false,
                 conversion: action.data
             };
         case ActionType.EditConversionDetails:
             editedConversions = state.editedConversions;
             const finder = (element: Conversion) => element.sourceId === action.conversion.sourceId && element.destinationId === action.conversion.destinationId;
             editedConversions[state.conversion.findIndex(finder)] = action.conversion;
             return {
                 ...state,
                 editedConversions
             };
         case ActionType.SubmitEditedConversion:
             submitting = state.submitting;
             submitting.push(action.conversion);
             return {
                 ...state,
                 submitting
             };
         case ActionType.ConfirmEditedConversion:
             submitting = state.submitting;
             submitting.splice(submitting.indexOf(action.conversion));
             conversion = state.conversion;
             editedConversions = state.editedConversions;
             const finder3 = (element: Conversion) => element.sourceId === action.conversion.sourceId && element.destinationId === action.conversion.destinationId;
             conversion[conversion.findIndex(finder3)] = editedConversions[editedConversions.findIndex(finder3)];
             delete editedConversions[editedConversions.findIndex(finder3)];

             return {
                 ...state,
                 submitting,
                 editedConversions,
                 conversion
             };
         case ActionType.DeleteConversion:
              editedConversions = state.editedConversions;
              const finder2 = (element: Conversion) => element.sourceId === action.conversion.sourceId && element.destinationId === action.conversion.destinationId;
              delete editedConversions[editedConversions.findIndex(finder2)];
              conversion = state.conversion;
              delete conversion[conversion.findIndex(finder2)];
              return {
                  ...state,
                  editedConversions,
                  conversion
              };

         default:
             return state;
     }
 }
 
