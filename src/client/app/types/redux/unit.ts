import { ActionType } from "./actions";

export interface ReceiveUnitsDetailsAction{
    type: ActionType.ReceiveUnitsDetails;
    data: UnitData[];
}

export interface RequestUnitsDetailsAction{
    type: ActionType.RequestUnitsDetails;
}

/**
	 * @param {*} id This unit's ID.
	 * @param {*} name This unit's name used internally and by the admin.
	 * @param {*} identifier This unit's identifier displayed to the user. 
	 * @param {*} unitRepresent Tells how the data is fetched for readings (only need for meter type unit).
	 * @param {*} secInRate The number of seconds in the unit associated with flow (rate) units.
	 * @param {*} typeOfUnit This unit's type. Can be meter, unit, or suffix.
	 * @param {*} unitIndex The unique number for row/column index in conversion table for this unit.
	 * @param {*} suffix This unit's suffix.
	 * @param {*} displayable Can be none, all, or admin. Restrict the type of user that can see this unit.
	 * @param {*} preferredDisplay True if this unit is always displayed. If not, the user needs to ask to see (for future enhancement).
	 * @param {*} note Note about this unit.
	 */

export interface UnitData{
    id: number;
    name: string;
    identifier: string;
    unitRepresent: string;
    secInRate: number;
    typeOfUnit: string;
    unitIndex: number;
    suffix: string;
    displayable: string;
    preferredDisplay: boolean;
    note: string;
}

export interface UnitMetadata{
    id: number;
    name: string;
    displayable: boolean;
    note?: string;
}

interface UnitMetadataByID{
    [unitID: number]: UnitMetadata;
}

export interface UnitState {
    isLoading: boolean;
    byUnitID: UnitMetadataByID;
    selectedUnit: number;
    editedUnits: UnitMetadataByID;
}

export type UnitsAction = 
    | RequestUnitsDetailsAction
    | ReceiveUnitsDetailsAction