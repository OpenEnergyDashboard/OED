/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { LanguageTypes } from 'types/redux/i18n';
import { selectGroupDataById } from '../../redux/api/groupsApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import { selectChartLinkHideOptions, selectSelectedLanguage } from '../../redux/slices/appStateSlice';
import { DataType } from '../../types/Datasources';
import { GroupedOption, SelectOption } from '../../types/items';
import { ChartTypes } from '../../types/redux/graph';
import { GroupDataByID } from '../../types/redux/groups';
import { MeterDataByID } from '../../types/redux/meters';
import { UnitDataById, UnitRepresentType } from '../../types/redux/units';
import {
	CartesianPoint, Dimensions, calculateScaleFromEndpoints, gpsToUserGrid,
	itemDisplayableOnMap, itemMapInfoOk, normalizeImageDimensions
} from '../../utils/calibration';
import { metersInGroup, unitsCompatibleWithMeters } from '../../utils/determineCompatibleUnits';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { selectMapState } from '../reducers/maps';
import {
	selectChartToRender, selectGraphAreaNormalization, selectGraphState,
	selectSelectedGroups, selectSelectedMeters, selectSelectedUnit, selectSliderRangeInterval
} from '../slices/graphSlice';
import { selectVisibleMetersAndGroups, selectVisibleUnitOrSuffixState } from './authVisibilitySelectors';
import { selectDefaultGraphicUnitFromEntity, selectMeterOrGroupFromEntity, selectNameFromEntity } from './entitySelectors';
import { createAppSelector } from './selectors';

export const selectCurrentUnitCompatibility = createAppSelector(
	[
		selectVisibleMetersAndGroups,
		selectMeterDataById,
		selectGroupDataById,
		selectSelectedUnit
	],
	(visible, meterDataById, groupDataById, selectedUnitId) => {
		// meters and groups that can graph
		const compatibleMeters = new Set<number>();
		const compatibleGroups = new Set<number>();

		// meters and groups that cannot graph.
		const incompatibleMeters = new Set<number>();
		const incompatibleGroups = new Set<number>();

		visible.meters.forEach(meterId => {
			const meterGraphingUnit = meterDataById[meterId].defaultGraphicUnit;
			// when no unit is currently selected, every meter/group is valid provided it has a default graphic unit
			// If the meter/group has a default graphic unit set then it can graph, otherwise it cannot.
			// selectedUnitId -99 indicates no unit selected
			if (selectedUnitId === -99 && meterGraphingUnit === -99) {
				// No Unit Selected and Default graphic unit is not set
				incompatibleMeters.add(meterId);
			}
			else if (selectedUnitId === -99) {
				// no unitSelected, but has a default unit
				compatibleMeters.add(meterId);
			}
			else {
				// A unit is selected
				// Get all of compatible units for this meter
				const compatibleUnits = unitsCompatibleWithMeters(new Set<number>([meterId]));
				// Then, check if the selected unit exists in that set of compatible units
				compatibleUnits.has(selectedUnitId) ? compatibleMeters.add(meterId) : incompatibleMeters.add(meterId);
			}
		});

		// Same As Meters
		visible.groups
			.forEach(groupId => {
				const groupGraphingUnit = groupDataById[groupId].defaultGraphicUnit;
				if (selectedUnitId === -99 && groupGraphingUnit === -99) {
					incompatibleGroups.add(groupId);
				}
				else if (selectedUnitId === -99) {
					compatibleGroups.add(groupId);
				}
				else {
					// Get the set of units compatible with the current group (through its deepMeters attribute)
					// TODO If a meter in a group is not visible to this user then it is not in Redux state and this fails.
					const compatibleUnits = unitsCompatibleWithMeters(metersInGroup(groupId));
					compatibleUnits.has(selectedUnitId) ? compatibleGroups.add(groupId) : incompatibleGroups.add(groupId);
				}
			});

		return { compatibleMeters, incompatibleMeters, compatibleGroups, incompatibleGroups };
	}
);

