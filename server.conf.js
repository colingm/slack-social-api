// *server.conf.js*

//  This is the file where we will:
//  - Configure our application
//  - Connect to our database
//  - Create our Mongoose models
//  - Define routes for our RESTful API
//  - Define routes for our frontend Angular application
//  - Set the app to listen on a port so we can view it in our browser

// # Node Env Variables

// Load Node environment variable configuration file
import {validateEnvVariables} from './config/env.conf.js';

// Set up appropriate environment variables if necessary
validateEnvVariables();

// Set up logging
import logger from './config/logger.js';

// # Modules

// Load Express
import express from 'express';
// Load Node http module
import http from 'http';
// Create our app with Express
let app = express();
// Create a Node server for our Express app
let server = http.createServer(app);

// import { kafkaConsumers } from './app/sockets/kafka-consumers.sockets';
// kafkaConsumers(io);

// Load Mongoose for MongoDB interactions
import mongoose from 'mongoose';
// Log requests to the console (Express 4)
import morgan from 'morgan';
// Pull information from HTML POST (express 4)
import bodyParser from 'body-parser';
// Simulate DELETE and PUT (Express 4)
import methodOverride from 'method-override';

import cookieParser from 'cookie-parser';

// # Configuration

// Set the port for this app
let port = process.env.PORT || 8080;

// Load Mongoose config file for connecting to MongoDB instance
import mongooseConf from './config/mongoose.conf';

// Pass Mongoose configuration Mongoose instance
mongooseConf(mongoose);

if (process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test') {
  // Log every request to the console
  app.use(morgan('dev'));
}

// Read cookies (needed for authentication)
app.use(cookieParser());

// ## Get all data/stuff of the body (POST) parameters

// Parse application/json
app.use(bodyParser.json());
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Override with the X-HTTP-Method-Override header in the request. Simulate DELETE/PUT
app.use(methodOverride('X-HTTP-Method-Override'));
// Set the static files location /public/img will be /img for users
app.use(express.static(__dirname + '/dist'));

// ## Routes

// Get an instance of the express Router
let router = express.Router();

// Load our application API routes
// Pass in our express and express router instances
import routes from './app/routes';

// Pass in instances of the express app, router
routes(app, router);

// ### Ignition Phase

server.listen(port);

// Shoutout to the user
console.log(`Wizardry is afoot on port ${port}`);

// Expose app
export {app};
