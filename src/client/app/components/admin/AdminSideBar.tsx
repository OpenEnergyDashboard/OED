import * as React from 'react';

interface SidebarProps {
	onSelectPreference: (preference: string) => void,
	selectedPreference: string;
}

/**
 * Admin navigation side bar
 * @param props Props for side bar
 * @returns Admin navigation side bar
 */
export default function AdminSideBar(props: SidebarProps): React.JSX.Element {
	return (
		<div className='col-3 border-end m-0 p-0'>
			<div className="list-group">
				<button
					type="button"
					className={`${props.selectedPreference === 'graph' ? 'btn btn-primary' : 'btn btn-light'}`}
					onClick={() => props.onSelectPreference('graph')}
				>
                    Graph Settings
				</button>
				<button
					type="button"
					className={`${props.selectedPreference === 'meter' ? 'btn btn-primary' : 'btn btn-light'}`}
					onClick={() => props.onSelectPreference('meter')}
				>
                    Meter Settings
				</button>
				<button
					type="button"
					className={`${props.selectedPreference === 'dateLanguage' ? 'btn btn-primary' : 'btn btn-light'}`}
					onClick={() => props.onSelectPreference('dateLanguage')}
				>
                    Date/Language Settings
				</button>
				<button
					type="button"
					className={`${props.selectedPreference === 'file' ? 'btn btn-primary' : 'btn btn-light'}`}
					onClick={() => props.onSelectPreference('file')}
				>
                    File Settings
				</button>
				<button
					type="button"
					className={`${props.selectedPreference === 'misc' ? 'btn btn-primary' : 'btn btn-light'}`}
					onClick={() => props.onSelectPreference('misc')}
				>
                    Misc Settings
				</button>
			</div>

		</div>
	);
}
