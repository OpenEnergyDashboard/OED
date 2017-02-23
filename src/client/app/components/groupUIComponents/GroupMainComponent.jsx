//This is the main component for the groups display page
import React from 'react';
import HeaderComponent from '../HeaderComponent';
import ChildGBoxComponent from './ChildGBoxComponent';
import ChildMBoxComponent from './ChildMBoxComponent';
import ListGBoxComponent from './ListGBoxComponent';
import ListMBoxComponent from './ListMBoxComponent';



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
           </div>



        </div>
    );

}
