# vertical-toolbox-api Change Log

Version numbers are semver-compatible dates in YYYY.MM.DD-X format,
where X is the revision number.


# 2022.11.24

### Fixes
* **List Verticals:** Require JWT for list verticals, only return verticals
belonging to requesting user or owner in query.


# 2022.3.30

### Fixes

* **Upload File:** Only upload files to mm1, not mm1 and mm2. This fixes 504
error being returned even though uploading succeeded.


# 2022.3.29

### Features

* **Create Vertical:** Add ownerEmail field to vertical.
* **Save Vertical:** Add ownerEmail field to vertical, and use the ownerEmail
field as a validation field for ownership of a vertical. Use case-insensitive
matching for owner and ownerEmail fields.
* **Delete Vertical:** Use the ownerEmail field as a validation field for
ownership of a vertical. Use case-insensitive matching for owner and ownerEmail
fields.


# 2021.1.5

### Bug Fixes

* **Create Vertical (Save As):** remove vertical ID from request data so that
the generated ID get used and there is not a unique key error


# 2020.11.24

### Features

* **Upload GCP Credentials:** add owner info to GCP credentials when adding to
the database


# 2020.10.26

### Features

* **Create Vertical:** Add route specifically for creating new verticals.
Automatically generates an ID for the user.