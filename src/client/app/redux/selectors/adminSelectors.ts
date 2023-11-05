import { createSelector } from '@reduxjs/toolkit'
import * as _ from 'lodash'
import { selectAdminState } from '../../reducers/admin'
import { selectConversionsDetails } from '../../redux/api/conversionsApi'
import { selectMeterDataById } from '../../redux/api/metersApi'
import { RootState } from '../../store'
import { PreferenceRequestItem } from '../../types/items'
import { UnitData, UnitType } from '../../types/redux/units'
import { unitsCompatibleWithUnit } from '../../utils/determineCompatibleUnits'
import { noUnitTranslated, potentialGraphicUnits } from '../../utils/input'
import { selectUnitDataById } from '../api/unitsApi'
import translate from '../../utils/translate'

export const selectAdminPreferences = createSelector(
	selectAdminState,
	adminState => ({
		displayTitle: adminState.displayTitle,
		defaultChartToRender: adminState.defaultChartToRender,
		defaultBarStacking: adminState.defaultBarStacking,
		defaultLanguage: adminState.defaultLanguage,
		defaultTimezone: adminState.defaultTimeZone,
		defaultWarningFileSize: adminState.defaultWarningFileSize,
		defaultFileSizeLimit: adminState.defaultFileSizeLimit,
		defaultAreaNormalization: adminState.defaultAreaNormalization,
		defaultAreaUnit: adminState.defaultAreaUnit,
		defaultMeterReadingFrequency: adminState.defaultMeterReadingFrequency,
		defaultMeterMinimumValue: adminState.defaultMeterMinimumValue,
		defaultMeterMaximumValue: adminState.defaultMeterMaximumValue,
		defaultMeterMinimumDate: adminState.defaultMeterMinimumDate,
		defaultMeterMaximumDate: adminState.defaultMeterMaximumDate,
		defaultMeterReadingGap: adminState.defaultMeterReadingGap,
		defaultMeterMaximumErrors: adminState.defaultMeterMaximumErrors,
		defaultMeterDisableChecks: adminState.defaultMeterDisableChecks
	} as PreferenceRequestItem)
)


/**
 * Calculates the set of all possible graphic units for a meter/group.
 * This is any unit that is of type unit or suffix.
 * @returns The set of all possible graphic units for a meter/group
 */
export const selectPossibleGraphicUnits = createSelector(
	selectUnitDataById,
	({ data: unitDataById = {} }) => {
		return potentialGraphicUnits(unitDataById)
	}
)
/**
 * Calculates the set of all possible meter units for a meter.
 * This is any unit that is of type unit or suffix.
 * @returns The set of all possible graphic units for a meter
 */
export const selectPossibleMeterUnits = createSelector(
	selectUnitDataById,
	({ data: unitDataById = {} }) => {
		let possibleMeterUnits = new Set<UnitData>();
		// The meter unit can be any unit of type meter.
		Object.values(unitDataById).forEach(unit => {
			if (unit.typeOfUnit == UnitType.meter) {
				possibleMeterUnits.add(unit);
			}
		});
		// Put in alphabetical order.
		possibleMeterUnits = new Set(_.sortBy(Array.from(possibleMeterUnits), unit => unit.identifier.toLowerCase(), 'asc'));
		// The default graphic unit can also be no unit/-99 but that is not desired so put last in list.
		return possibleMeterUnits.add(noUnitTranslated());
	}
)


export const selectMeterDataWithID = (state: RootState, meterID: number) => {
	const { data: meterDataByID = {} } = selectMeterDataById(state)
	return meterDataByID[meterID]
}
export const selectUnitWithID = (state: RootState, unitID: number) => {
	const { data: unitDataById = {} } = selectMeterDataById(state)
	return unitDataById[unitID]

}

/**
 * Selector that returns a unit associated with a meter given an meterID
 * @param {RootState} state redux global state
 * @param {number} id redux global state
 * @returns {string} Unit Name.
 * @example
 *  useAppSelector(state => selectUnitName(state, 42))
 */
