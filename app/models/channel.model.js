
// Grab the Mongoose module
import mongoose from 'mongoose';
import Promise from 'bluebird';

mongoose.Promise = Promise;

// Create a `schema` for the `Team` object
let channelSchema = new mongoose.Schema({
  teamID: String,
  domain: String,
  name: String,
  channelID: String,
  purpose: String,
  members: Number
});

// Expose the model so that it can be imported and used in
// the controller (to search, delete, etc.)
export default mongoose.model('Channel', channelSchema, 'channels');
