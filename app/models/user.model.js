
// Grab the Mongoose module
import mongoose from 'mongoose';
import Promise from 'bluebird';

mongoose.Promise = Promise;

// Create a `schema` for the `Team` object
let userSchema = new mongoose.Schema({
  domain: String,
  userID: String,
  name: String,
  messages: Number,
  channels: [String]
});

// Expose the model so that it can be imported and used in
// the controller (to search, delete, etc.)
export default mongoose.model('User', userSchema, 'users');