export const selectUnitName = createSelector(
	// This is the unit associated with the meter.
	// The first test of length is because the state may not yet be set when loading. This should not be seen
	// since the state should be set and the page redrawn so just use 'no unit'.
	// The second test of -99 is for meters without units.
	// ThisSelector takes an argument, due to one or more of the selectors accepts an argument (selectUnitWithID selectMeterDataWithID)
	selectUnitDataById,
	selectMeterDataWithID,
	({ data: unitDataById = {} }, meterData) => {
		const unitName = (Object.keys(unitDataById).length === 0 || meterData.unitId === -99) ?
			noUnitTranslated().identifier : unitDataById[meterData.defaultGraphicUnit].identifier
		return unitName
	}
)


/**
 * Selector to retrieve the graphic name based on unit and meter data.
 * @param {RootState} state - The global application state.
 * @param {number} id - The ID used to look up unit and meter data.
 * @returns {string}  The identifier for the graphic name, or a default identifier
 * @example
 *  useAppSelector(state => selectGraphicName(state, 42))
 */
export const selectGraphicName = createSelector(
	// This is the default graphic unit associated with the meter. See above for how code works.
	// notice that this selector is written with inline selectors for demonstration purposes
	selectUnitDataById,
	selectMeterDataWithID,
	({ data: unitDataById = {} }, meterData) => {
		const graphicName = (Object.keys(unitDataById).length === 0 || meterData.defaultGraphicUnit === -99) ?
			noUnitTranslated().identifier : unitDataById[meterData.defaultGraphicUnit].identifier
		return graphicName
	}
)


/**
 * Selects the graphic unit compatibility data based on the possible graphic and meter units and local edits.
 * @returns - Memoized selector instance The compatible and incompatible graphic and meter units.
 * @example
 * const selectGraphicUnitCompatibility = useMemo(makeSelectGraphicUnitCompatibility, [])
 * useAppSelector(state => selectGraphicUnitCompatibility(state, localMeterEdits.unitId, localMeterEdits.defaultGraphicUnit))
 */
export const makeSelectGraphicUnitCompatibility = () => {
	const selectGraphicUnitCompatibilityInstance = createSelector(
		selectPossibleGraphicUnits,
		selectPossibleMeterUnits,
		// 3rd/4th callback  used to pass in non-state value in this case the local edits.
		// two separate call backs so their return values will pass a === equality check for memoized behavior
		(state: RootState, unitId: number) => unitId,
		(state: RootState, unitId: number, defaultGraphicUnit: number) => defaultGraphicUnit,
		(possibleGraphicUnits, possibleMeterUnits, unitId, defaultGraphicUnit) => {
			// Graphic units compatible with currently selected unit
			const compatibleGraphicUnits = new Set<UnitData>();
			// Graphic units incompatible with currently selected unit
			const incompatibleGraphicUnits = new Set<UnitData>();
			// If unit is not 'no unit'
			if (unitId != -99) {
				// Find all units compatible with the selected unit
				const unitsCompatibleWithSelectedUnit = unitsCompatibleWithUnit(unitId);
				possibleGraphicUnits.forEach(unit => {
					// If current graphic unit exists in the set of compatible graphic units OR if the current graphic unit is 'no unit'
					if (unitsCompatibleWithSelectedUnit.has(unit.id) || unit.id === -99) {
						compatibleGraphicUnits.add(unit);
					} else {
						incompatibleGraphicUnits.add(unit);
					}
				});
			} else {
				// No unit is selected
				// OED does not allow a default graphic unit if there is no unit so it must be -99.
				defaultGraphicUnit = -99;
				possibleGraphicUnits.forEach(unit => {
					// Only -99 is allowed.
					if (unit.id === -99) {
						compatibleGraphicUnits.add(unit);
					} else {
						incompatibleGraphicUnits.add(unit);
					}
				});
			}

			// Units compatible with currently selected graphic unit
			let compatibleUnits = new Set<UnitData>();
			// Units incompatible with currently selected graphic unit
			const incompatibleUnits = new Set<UnitData>();
			// If a default graphic unit is not 'no unit'
			if (defaultGraphicUnit !== -99) {
				// Find all units compatible with the selected graphic unit
				possibleMeterUnits.forEach(unit => {
					// Graphic units compatible with the current meter unit
					const compatibleGraphicUnits = unitsCompatibleWithUnit(unit.id);
					// If the currently selected default graphic unit exists in the set of graphic units compatible with the current meter unit
					// Also add the 'no unit' unit
					if (compatibleGraphicUnits.has(defaultGraphicUnit) || unit.id === -99) {
						// add the current meter unit to the list of compatible units
						compatibleUnits.add(unit.id === -99 ? noUnitTranslated() : unit);
					} else {
						// add the current meter unit to the list of incompatible units
						incompatibleUnits.add(unit);
					}
				});
			} else {
				// No default graphic unit is selected
				// All units are compatible
				compatibleUnits = new Set(possibleMeterUnits);
			}
			// return compatibility for current selected unit(s)
			return { compatibleGraphicUnits, incompatibleGraphicUnits, compatibleUnits, incompatibleUnits }
		}
	)
	return selectGraphicUnitCompatibilityInstance
}


