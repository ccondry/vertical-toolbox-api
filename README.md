# dCloud Vertical Toolbox API
This is the HTTP REST API code for the dCloud Vertical Toolbox. This supports
the vertical-toolbox-ui website project.

## Installation
```sh
git clone https://gitlab.com/dcloud-collab/vertical-toolbox-api.git
cd vertical-toolbox-api
npm install
```

## Run
```sh
npm start
```

## Run as a Service on Linux
```sh
sudo cp systemd.service /lib/systemd/system/vertical-toolbox-api.service
sudo systemctl enable vertical-toolbox-api.service
```

## Start Service on Linux
```sh
sudo systemctl start vertical-toolbox-api.service
```
