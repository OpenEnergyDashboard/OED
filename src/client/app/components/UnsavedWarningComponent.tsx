/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Prompt } from 'react-router-dom';
import { UpdateUnsavedChangesAction } from '../types/redux/unsavedWarning';

interface UnsavedWarningProps {
    hasUnsavedChanges: boolean;
    updateUnsavedChanges(): UpdateUnsavedChangesAction;
}

export default class UnsavedWarningComponent extends React.Component<UnsavedWarningProps> {
    constructor(props: UnsavedWarningProps) {
        super(props);
    }
    
    render() {
        return (
            <Prompt when={this.props.hasUnsavedChanges} message={"Are you sure you want to leave?"} /> 
        )
    }
}