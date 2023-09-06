## reference to issue #906

# How to modify?

If this is a non-admin then the page has a table with:
| Identifier | Unit | Default Graphic Unit | Enabled |
followed by one row for each meter with this information sorted by Identifier.
Unit and Default Graphic Unit will give the identifier of the unit associated with this id.

If this is an admin user then the page initially has a table with:
| Identifier | Unit | Default Graphic Unit | Displayable | Enabled | Edit/More Info |
followed by one row for each meter with this information sorted by Identifier.
Unit and Default Graphic Unit will give the identifier of the unit associated with this id.

The Edit/More info column has one button per row that is labeled Edit/More Info. If it is clicked then that meter row is expanded to show all 25 items
associated with a meter along with ability to edit each one. If possible, it would be nice to show the expanded list in its same place in the table. If not,
it could be done at the bottom of the page. The single row for the meter would become 5 rows (or 10 if the value is below) as follows:
| Identifier | Unit | Default Graphic Unit | Meter Type | GPS | Area |
| Displayable | Enabled | Meter Address | Timezone | note |
| Cumulative | Cumulative Reset | Reset Start | Reset End |
| Time Sort | End Only | Reading Gap | Reading Variation | Reading Duplication |
| Reading | Start Date/Time | End Date/Time | ID | Name | Save Button | Close/Cancel Button |
where the value for this meter would be with or right below the item. The Save Button would become clickable if any meter value was edited.
The other button would start as Close but switch to Cancel if an edit it done. It would be good to have a confirmation for Cancel so as not to accidentally lose edits.

# Each item can be edited as follows:
<ul>
<li>Identifier is text that can be anything as long as it has at least one character. The database enforces that it is unique.</li>
<li>Unit is a drop down menu with a listing of all units as their identifier that are of type meter where the current unit is selected.</li>
<li>Meter Type is a drop down menu with the types in the enumerated type Meter.type are listed and the current one selected.</li>
<li>Default Graphic Unit is the identifier of every unit that is compatible with the meter's unit. This will be done as part of resource generalization
but the basic drop down with all meter units can be listed for now.</li>
<li>GPS is text with checks on values as it currently is done.</li>
<li>Area is a floating point that is either empty or greater than zero.</li>
<li>Displayable is a boolean value where it has a toggle button as it currently has.</li>
<li>Enabled is a boolean value where it has a toggle button as it currently has.</li>
<li>Meter Address is text as it currently has.</li>
<li>Timezone is a drop down menu as it currently is with the current value selected.</li>
<li>note is text that can be edited in any way.</li>
<li>Cumulative is a boolean that toggles like other boolean values.</li>
<li>Cumulative Reset is a boolean that toggles like other boolean values.</li>
<li>Reset Start is a time value probably entered as text. It must be between 00:00:00 and 23:59:59.999999 with the format HH:MM:SS where the decimal on seconds is optional.</li>
<li>Reset End is a time value probably entered as text. It must be between 00:00:00 and 23:59:59.999999 with the format HH:MM:SS where the decimal on seconds is optional.</li>
<li>Time Sort is a boolean that toggles like other boolean values. The two possible values are in the enumerated type TimeSortTypes but meter/default is not an option.</li>
<li>End Only is a boolean that toggles like other boolean values but note it is handled similarly to Time Sort on the CSV page.</li>
<li>Reading Gap is a floating point value that must be greater than 0.</li>
<li>Reading Variation is a floating point value that must be greater than 0.</li>
<li>Reading Duplication is an integer value that is between 1 and 9. It might be best to use a drop down menu where the current value is selected.</li>
<li>Reading is a floating point value.</li>
<li>Start Date/Time is a date/time value in the format YYYY-MM-DD HH:MM:SS. It might be entered as text.</li>
<li>End Date/Time is a date/time value in the format YYYY-MM-DD HH:MM:SS. It might be entered as text.</li>
<li>ID is an integer that cannot be edited.</li>
<li>Name is text that cannot be edited.</li>
<li>The CSV upload pages show many of these and the admin help pages have information on those pages.</li>
</ul>

## Development Workflow

OED uses feature branches and enforced CI. To make a change:

1. Clone the repository
2. Make a new branch for your changes
3. Make and commit changes
4. Run `npm run check` and `npm run test` to ensure your changes will pass CI
5. Push and open a pull request  ( instructions - https://openenergydashboard.github.io/developer/pr.html )
6. Instructions to test data (  https://openenergydashboard.github.io/developer/testData.html )

   
