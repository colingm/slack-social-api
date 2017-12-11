
// Grab the Mongoose module
import mongoose from 'mongoose';
import Promise from 'bluebird';

mongoose.Promise = Promise;

// Create a `schema` for the `Team` object
let mentionSchema = new mongoose.Schema({
  domain: String,
  channelID: String,
  user1: String,
  userID1: String,
  user2: String,
  userID2: String,
  mentions: Number
});

// Expose the model so that it can be imported and used in
// the controller (to search, delete, etc.)
export default mongoose.model('Mention', mentionSchema, 'mentions');