export const selectCurrentAreaCompatibility = createAppSelector(
	[
		selectCurrentUnitCompatibility,
		selectGraphAreaNormalization,
		selectSelectedUnit,
		selectMeterDataById,
		selectGroupDataById,
		selectUnitDataById
	],
	(currentUnitCompatibility, areaNormalization, selectedUnit, meterDataById, groupDataById, unitDataById) => {
		// Deep Copy previous selector's values, and update as needed based on current Area Normalization setting
		const compatibleMeters = new Set<number>(currentUnitCompatibility.compatibleMeters);
		const compatibleGroups = new Set<number>(currentUnitCompatibility.compatibleGroups);

		// meters and groups that cannot graph.
		const incompatibleMeters = new Set<number>(currentUnitCompatibility.incompatibleMeters);
		const incompatibleGroups = new Set<number>(currentUnitCompatibility.incompatibleGroups);

		// only run this check if area normalization is on
		if (areaNormalization) {
			compatibleMeters.forEach(meterID => {
				// No unit is selected then no meter/group should be selected if area normalization is enabled and meter type is raw
				if (!isAreaNormCompatible(meterID, selectedUnit, meterDataById, unitDataById)) {
					incompatibleMeters.add(meterID);
				}
			});
			compatibleGroups.forEach(groupID => {
				if (!isAreaNormCompatible(groupID, selectedUnit, groupDataById, unitDataById)) {
					incompatibleGroups.add(groupID);
				}
			});
		}
		// Filter out any new incompatible meters/groups from the compatibility list.
		incompatibleMeters.forEach(meterID => compatibleMeters.delete(meterID));
		incompatibleGroups.forEach(groupID => compatibleGroups.delete(groupID));
		return { compatibleMeters, incompatibleMeters, compatibleGroups, incompatibleGroups };
	}
);

export const selectChartTypeCompatibility = createAppSelector(
	[
		selectCurrentAreaCompatibility,
		selectChartToRender,
		selectMeterDataById,
		selectGroupDataById,
		selectMapState
	],
	(areaCompat, chartToRender, meterDataById, groupDataById, mapState) => {
		// Deep Copy previous selector's values, and update as needed based on current ChartType(s)
		const compatibleMeters = new Set<number>(Array.from(areaCompat.compatibleMeters));
		const incompatibleMeters = new Set<number>(Array.from(areaCompat.incompatibleMeters));

		const compatibleGroups = new Set<number>(Array.from(areaCompat.compatibleGroups));
		const incompatibleGroups = new Set<number>(Array.from(areaCompat.incompatibleGroups));

		// ony run this check if we are displaying a map chart
		if (chartToRender === ChartTypes.map && mapState.selectedMap !== 0) {
			const mp = mapState.byMapID[mapState.selectedMap];
			// filter meters;
			const image = mp.image;
			// The size of the original map loaded into OED.
			const imageDimensions: Dimensions = {
				width: image.width,
				height: image.height
			};
			// Determine the dimensions so within the Plotly coordinates on the user map.
			const imageDimensionNormalized = normalizeImageDimensions(imageDimensions);
			// The following is needed to get the map scale. Now that the system accepts maps that are not
			// pointed north, it would be better to store the origin GPS and the scale factor instead of
			// the origin and opposite GPS. For now, not going to change but could if redo DB and interface
			// for maps.
			// Convert the gps value to the equivalent Plotly grid coordinates on user map.
			// First, convert from GPS to grid units. Since we are doing a GPS calculation, this happens on the true north map.
			// It must be on true north map since only there are the GPS axes parallel to the map axes.
			// To start, calculate the user grid coordinates (Plotly) from the GPS value. This involves calculating
			// it coordinates on the true north map and then rotating/shifting to the user map.
			// This is the origin & opposite from the calibration. It is the lower, left
			// and upper, right corners of the user map.
			// The gps value can be null from the database. Note using gps !== null to check for both null and undefined
			// causes TS to complain about the unknown case so not used.
			const origin = mp.origin;
			const opposite = mp.opposite;
			compatibleMeters.forEach(meterID => {
				// This meter's GPS value.
				const gps = meterDataById[meterID].gps;
				if (origin !== undefined && opposite !== undefined && gps !== undefined && gps !== null) {
					// Get the GPS degrees per unit of Plotly grid for x and y. By knowing the two corners
					// (or really any two distinct points) you can calculate this by the change in GPS over the
					// change in x or y which is the map's width & height in this case.
					const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized, mp.northAngle);
					// Convert GPS of meter to grid on user map. See calibration.ts for more info on this.
					const meterGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, mp.northAngle);
					if (!(itemMapInfoOk(meterID, DataType.Meter, mp, gps) &&
						itemDisplayableOnMap(imageDimensionNormalized, meterGPSInUserGrid))) {
						incompatibleMeters.add(meterID);
					}
				} else {
					// Lack info on this map so skip. This is mostly done since TS complains about the undefined possibility.
					incompatibleMeters.add(meterID);
				}
			});

			// The below code follows the logic for meters shown above. See comments above for clarification on the below code.
			compatibleGroups.forEach(groupID => {
				const gps = groupDataById[groupID].gps;
				if (origin !== undefined && opposite !== undefined && gps !== undefined && gps !== null) {
					const scaleOfMap = calculateScaleFromEndpoints(origin, opposite, imageDimensionNormalized, mp.northAngle);
					const groupGPSInUserGrid: CartesianPoint = gpsToUserGrid(imageDimensionNormalized, gps, origin, scaleOfMap, mp.northAngle);
					if (!(itemMapInfoOk(groupID, DataType.Group, mp, gps) &&
						itemDisplayableOnMap(imageDimensionNormalized, groupGPSInUserGrid))) {
						incompatibleGroups.add(groupID);
					}
				} else {
					incompatibleGroups.add(groupID);
				}
			});
		}
		// Filter out any new incompatible meters/groups from the compatibility list.
		incompatibleMeters.forEach(meterID => compatibleMeters.delete(meterID));
		incompatibleGroups.forEach(groupID => compatibleGroups.delete(groupID));

		return {
			compatibleMeters,
			compatibleGroups,
			incompatibleMeters,
			incompatibleGroups
		};
	}
);

