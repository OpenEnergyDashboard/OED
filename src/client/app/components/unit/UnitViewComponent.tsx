/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';
import EditUnitModalComponent from './EditUnitModalComponent';
import '../../styles/unit-card-page.css';
import { useSelector } from 'react-redux';
import { State } from '../../types/redux/state';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { useState } from 'react'; //I realize that * is already imported from react
interface UnitViewComponentProps
{
	unitId: number;
}

export default function UnitViewComponent(props: UnitViewComponentProps) { 

		/**New changes */

		//TODO maybe we should just pass the unitData itself from the parent unitsDetailComponent instead of parsing only the unitId and retrieving it again here?
		let unitJSON = useSelector((state: State) => state.units.units[props.unitId]);
		let editedUnitJSON = useSelector((state: State) => state.units.editedUnits[props.unitId]);
		//If the current unitData has any edits (located in editedUnits state) overwrite with the edited state, otherwise use the non-edited state 
		let unit = editedUnitJSON ? JSON.parse(JSON.stringify(editedUnitJSON)) : JSON.parse(JSON.stringify(unitJSON));

		//Check for admin status
		const currentUser = useSelector((state: State) => state.currentUser.profile);
		const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

		//Edit Modal Show
		const [showEditModal, setShowEditModal] = useState(false);

		const handleShow = () => {
			setShowEditModal(true);
		}

		const handleClose = () => {
			setShowEditModal(false);
		}

		return (
			<div className="card">
				<div className="identifier-container">
					{unit.name}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.identifier" /></b> {unit.identifier}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.type.of.unit" /></b> {unit.typeOfUnit}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.represent" /></b> {unit.unitRepresent}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.displayable" /></b> {unit.displayable}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.preferred.display" /></b> {unit.preferredDisplay.toString()}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.sec.in.rate" /></b> {unit.secInRate}
				</div>
				<div className="unit-container">
					<b><FormattedMessage id="unit.suffix" /></b> {unit.suffix}
				</div>
				<div className="unit-container">
					{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
					<b><FormattedMessage id="unit.note" /></b> {unit.note.slice(0, 29)}
				</div>
				{loggedInAsAdmin && 				
					<div className="edit-btn">
						<Button variant="Secondary" onClick={handleShow}>
							<FormattedMessage id="edit.unit" />
						</Button>
						{/*Creates a child UnitModalEditComponent*/}
						<EditUnitModalComponent show={showEditModal} unit={unit} handleClose={handleClose} />
					</div>
				}
			</div>
		);
	}