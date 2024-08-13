/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { pick } from 'lodash';
import * as moment from 'moment';
import { MapDataState, mapsAdapter, mapsInitialState } from '../../redux/entityAdapters';
import { createAppSelector } from '../../redux/selectors/selectors';
import { emtpyMapMetadata, localEditsSlice } from '../../redux/slices/localEditsSlice';
import { RootState } from '../../store';
import { MapData, MapMetadata } from '../../types/redux/map';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import { baseApi } from './baseApi';

// Helper function to extract image dimensions from the mapSource
const mapResponseImgSrcToDimensions = (response: MapMetadata[]) => Promise.all(
	response.map(mapData =>
		new Promise<MapMetadata>(resolve => {
			const img = new Image();
			img.onload = () => {
				resolve({ ...emtpyMapMetadata, ...mapData, imgWidth: img.width, imgHeight: img.height });
			};
			img.onerror = () => {
				resolve({ ...emtpyMapMetadata, ...mapData });
			};
			img.src = mapData.mapSource;
		})
	)
);



export const mapsApi = baseApi.injectEndpoints({
	endpoints: build => ({
		getMapDetails: build.query<MapDataState, void>({
			query: () => 'api/maps/',
			transformResponse: async (response: MapMetadata[]) => {
				// To avoid saving unserializable image(s) in state, extract the image dimensions and only store the mapSource (string)
				return mapsAdapter.setAll(mapsInitialState, await mapResponseImgSrcToDimensions(response));
			},
			providesTags: ['MapsData']
		}),
		getMapByName: build.query<MapData, string>({
			query: name => ({
				url: 'api/maps/getByName',
				params: { name }
			})
		}),
		createMap: build.mutation<void, MapMetadata>({
			query: map => ({
				url: 'api/maps/create',
				method: 'POST',
				body: {
					//  send only what backend expects.
					...pick(map, ['name', 'note', 'filename', 'mapSource', 'northAngle', 'circleSize']),
					modifiedDate: moment().toISOString(),
					origin: (map.calibrationResult) ? map.calibrationResult.origin : undefined,
					opposite: (map.calibrationResult) ? map.calibrationResult.opposite : undefined
				}
			}),
			onQueryStarted: async (map, api) => {
				api.queryFulfilled
					// TODO Serverlogs migrate to rtk Query to drop axios?
					// Requires dispatch so inconvenient
					.then(() => {
						if (map.calibrationResult) {
							// logToServer('info', 'New calibrated map uploaded to database');
							showSuccessNotification(translate('upload.new.map.with.calibration'));
						} else {
							// logToServer('info', 'New map uploaded to database(without calibration)');
							showSuccessNotification(translate('upload.new.map.without.calibration'));
						}
						// TODO DELETE ME
						// api.dispatch(localEditsSlice.actions.removeOneEdit({ type: EntityType.MAP, id: map.id }));
					}).catch(() => {
						showErrorNotification(translate('failed.to.edit.map'));
					});
			},
			invalidatesTags: ['MapsData']
		}),
		editMap: build.mutation<MapData, MapMetadata>({
			query: map => ({
				url: 'api/maps/edit',
				method: 'POST',
				body: {
					//  send only what backend expects.
					...pick(map, ['id', 'name', 'displayable', 'note', 'filename', 'mapSource', 'northAngle', 'circleSize']),
					// As in other place, this take the time, in this case the current time, grabs the
					// date and time without timezone and then set it to UTC. This allows the software
					// to recreate it with the same date/time as it is on this web browser when it is
					// displayed later (without the timezone shown).
					// It might be better to use the server time but this is good enough.
					modifiedDate: moment().format('YYYY-MM-DD HH:mm:ss') + '+00:00',
					origin: map.calibrationResult ? map.calibrationResult.origin : map.origin,
					opposite: map.calibrationResult ? map.calibrationResult.opposite : map.opposite
				}
			}),
			onQueryStarted: (map, api) => {
				api.queryFulfilled
					// TODO Serverlogs migrate to rtk Query to drop axios?
					// Requires dispatch so inconvenient
					.then(() => {
						if (map.calibrationResult) {
							// logToServer('info', 'Edited map uploaded to database(newly calibrated)');
							showSuccessNotification(translate('updated.map.with.calibration'));
						} else if (map.origin && map.opposite) {
							// logToServer('info', 'Edited map uploaded to database(calibration not updated)');
							showSuccessNotification(translate('updated.map.without.new.calibration'));
						} else {
							// logToServer('info', 'Edited map uploaded to database(without calibration)');
							showSuccessNotification(translate('updated.map.without.calibration'));
						}
						// Cleanup LocalEditsSLice
						api.dispatch(localEditsSlice.actions.removeOneEdit(map.id));
					}).catch(() => {
						showErrorNotification(translate('failed.to.edit.map'));
					});
			},
			invalidatesTags: ['MapsData']
		}),
		deleteMap: build.mutation<void, number>({
			query: id => ({
				url: 'api/maps/delete',
				method: 'POST',
				body: { id }
			}),
			onQueryStarted: (arg, api) => {
				api.queryFulfilled
					//Cleanup Local Edits if any for deleted entity
					.then(() => {
						api.dispatch(localEditsSlice.actions.removeOneEdit(arg));
					})
					.catch();
			},
			invalidatesTags: ['MapsData']
		}),
		getMapById: build.query<MapData, number>({
			query: id => `api/maps/${id}`
		})
	})
});

const selectMapDataResult = mapsApi.endpoints.getMapDetails.select();
export const selectMapApiData = (state: RootState) => selectMapDataResult(state).data ?? mapsInitialState;
export const {
	selectAll: selectAllMaps,
	selectById: selectMapById,
	selectIds: selectMapIds,
	selectEntities: selectMapDataById,
	selectTotal: selectTotalMaps
} = mapsAdapter.getSelectors(selectMapApiData);

export const selectMapSelectOptions = createAppSelector(
	[selectAllMaps],
	allMaps => allMaps.map(map => (
		{ value: map.id, label: map.name, isDisabled: !(map.origin && map.opposite) }
	)));
