/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Specifies either a meter or a group.
 */
export enum DataType {
	Meter = 'DATA_TYPE_METER',
	Group = 'DATA_TYPE_GROUP'
}

/**
 * An object that represents the numerical ID of a group.
 */
export interface GroupID {
	type: DataType.Group;
	value: number;
}

/**
 * An object that represents the numerical ID of a meter.
 */
export interface MeterID {
	type: DataType.Meter;
	value: number;
}

/**
 * An object that represents the numerical ID of either a group or meter.
 */
export interface DatasourceID {
	type: DataType;
	value: number;
}

/**
 * An interface representing objects with a type field which indicates what kind of data source they represent.
 */
export interface DataTyped {
	type: DataType;
}
