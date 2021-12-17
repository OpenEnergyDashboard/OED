/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedHTMLMessage, FormattedMessage } from 'react-intl';
import { Prompt, withRouter, RouteComponentProps } from 'react-router-dom';
import Button from 'reactstrap/lib/Button';
import Modal from 'reactstrap/lib/Modal';
import ModalBody from 'reactstrap/lib/ModalBody';
import ModalFooter from 'reactstrap/lib/ModalFooter';
import { RemoveUnsavedChangesAction } from '../types/redux/unsavedWarning';

interface UnsavedWarningProps extends RouteComponentProps<any> {
    hasUnsavedChanges: boolean;
    removeUnsavedChanges(): RemoveUnsavedChangesAction
}

class UnsavedWarningComponent extends React.Component<UnsavedWarningProps> {
    state = {
        warningVisible: false,
        confirmedToLeave: false,
        nextLocation: ""
    }

    constructor(props: UnsavedWarningProps) {
        super(props);
        this.closeWarning = this.closeWarning.bind(this);
        this.handleConfirmNavigationClick = this.handleConfirmNavigationClick.bind(this);
    }

    render() {
        return (
            <>
                <Prompt 
                    when={this.props.hasUnsavedChanges} 
                    message={(nextLocation) => {
                        const { confirmedToLeave } = this.state;
                        const { hasUnsavedChanges } = this.props;
                        if (!confirmedToLeave && hasUnsavedChanges) {
                            this.setState({
                                warningVisible: true,
                                nextLocation: nextLocation.pathname
                            });
                            return false;
                        }
                        return true;
                }} /> 

                <Modal isOpen={this.state.warningVisible} toggle={this.closeWarning}>
                    <ModalBody><FormattedMessage id='unsaved.warning' /></ModalBody>
                    <ModalFooter>
                        <Button outline onClick={this.closeWarning}><FormattedMessage id='cancel' /></Button>
                        <Button onClick={this.handleConfirmNavigationClick}><FormattedMessage id='leave' /></Button>
                        <Button><FormattedMessage id='save.all' /></Button>
                    </ModalFooter>
                </Modal>
            </>
        )
    }

    private closeWarning() {
        this.setState({
            warningVisible: false
        });
    }

    private handleConfirmNavigationClick() {
        const { nextLocation } = this.state;
        if (nextLocation) {
            this.setState({
                confirmedToLeave: true,
                warningVisible: false
            }, () => {
                this.props.removeUnsavedChanges();
                this.props.history.push(this.state.nextLocation);
            });
        }
    }
}

export default withRouter(UnsavedWarningComponent);