// Filter compatible entities from selected Meters
export const selectCompatibleSelectedMeters = createAppSelector(
	[selectSelectedMeters, selectChartTypeCompatibility],
	(selectedMeters, { compatibleMeters }) => selectedMeters.filter(id => compatibleMeters.has(id))
);

// Filter compatible entities from selected Groups
export const selectCompatibleSelectedGroups = createAppSelector(
	[selectSelectedGroups, selectChartTypeCompatibility],
	(selectedMeters, { compatibleGroups }) => selectedMeters.filter(id => compatibleGroups.has(id))
);

export const selectMeterGroupSelectData = createAppSelector(
	[
		selectChartTypeCompatibility,
		selectMeterDataById,
		selectGroupDataById,
		selectSelectedMeters,
		selectSelectedGroups,
		selectSelectedLanguage
	],
	(chartTypeCompatibility, meterDataById, groupDataById, selectedMeters, selectedGroups, selectSelectedLanguage) => {
		// Destructure Previous Selectors's values
		const { compatibleMeters, incompatibleMeters, compatibleGroups, incompatibleGroups } = chartTypeCompatibility;

		// Calculate final compatible meters and groups for dropdown
		const compatibleSelectedMeters = new Set<number>();
		const incompatibleSelectedMeters = new Set<number>();
		selectedMeters.forEach(meterID => {
			// Sort and populate compatible/incompatible based on previous selector's compatible meters
			compatibleMeters.has(meterID) ? compatibleSelectedMeters.add(meterID) : incompatibleSelectedMeters.add(meterID);
		});
		const compatibleSelectedGroups = new Set<number>();
		const incompatibleSelectedGroups = new Set<number>();
		selectedGroups.forEach(groupID => {
			// Sort and populate compatible/incompatible based on previous selector's compatible groups
			compatibleGroups.has(groupID) ? compatibleSelectedGroups.add(groupID) : incompatibleSelectedGroups.add(groupID);
		});

		// The Multiselect's current selected value(s) as compatible/ incompatible options
		const selectedMeterOptions = getSelectOptionsByEntity(compatibleSelectedMeters, incompatibleSelectedMeters, meterDataById, selectSelectedLanguage);
		const selectedGroupOptions = getSelectOptionsByEntity(compatibleSelectedGroups, incompatibleSelectedGroups, groupDataById, selectSelectedLanguage);

		// All selected values even if not graph-able. Non compatible will be visually marked as disabled in custom react-select component(s)
		const allSelectedMeterValues = selectedMeterOptions.compatible.concat(selectedMeterOptions.incompatible);
		const allSelectedGroupValues = selectedGroupOptions.compatible.concat(selectedGroupOptions.incompatible);

		// List of options with metadata for react-select independent of currently selected. (Used to Populate the Select List(s))
		const meterSelectOptions = getSelectOptionsByEntity(compatibleMeters, incompatibleMeters, meterDataById, selectSelectedLanguage);
		const groupSelectOptions = getSelectOptionsByEntity(compatibleGroups, incompatibleGroups, groupDataById, selectSelectedLanguage);

		// Format The generated selectOptions into grouped options for the React-Select component
		const meterGroupedOptions: GroupedOption[] = [
			{ label: 'Meters', options: meterSelectOptions.compatible },
			{ label: 'Incompatible Meters', options: meterSelectOptions.incompatible }
		];
		const groupsGroupedOptions: GroupedOption[] = [
			{ label: 'Options', options: groupSelectOptions.compatible },
			{ label: 'Incompatible Options', options: groupSelectOptions.incompatible }
		];

		return {
			meterGroupedOptions, groupsGroupedOptions,
			selectedMeterOptions, selectedGroupOptions,
			allSelectedMeterValues, allSelectedGroupValues
		};
	}
);