/**
 * Checks if conversion is valid
 * @param state redux store RootState
 * @param sourceId New conversion sourceId
 * @param destinationId New conversion destinationId
 * @param bidirectional New conversion bidirectional status
 * @returns boolean representing if new conversion is valid or not
 */
export const selectIsValidConversion = createSelector(
	selectUnitDataById,
	selectConversionsDetails,
	(_state: RootState, sourceId: number) => sourceId,
	(_state: RootState, _sourceId: number, destinationId: number) => destinationId,
	(_state: RootState, _sourceId: number, _destinationId: number, bidirectional: boolean) => bidirectional,
	({ data: unitDataById = {} }, { data: conversionData = [] }, sourceId, destinationId, bidirectional): [boolean, string] => {
		/* Create Conversion Validation:
					Source equals destination: invalid conversion
					Conversion exists: invalid conversion
					Conversion does not exist:
						Inverse exists:
							Conversion is bidirectional: invalid conversion
					Destination cannot be a meter
					Cannot mix unit represent
					TODO Some of these can go away when we make the menus dynamic.
				*/
		console.log('running again!')

		// The destination cannot be a meter unit.
		if (destinationId !== -999 && unitDataById[destinationId].typeOfUnit === UnitType.meter) {
			// notifyUser(translate('conversion.create.destination.meter'));
			return [false, translate('conversion.create.destination.meter')];
		}

		// Source or destination not set
		if (sourceId === -999 || destinationId === -999) {
			// TODO Translate Me!
			return [false, 'Source or destination not set']
		}

		// Conversion already exists
		if ((conversionData.findIndex(conversionData => ((
			conversionData.sourceId === sourceId) &&
			conversionData.destinationId === destinationId))) !== -1) {
			// notifyUser(translate('conversion.create.exists'));
			return [false, translate('conversion.create.exists')];
		}

		// You cannot have a conversion between units that differ in unit_represent.
		// This means you cannot mix quantity, flow & raw.
		if (unitDataById[sourceId].unitRepresent !== unitDataById[destinationId].unitRepresent) {
			// notifyUser(translate('conversion.create.mixed.represent'));
			return [false, translate('conversion.create.mixed.represent')];
		}


		let isValid = true;
		// Loop over conversions and check for existence of inverse of conversion passed in
		// If there exists an inverse that is bidirectional, then there is no point in making a conversion since it is essentially a duplicate.
		// If there is a non bidirectional inverse, then it is a valid conversion
		Object.values(conversionData).forEach(conversion => {
			// Inverse exists
			if ((conversion.sourceId === destinationId) && (conversion.destinationId === sourceId)) {
				// Inverse is bidirectional
				if (conversion.bidirectional) {
					isValid = false;
				}
				// Inverse is not bidirectional
				else {
					// Do not allow for a bidirectional conversion with an inverse that is not bidirectional
					if (bidirectional) {
						// The new conversion is bidirectional
						isValid = false;
					}
				}
			}
		});

		return !isValid ? [false, translate('conversion.create.exists.inverse')] : [isValid, 'Conversion is Valid']
	}
)