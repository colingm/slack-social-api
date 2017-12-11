# Project Newton API

This project was generated with [Vulgar CLI](https://github.com/datatypevoid/vulgar). For more help visit the git repository.

## Structure

- `app` contains the back-end routing and MongoDB object models
- `config` contains configuration files

## Dependencies

- _Node.js_ - [Download](http://nodejs.org/download/) and Install Node.js
- `mocha` (`$ npm install --global mocha`)
- `gulp` (`$ npm install --global gulp`)

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|module`.

## Build

- `$ npm install` to install dependencies

## config.json

The `server.conf.js` file is expecting certain `environment` `variables` to be set within `Node`. The `env.conf.js` has functions to check whether the expected `environment` `variables` have been setup before proceeding to start up the rest of the server. It uses a file called `config.json` stored in the `config` directory that looks something like this:

```
{
  "ENV" : "development",
  # MAKE SURE PORT IS NOT 8080 OR WHATEVER THE WEBPACK
  # DEV SERVER PORT IS SET TO
  "PORT" : 8080,
  "MONGO_URI" : {
    "DEVELOPMENT" : "mongodb://[username:password]@host[:port]",
    "PRODUCTION" : "mongodb://[username:password]@host[:port]",
    "TEST" : "mongodb://[username:password]@host[:port]"
  },
  # Generate your own 256-bit WEP key here:
  # http://randomkeygen.com/
  # Note that you don't need to use specifically
  # this, but it will certainly suffice
  "SESSION_SECRET" : "355FC4FE9348639B4E4FED1B8E93C"
}

You should definitely change your `SESSION_SECRET` for even the most lackadaisical development effort.
```

There is a default dev config called `config.default.json`.

### A Quick Note About the `config.json` Object

This object is not absolutely required. You can pass these values in however you want, whether it is through the command line or some alternative method. This just provided me with an easy way of storing a couple of values that do not change often.

## Running the app

After you have installed all dependencies and modified your `config.json` file, you can now run the app. First, you must start up the back-end server in a separate terminal using the `gulp serve` command. This will fire up our Express app using `nodemon`, which will watch for file changes and restart our backend when necessary. Next use the `npm start` command in the original terminal which runs two `npm` scripts in parallel: `npm run server` to start `webpack-dev-server` for building our front-end in the computer's memory, enabling hot module reloading; `npm run watch` to watch all of the front-end files and build them upon changes. You can now fire up your favorite web browser and visit the running application at `localhost:8080`!

### server

```bash
# development
# package front-end files with Webpack and hot reload
# upon any changes
$ npm start
# use `Gulp` in a second terminal to run the Express
# app responsible for our back-end
$ gulp serve
# optionally use `Gulp` in a third terminal to auto
# generate documentation and lint `Sass`
$ gulp

# production
$ npm run build:prod
$ npm run server:prod
```

## Other commands

### start `Express` back-end

```bash
$ gulp serve
```

### build documentation

```bash
$ gulp build:docs
```

### watch and build documentation

```bash
$ gulp watch:docs
```

### watch and lint sass

```bash
$ gulp watch:sass
```

### build files

```bash
# development
$ npm run build:dev
# production
$ npm run build:prod
```

### watch and build files

```bash
$ npm run watch
```

### run tests

```bash
$ npm run test
```

### watch and run our tests

```bash
$ npm run watch:test
```

### run end-to-end tests

```bash
# make sure you have your server running in another terminal
$ npm run e2e
```

### run webdriver (for end-to-end)

```bash
$ npm run webdriver:update
$ npm run webdriver:start
```

### run Protractor's elementExplorer (for end-to-end)

```bash
$ npm run webdriver:start
# in another terminal
$ npm run e2e:live
```