export const selectUnitSelectData = createAppSelector(
	[
		selectUnitDataById,
		selectVisibleUnitOrSuffixState,
		selectSelectedMeters,
		selectSelectedGroups,
		selectGraphAreaNormalization,
		selectSelectedLanguage
	],
	(unitDataById, visibleUnitsOrSuffixes, selectedMeters, selectedGroups, areaNormalization, selectSelectedLanguage) => {
		// Holds all units that are compatible with selected meters/groups
		const compatibleUnits = new Set<number>();
		// Holds all units that are not compatible with selected meters/groups
		const incompatibleUnits = new Set<number>();

		// Holds all selected meters, including those retrieved from groups
		const allSelectedMeters = new Set<number>();

		// Get for all meters
		selectedMeters.forEach(meter => {
			allSelectedMeters.add(meter);
		});
		// Get for all groups
		selectedGroups.forEach(group => {
			// Get for all deep meters in group
			metersInGroup(group).forEach(meter => {
				allSelectedMeters.add(meter);
			});
		});

		if (allSelectedMeters.size == 0) {
			// No meters/groups are selected. This includes the case where the selectedUnit is -99.
			// Every unit is okay/compatible in this case so skip the work needed below.
			// Filter the units to be displayed by user status and displayable type
			visibleUnitsOrSuffixes.forEach(unit => {
				if (areaNormalization && unit.unitRepresent === UnitRepresentType.raw) {
					incompatibleUnits.add(unit.id);
				} else {
					compatibleUnits.add(unit.id);
				}
			});
		} else {
			// Some meter or group is selected
			// Retrieve set of units compatible with list of selected meters and/or groups
			const units = unitsCompatibleWithMeters(allSelectedMeters);

			// Loop over all units (they must be of type unit or suffix - case 1)
			visibleUnitsOrSuffixes.forEach(o => {
				// Control displayable ones (case 2)
				if (units.has(o.id)) {
					// Should show as compatible (case 3)
					compatibleUnits.add(o.id);
				} else {
					// Should show as incompatible (case 4)
					incompatibleUnits.add(o.id);
				}
			});
		}

		// Ready to display unit. Put selectable ones before non-selectable ones.
		const unitOptions = getSelectOptionsByEntity(compatibleUnits, incompatibleUnits, unitDataById, selectSelectedLanguage);
		const unitsGroupedOptions: GroupedOption[] = [
			{
				label: 'Units',
				options: unitOptions.compatible
			},
			{
				label: 'Incompatible Units',
				options: unitOptions.incompatible
			}
		];
		return unitsGroupedOptions;
	}
);

/**
 * Returns a set of SelectOptions based on the type of state passed in and sets the visibility.
 * Visibility is determined by which set the items are contained in.
 * @param compatibleItems - compatible items to make select options for
 * @param incompatibleItems - incompatible items to make select options for
 * @param entityDataById - current redux state, must be one of UnitsState, MetersState, or GroupsState
 * @param locale - the current selected language taken from redux state
 * @returns Two Lists: Compatible, and Incompatible selectOptions for use as grouped React-Select options
 */
export function getSelectOptionsByEntity(
	compatibleItems: Set<number>,
	incompatibleItems: Set<number>,
	entityDataById: MeterDataByID | GroupDataByID | UnitDataById,
	locale: LanguageTypes
) {
	//The final list of select options to be displayed
	const compatibleItemOptions = Object.entries(entityDataById)
		.filter(([id]) => compatibleItems.has(Number(id)))
		.map(([id, entity]) => {
			// Groups unit and meters have identifier, groups doesn't
			const label = selectNameFromEntity(entity);
			// MeterAnd Group, undefined for units
			const defaultGraphicUnit = selectDefaultGraphicUnitFromEntity(entity);
			const meterOrGroup = selectMeterOrGroupFromEntity(entity);
			return {
				value: Number(id),
				label: label,
				// If option is compatible then not disabled
				isDisabled: false,
				meterOrGroup: meterOrGroup,
				defaultGraphicUnit: defaultGraphicUnit
			} as SelectOption;
		});

	//Loop over each itemId and create an activated select option
	const incompatibleItemOptions = Object.entries(entityDataById)
		.filter(([id]) => incompatibleItems.has(Number(id)))
		.map(([id, entity]) => {
			const label = selectNameFromEntity(entity);
			// MeterAnd Group, undefined for units
			const defaultGraphicUnit = selectDefaultGraphicUnitFromEntity(entity);
			const meterOrGroup = selectMeterOrGroupFromEntity(entity);
			return {
				value: Number(id),
				label: label,
				// If option is incompatible then disabled
				isDisabled: true,
				meterOrGroup: meterOrGroup,
				defaultGraphicUnit: defaultGraphicUnit
			} as SelectOption;
		});
	const compatible = compatibleItemOptions.sort((itemA, itemB) => itemA.label.toLowerCase().
		localeCompare(itemB.label.toLowerCase(), String(locale), { sensitivity: 'accent' }));
	const incompatible = incompatibleItemOptions.sort((itemA, itemB) => itemA.label.toLowerCase()?.
		localeCompare(itemB.label.toLowerCase(), String(locale), { sensitivity: 'accent' }));
	return { compatible, incompatible };
}

