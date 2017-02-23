//This component is for viewing a single group via child box components + some buttons
import React from 'react';
import ChildBox from './ChildBoxComponent';
import ListBox from '/ListBoxComponent';


export default function GroupViewComponent(props) {


    return (

        <div>
        <ChildBox/>
        <ListBox/>
        </div>
    );
}
