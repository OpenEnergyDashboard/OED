/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

INSERT INTO units(name, identifier, unit_type, unit_index, suffix, displayable_type, is_primary, note, unit_represent_type)
VALUES (${name}, ${identifier}, ${unitType}, ${unitIndex}, ${suffix}, ${displayable}, ${primary}, ${note}, ${unitRepresentType})
RETURNING id;
