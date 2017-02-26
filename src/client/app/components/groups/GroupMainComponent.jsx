/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//This is the main component for the groups display page
import React from 'react';
import HeaderComponent from '../HeaderComponent';
import EditGroupComponent from './EditGroupComponent';
import GroupViewComponent from './GroupViewComponent';
import {Link} from 'react-router';


export default function GroupComponent(props) {

const center = {

    justifyContent: "center",
    alignItems: "center",
    textAlign: "center"
};
const backButton = {
    float: "right",
    width: "15%",
};
const viewComp = {
    float : "left",
    width: "80%",
    marginRight: "5%"
};

const boxStyle  = {
	//todo: testing hack
	border: "1px solid green"
};

return (
        <div style={boxStyle}>
           <HeaderComponent renderLoginButton="false" renderGroupButton="false" />

           <div style={center}>
               <h1>Group Main Page</h1>
               <GroupViewComponent name="bannana"/>
               <Link style={backButton} to="/"><button className="btn btn-default">Back to Dashboard</button></Link>


           </div>

        </div>
    );

}
