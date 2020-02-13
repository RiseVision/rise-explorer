# Lisk Blockchain Explorer

Lisk Explorer works in conjunction with the Lisk Core API. It uses Redis for caching data and Freegeoip to parse IP geo-location data.

[![Build Status](https://travis-ci.org/LiskHQ/lisk-explorer.svg?branch=development)](https://travis-ci.org/LiskHQ/lisk-explorer)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)

## Prerequisites

These programs and resources are required to install and run Lisk Explorer

- Nodejs v6.12.3 or higher (<https://nodejs.org/>) -- Nodejs serves as the underlying engine for code execution.

  ```
  curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- Redis (<http://redis.io>) -- Redis is used for caching parsed exchange data.

  `sudo apt-get install -y redis-server`

- Grunt.js (<http://gruntjs.com/>) -- Grunt is used to run eslint and unit tests.

  `sudo npm install -g grunt`

- Bower (<https://bower.io/>) -- Bower is used to look after frontend libraries.

  `sudo npm install -g bower`

- PM2 (https://github.com/Unitech/pm2) -- PM2 manages the node process for Lisk Explorer and handles log rotation (Highly Recommended)

  `sudo npm install -g pm2`
  
- PM2-logrotate (https://github.com/pm2-hive/pm2-logrotate) -- Manages PM2 logs

  ```
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 100M
  ```

- Git (<https://github.com/git/git>) -- Used for cloning and updating Lisk Explorer

  `sudo apt-get install -y git`

- Tool chain components -- Used for compiling dependencies

  `sudo apt-get install -y python build-essential automake autoconf libtool libpng-dev`

## Installation Steps

Clone the Lisk Explorer Repository:

```
git clone https://github.com/LiskHQ/lisk-explorer.git
cd lisk-explorer
npm install
```

## Build Steps

#### Frontend
 The frontend is using Webpack to create core bundles for Lisk Explorer.  
 
 For having a watcher to generate bundles continuously for all the changes of the code, Run the following command:

`npm run start`
 
 And for generating the minified bundles in production environment run:
 
`npm run build`

 If you want to add a meta tag with name and content defined (For example to verify your ownership to Google analytics) run:
 
 `SERVICE_NAME='your service name' CLIENT_ID='you client id' npm run build`

## Post-deployment Actions

#### Market Watcher
 Candlestick data needs to be initialized prior to starting Lisk Explorer. During runtime candlestick data is updated automatically.

This step writes data to the local Redis instance. Make sure that your application is already deployed and has access to the production Redis database. 

To build candlestick data for each exchange run:

`grunt candles:build`

To update candlestick data manually run after initialization:

`grunt candles:update`

## Configuration

The default `config.js` file contains all of the configuration settings for Lisk Explorer. These options can be modified according to comments included in configuration file.

#### Top Accounts

To enable Top Accounts functionality, edit your Lisk Client config.json _(not the explorer)_:

```
{
    "port": 8000,
    "address": "0.0.0.0",
    "version": "0.5.0",
    "minVersion": "~0.5.0",
    "fileLogLevel": "info",
    "logFileName": "logs/lisk.log",
    "consoleLogLevel": "info",
    "trustProxy": false,
    "topAccounts": false, <--- This line needs to be changed to read true
```

After the change is made the Lisk Client will need to be restarted. (Example):

`bash /PATH_TO_LISK_DIR/lisk.sh reload`

## Managing Lisk Explorer

To test that Lisk Explorer is configured correctly, run the following command:

`node app.js`

Open: <http://localhost:6040>, or if its running on a remote system, switch `localhost` for the external IP Address of the machine.

Once the process is verified as running correctly, `CTRL+C` and start the process with `PM2`. This will fork the process into the background and automatically recover the process if it fails.

`pm2 start pm2-explorer.json`

After the process is started its runtime status and log location can be found by issuing this statement:

`pm2 list`

To stop Explorer after it has been started with `PM2`, issue the following command:

`pm2 stop lisk-explorer`

## Docker

### Using docker-compose

Update `docker-lisk-core.env` to choose your preferred node. You can easily switch between Mainnet and Testnet nodes by changing content of the env file.

#### Starting application

To start Explorer type the following command:

```
docker-compose up -d
```

It will use lastest available version from local hub by default.

#### Stopping application

The following command will remove all containers defined by the `docker-compose.yml`.

```
docker-compose down --volumes
```

The parameter `--volumes` will remove all associated volumes that would not be useful anyway - next instances after `docker-compose up` create new volumes so the data will not be reused.

The example above will stop whole application gracefully but it leaves images in your repository. It is useful only if you plan to run the solution again. Otherwise you may want to clean up after these containers. You can use additional param for this purpose: `--rmi local` to remove untagged images. In case you want to remove all images related to this application add `--rmi all` to the `docker-compose` command.

#### Building other version than latest

If you want to build other version, you have to change the tag name in `docker-compose.yml`. You can also build from your local branch by adding `build .` under section called `lisk-explorer:`.

### Manual Docker deployment

First, build a new docker image in your local repository.
Replace `<TAG_NAME>` with the branch or tag name ex. `1.5.0`.

```
docker build https://github.com/LiskHQ/lisk-explorer.git#<TAG_NAME> -t lisk-explorer:<TAG_NAME>
```

Create dedicated virtual network for Lisk. This method replaces deprecated Docker parameter `--link`. In this example the virtual network is called `lisk-net`, but it may be changed to any other valid name. It is important to keep consistency and apply that name for every `--network` parameter used in commands below.

```
docker network create lisk-net
```

Create containers with Redis and FreeGeoIP.
```
docker run --name=lisk-redis --network=lisk-net -d redis:alpine
docker run --name=lisk-freegeoip --network=lisk-net --restart=always -d fiorix/freegeoip
```
Run the application within the same network that you created in the second step.

Replace `<LISK_NODE_IP>` and `<LISK_NODE_PORT>` accordingly.
Remember that in order to use any Lisk node your IP must be whitelisted, or the node must be configured to accept unknown IPs.

```
docker run -p 6040:6040 \
	-e LISK_HOST=<LISK_NODE_IP> \
	-e LISK_PORT=<LISK_NODE_PORT> \
	-e REDIS_HOST=lisk-redis \
	-e FREEGEOIP_HOST=lisk-freegeoip \
	--network=lisk-net \
	--name=lisk-explorer \
	-d lisk-explorer:1.4.3
```

You may also want to initialize Market Watcher data.

```
docker exec -it lisk-explorer ~/lisk-explorer/node_modules/grunt/bin/grunt candles:build
```

## Tests

Before running any tests, please ensure Lisk Explorer and Lisk Client are configured to run on the Lisk Testnet.

`bash ./e2e-test-setup.sh /PATH_TO_LISK_DIR`

Launch Lisk Explorer (runs on port 6040):

`pm2 start pm2-explorer.json`

Run the test suite:

`npm test`

Run individual tests:

```
npm test -- test/api/accounts.js
npm test -- test/api/transactions.js
```

## End-to-end Tests

### Setup for end-to-end tests:

Do all setup steps from "Test" section of this README

Make sure you have `wget` installed (it's used in `./e2e-test-setup.sh`). On Linux by default. On MacOS:
```
brew install wget
```

Setup protractor

```
./node_modules/protractor/bin/webdriver-manager update
```

### Run end-to-end test suite:

```
./e2e-test-setup.sh /PATH_TO_LISK_DIR
npm run e2e-test -s
```

### Run one end-to-end test feature file:

```
npm run e2e-test -s -- --specs=features/address.feature
```

## Contributors

https://github.com/LiskHQ/lisk-explorer/graphs/contributors

## License

Copyright © 2016-2017 Lisk Foundation

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the [GNU General Public License](https://github.com/LiskHQ/lisk-explorer/tree/master/LICENSE) along with this program.  If not, see <http://www.gnu.org/licenses/>.

***

This program also incorporates work previously released with lisk-explorer `1.1.0` (and earlier) versions under the [MIT License](https://opensource.org/licenses/MIT). To comply with the requirements of that license, the following permission notice, applicable to those parts of the code only, is included below:

Copyright © 2016-2017 Lisk Foundation  
Copyright © 2015 Crypti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
