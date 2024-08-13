import { EntityState, createEntityAdapter } from '@reduxjs/toolkit';
import { ConversionData } from '../types/redux/conversions';
import { GroupData } from '../types/redux/groups';
import { MapMetadata } from '../types/redux/map';
import { MeterData } from '../types/redux/meters';
import { UnitData } from '../types/redux/units';
const sortByIdentifierProperty = (a: any, b: any) => a.identifier?.localeCompare(b.identifier, undefined, { sensitivity: 'accent' });
const sortByNameProperty = (a: any, b: any) => a.name?.localeCompare(b.name, undefined, { sensitivity: 'accent' });

// Adapters re-homed for compatability with localEditsSlice.ts/ prevents circular dependency issues.
// Meters
export const meterAdapter = createEntityAdapter<MeterData>({ sortComparer: sortByIdentifierProperty });
export const metersInitialState = meterAdapter.getInitialState();
export type MeterDataState = EntityState<MeterData, number>;


// Units
export const unitsAdapter = createEntityAdapter<UnitData>({ sortComparer: sortByIdentifierProperty });
export const unitsInitialState = unitsAdapter.getInitialState();
export type UnitDataState = EntityState<UnitData, number>;

// Groups
export const groupsAdapter = createEntityAdapter<GroupData>({ sortComparer: sortByNameProperty });
export const groupsInitialState = groupsAdapter.getInitialState();
export type GroupDataState = EntityState<GroupData, number>;


// Maps
export const mapsAdapter = createEntityAdapter<MapMetadata>({ sortComparer: sortByNameProperty });
export const mapsInitialState = mapsAdapter.getInitialState();
export type MapDataState = EntityState<MapMetadata, number>;

// Conversions
// Extending conversion data to add an id number
// Conversions are stored in the database as a composite key of source/destination. EntityAdapter requires a unique ID,
export type ConversionDataWithIds = ConversionData & { id: number };
// This is exclusively for the front end to take advantage of the entity adapter and its derived selectors.
// So Adding the id property as the response's array index
// Will not impact backend/server
// Conversions sorts using unitData values, which is not possible with entity adapters so sort by synthetic id
// Will have to sort by 'id' (default, no sort comparer)
export const conversionsAdapter = createEntityAdapter<ConversionDataWithIds>();
export const conversionsInitialState = conversionsAdapter.getInitialState();
export type ConversionDataState = EntityState<ConversionDataWithIds, number>;

