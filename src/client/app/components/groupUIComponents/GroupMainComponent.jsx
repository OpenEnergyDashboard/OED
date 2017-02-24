//This is the main component for the groups display page
import React from 'react';
import HeaderComponent from '../HeaderComponent';
import EditGroupComponent from './EditGroupComponent';
import GroupViewComponent from './GroupViewComponent';


export default function GroupComponent(props) {

var center = {
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center"
};

return (
        <div>
           <HeaderComponent renderLoginButton="false" renderGroupButton="false" />

           <div style={center}>
               <h1>Group Main Page</h1>
               <GroupViewComponent/>

           </div>



        </div>
    );

}
