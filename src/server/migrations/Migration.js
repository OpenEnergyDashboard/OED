class Migration {
	/** the version that this migration should be applied to */
	static fromVersion() {}

	/** the version that this migration takes the database to */
	static toVersion() {}

	/** migrates the database from fromVersion() to toVersion() */
	up(db) {}
}
