/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Prompt, withRouter, RouteComponentProps } from 'react-router-dom';
import { FlipLogOutStateAction, RemoveUnsavedChangesAction } from '../types/redux/unsavedWarning';
import { deleteToken } from '../utils/token';
import { clearCurrentUser } from '../actions/currentUser';
import store from '../index';
import { Modal, ModalBody, ModalFooter, Button } from 'reactstrap';

interface UnsavedWarningProps extends RouteComponentProps<any> {
	hasUnsavedChanges: boolean;
	isLogOutClicked: boolean;
	removeFunction: (callback: () => void) => any;
	submitFunction: (successCallback: () => void, failureCallback: () => void) => any;
	removeUnsavedChanges(): RemoveUnsavedChangesAction;
	flipLogOutState(): FlipLogOutStateAction;
}

class UnsavedWarningComponent extends React.Component<UnsavedWarningProps> {
	state = {
		warningVisible: false,
		confirmedToLeave: false,
		nextLocation: ''
	}

	constructor(props: UnsavedWarningProps) {
		super(props);
		this.closeWarning = this.closeWarning.bind(this);
		this.handleSubmitClicked = this.handleSubmitClicked.bind(this);
		this.handleLeaveClicked = this.handleLeaveClicked.bind(this);
	}

	componentDidUpdate() {
		const { hasUnsavedChanges } = this.props;
		if (hasUnsavedChanges) {
			// Block reloading page or closing OED tab
			window.onbeforeunload = () => true;
		} else {
			window.onbeforeunload = () => undefined;
		}
	}

	render() {
		return (
			<>
				<Prompt
					when={this.props.hasUnsavedChanges}
					message={ nextLocation => {
						const { confirmedToLeave } = this.state;
						const { hasUnsavedChanges } = this.props;
						if (!confirmedToLeave && hasUnsavedChanges) {
							this.setState({
								warningVisible: true,
								nextLocation: nextLocation.pathname
							});

							const currentLocation = this.props.history.location.pathname;
							if ((currentLocation === '/maps' && nextLocation.pathname === '/calibration') ||
								(currentLocation === '/calibration' && nextLocation.pathname === '/maps')) {
								// Don't warn users if they go between /maps and /calibration
								return true;
							}
							return false;
						}
						return true;
					}}
				/>

				<Modal isOpen={this.state.warningVisible} toggle={this.closeWarning}>
					<ModalBody><FormattedMessage id='unsaved.warning' /></ModalBody>
					<ModalFooter>
						<Button outline onClick={this.closeWarning}><FormattedMessage id='cancel' /></Button>
						<Button
							color='danger'
							onClick={this.handleLeaveClicked}
						>
							<FormattedMessage id='leave' />
						</Button>
						<Button
							color='success'
							onClick={this.handleSubmitClicked}
						>
							<FormattedMessage id='save.all' />
						</Button>
					</ModalFooter>
				</Modal>
			</>
		)
	}

	/**
	 * Call when the user clicks the cancel button
	 */
	private closeWarning() {
		this.setState({
			warningVisible: false
		});
	}

	/**
	 * Called when the user clicks the leave button or when the submit function throws an error
	 * Replace local changes with the original data
	 */
	private handleLeaveClicked() {
		const { nextLocation } = this.state;
		if (nextLocation) {
			this.setState({
				confirmedToLeave: true,
				warningVisible: false
			}, () => {
				this.props.removeFunction(() => {
					if (this.props.isLogOutClicked) {
						// Set the logout state to false
						this.props.flipLogOutState();
						// Delete token when users click log out
						this.handleLogOut();
					}
					this.props.removeUnsavedChanges();
					// Unblock reloading page and closing tab
					window.onbeforeunload = () => undefined;
					// Navigate to the path that the user wants
					this.props.history.push(this.state.nextLocation);
				});
			});
		}
	}

	/**
	 * Called when successfully submitting the unsaved changes
	 * Redirect to the desire path and turn off the unsaved warning
	 */
	private handleSubmitLeave() {
		const { nextLocation } = this.state;
		if (nextLocation) {
			this.setState({
				confirmedToLeave: true,
				warningVisible: false
			}, () => {
				if (this.props.isLogOutClicked) {
					// Set the logout state to false
					this.props.flipLogOutState();
					// Delete token when users click log out
					this.handleLogOut();
				}
				this.props.removeUnsavedChanges();
				// Unblock reloading page and closing tab
				window.onbeforeunload = () => undefined;
				// Navigate to the path that the user wants
				this.props.history.push(this.state.nextLocation);
			});
		}
	}

	private handleSubmitClicked() {
		this.props.submitFunction(() => {
			this.handleSubmitLeave();
		}, () => {
			this.handleLeaveClicked();
		});
	}

	private handleLogOut() {
		deleteToken();
		store.dispatch(clearCurrentUser());
	}
}

export default withRouter(UnsavedWarningComponent);