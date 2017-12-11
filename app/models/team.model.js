
// Grab the Mongoose module
import mongoose from 'mongoose';
import Promise from 'bluebird';

mongoose.Promise = Promise;

// Create a `schema` for the `Team` object
let teamSchema = new mongoose.Schema({
  teamID: String,
  domain: String,
  name: String,
  ready: Boolean,
  error: Boolean,
  progress: Number,
  icon: String
});

// Expose the model so that it can be imported and used in
// the controller (to search, delete, etc.)
export default mongoose.model('Team', teamSchema, 'teams');
