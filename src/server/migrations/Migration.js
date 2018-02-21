class Migration {
	/** the version that this migration should be applied to */
	fromVersion() {}

	/** the version that this migration takes the database to */
	toVersion() {}

	/** migrates the database from fromVersion() to toVersion() */
	up(db) {}
}