// Helper function for area compatibility
// areaNorm should be active when called
export const isAreaNormCompatible = (
	id: number, selectedUnit: number, meterOrGroupData: MeterDataByID | GroupDataByID, unitDataById: UnitDataById
) => {
	const meterGraphingUnit = meterOrGroupData[id].defaultGraphicUnit;

	// If no unit is selected then no meter/group should be selected if meter type is raw
	const noUnitAndRaw = selectedUnit === -99 && unitDataById[meterGraphingUnit]?.unitRepresent === UnitRepresentType.raw;

	// do not allow meter to be selected if it has zero area or no area unit
	const noAreaOrUnitType = meterOrGroupData[id].area === 0 || meterOrGroupData[id].areaUnit === AreaUnitType.none;
	const isAreaNormCompatible = !noUnitAndRaw && !noAreaOrUnitType;
	return isAreaNormCompatible;
};

export const selectChartLink = createAppSelector(
	[
		selectGraphState,
		selectChartLinkHideOptions,
		selectSliderRangeInterval,
		state => state.maps.selectedMap
	],
	(current, chartLinkHideOptions, rangeSliderInterval, selectedMap) => {
		// Determine the beginning of the URL to add arguments to.
		// This is the current URL.
		const winLocHref = window.location.href;
		// See if graph? is in URL. We add that when it comes in as a chartlink.
		// Want to remove so we can start without the current arguments.
		let startOfParams = winLocHref.indexOf('graph?');
		// It is -1 if not there. In that case use the full length string.
		startOfParams = startOfParams === -1 ? winLocHref.length : startOfParams;
		// Grab the start of URL to what was just determined.
		const baseURL = winLocHref.substring(0, startOfParams);
		// Add graph? since we want to route to graph and have a ? before any arguments.
		let linkText = `${baseURL}graph?`;
		// let weeklyLink = ''; // reflects graph 7 days from present, with user selected meters and groups;
		if (current.selectedMeters.length > 0) {
			linkText += `meterIDs=${current.selectedMeters.toString()}&`;
		}
		if (current.selectedGroups.length > 0) {
			linkText += `groupIDs=${current.selectedGroups.toString()}&`;
		}
		linkText += `chartType=${current.chartToRender}`;
		// weeklyLink = linkText + '&serverRange=7dfp'; // dfp: days from present;
		linkText += `&serverRange=${current.queryTimeInterval.toString()}`;
		switch (current.chartToRender) {
			case ChartTypes.bar:
				linkText += `&duration=${current.duration.asDays()}`;
				linkText += `&barStacking=${current.barStacking}`;
				break;
			case ChartTypes.line:
				// TODO Omitted for the time being re-implement slider range later.
				// linkText += `&sliderRange=${rangeSliderInterval}`;
				break;
			case ChartTypes.compare:
				linkText += `&comparePeriod=${current.comparePeriod}`;
				linkText += `&compareSortingOrder=${current.compareSortingOrder}`;
				break;
			case ChartTypes.map:
				linkText += `&mapID=${selectedMap.toString()}`;
				break;
			case ChartTypes.threeD:
				linkText += `&meterOrGroup=${current.threeD.meterOrGroup}`;
				linkText += `&meterOrGroupID=${current.threeD.meterOrGroupID}`;
				linkText += `&readingInterval=${current.threeD.readingInterval}`;
				break;
		}
		const unitID = current.selectedUnit;
		linkText += `&unitID=${unitID.toString()}`;
		linkText += `&rate=${current.lineGraphRate.label.toString()},${current.lineGraphRate.rate.toString()}`;
		linkText += `&areaUnit=${current.selectedAreaUnit}&areaNormalization=${current.areaNormalization}`;
		linkText += `&minMax=${current.showMinMax}`;
		if (chartLinkHideOptions) {
			linkText += '&optionsVisibility=false';
		}
		return linkText;
	}
);

