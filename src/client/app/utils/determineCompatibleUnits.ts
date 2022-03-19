/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Takes a set of meter ids and returns the set of compatible unit ids.
 * @param meters The set of meter ids.
 * @returns
 */
export function unitsCompatibleWithMeters(meters: Set<number>): Set<number> {
    let compatibleUnits = new Set<number>();
    return compatibleUnits;
}

/**
 * Returns a set of units ids that are compatible with a specific unit id.
 * @param unit The unit id.
 * @returns
 */
export function unitsCompatibleWithUnit(unit: number): Set<number> {
    let unitSet = new Set<number>();
    return unitSet;
}

/**
 * Returns the unit id given the row in Pik.
 * @param row The row to find the associated unit.
 * @returns
 */
export function unitFromPRow(row: number): number {
    let unitId = Number();
    return unitId;
}

/**
 * Returns the unit id given the column in Pik.
 * @param column The column to find the associated unit.
 * @returns 
 */
export function unitFromPColumn(column: number): number {
    let unitId = Number();
    return unitId;
}

/**
 * Returns the set of meterse ids associated with the groupId used.
 * @param groupId The groupId.
 * @returns 
 */
export function metersInGroup(groupId: number): Set<number> {
    let metersSet = new Set<number>();
    return metersSet;    
}