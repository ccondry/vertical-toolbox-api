# vertical-toolbox-api Change Log

Version numbers are semver-compatible dates in YYYY.MM.DD-X format,
where X is the revision number.


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