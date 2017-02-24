//This is the main component for the groups display page
import React from 'react';
import HeaderComponent from '../HeaderComponent';
import EditGroupComponent from './EditGroupComponent';
import GroupViewComponent from './GroupViewComponent';
import {Link} from 'react-router';


export default function GroupComponent(props) {

var center = {

    justifyContent: "center",
    alignItems: "center",
    textAlign: "center"
};
var backButton = {
    float: "right",
    width: "15%",
};
var viewComp = {
    float : "left",
    width: "80%",
    marginRight: "5%"
};

return (
        <div>
           <HeaderComponent renderLoginButton="false" renderGroupButton="false" />

           <div style={center}>
               <h1>Group Main Page</h1>
               <GroupViewComponent/>
               <Link style={backButton} to="/"><button className="btn btn-default">Back to Dashboard</button></Link>


           </div>

        </div>
    );

}
