/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 
 import { connect } from 'react-redux';
 import { State } from '../../types/redux/state';
 import { Dispatch } from '../../types/redux/actions';
 import { isRoleAdmin } from '../../utils/hasPermissions';
 import { editConversionDetails, submitConversionsEdits, removeConversion } from '../../actions/conversions';
 import { Conversion } from '../../types/items';
 import ConversionEditDetailComponent from '../../components/conversions/ConversionEditDetailComponent';
 //import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
 //import { updateUnsavedChanges, removeUnsavedChanges } from '../../actions/unsavedWarning';
 //import store from '../../index';


 function mapStateToProps(state: State, ownProps: { conversion: Conversion, onHide: () => void,
    show: boolean}) {
     let conversion = JSON.parse(JSON.stringify(ownProps.conversion));
     const currentUser = state.currentUser.profile;
     let loggedInAsAdmin = false;
     let show = ownProps.show;
     let onHide = ownProps.onHide;
     if (currentUser !== null) {
        loggedInAsAdmin = isRoleAdmin(currentUser.role);
     }
     return {
         conversion,
         show,
         onHide,
         loggedInAsAdmin
     }
 }

 function mapDispatchToProps(dispatch: Dispatch) {
     return {
         removeConversion: (conversion: Conversion) => dispatch(removeConversion(conversion)),
         editConversionDetails: (conversion: Conversion) => dispatch(editConversionDetails(conversion)),
         submitConversionsEdits: () => dispatch(submitConversionsEdits())
     };
 }

 export default connect(mapStateToProps,mapDispatchToProps)(ConversionEditDetailComponent);