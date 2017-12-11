// */app/routes.js*

// ## Node API Routes

// Define routes for the Node backend

// Load our API routes
import { teamRoutes } from './routes/team-routes.v1.router';

export default (app, router) => {

  var allowCrossDomain = function(req, res, next) {
  	// Added other domains you want the server to give access to
  	// WARNING - Be careful with what origins you give access to
  	var allowedHost = [
  		'http://localhost',
  		'localhost'
  	];
  	var re = new RegExp('((http)s?:\/\/)?[a-zA-Z0-9_.-]*:[0-9]{1,}.*');
  	var origin = req.headers.origin || req.headers.host;

  	if (re.test(origin)) {
  		origin = origin.substring(0, origin.lastIndexOf(':'));
  	}

  	/* TODO: Temporary fix to circumvent Postman connection issues. Investigation into better option advised. */
  	res.header('Access-Control-Allow-Credentials', true);
  	res.header('Access-Control-Allow-Origin', '*');
  	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  	res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  	next();
  };

  app.use(allowCrossDomain);

  // ### Express Middlware to use for all requests
  router.use((req, res, next) => {
    console.log('I sense a disturbance in the force...'); // DEBUG
    // Make sure we go to the next routes and don't stop here...
    next();
  });

  // ### Server Routes

  // #### Authentication routes

  // #### RESTful API Routes
  teamRoutes(app, router);

  // All of our routes will be prefixed with /api
  app.use('/api', router);
};
