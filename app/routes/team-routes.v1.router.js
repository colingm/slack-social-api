// */app/routes/db2-object.v1.router.js*

// # DB2 Objects API

// Verb     Route                              Description

// GET      /api/v1/db2                        Get all of the db2 objects
// GET      /api/v1/db2/{object_id}            Get an individual db2 object
// GET      /api/v1/db2/{object_id}/related    Get all objects related to this one
// GET      /api/v1/db2/{object_id}/parents    Get the parents back to root of given object
// GET      /api/v1/db2/{object_id}/children   Get the children of the given object

import logger from 'winston';
import axios from 'axios';
import Promise from 'bluebird';
import Agenda from 'agenda';

import Team from '../models/team.model';
import Channel from '../models/channel.model';
import User from '../models/user.model';
import Mention from '../models/mention.model';

export function teamRoutes(app, router) {

  const BATCH_SIZE = 1000;
  const MAX_MESSAGES = 10000;
  const BATCH_PERCENT_DECIMAL = 10000;
  const LOCK_LIFETIME = 3600000;
  const DEFAULT_LIMIT = '50';
  const DEFAULT_THRESHOLD = '10';
  const BASE_ARCHIVE_API = 'https://api.slackarchive.io/v1/';
  const agenda = new Agenda({db: {address: process.env.MONGO_URI, defaultLockLifetime: LOCK_LIFETIME}});

  // ## DB2 Object API Routes

  // Define routes for the `db2Object` API

  router.route('/v1/teams')
  // ### Get the list of available teams
  // query params:
  //  - done: (bool)   Request all teams that have been analyzed
  .get((req, res, next) => {

    if (req.query.done) {
      Team.find({}).exec()
    	.then((teams) => {
    		res.json(teams);
    	})
    	.catch((error) => {
    		res.status(500).json({message: 'Unable to get teams from db'});
    	});
    } else {
      axios.get(BASE_ARCHIVE_API + 'team')
      .then((response) => {
        res.json(response.data.team);
      })
      .catch((error) => {
        res.status(500).json({message: 'Unable to get list of all teams'});
      });
    }

  });

  router.route('/v1/teams/:domain')
  // ### Get an available team, if the team isn't available build it
  .get((req, res, next) => {

  	let domain = req.params.domain;

    Team.findOne({domain: domain}).exec()
    .then((team) => {
      if (team) {
        res.json(team);
      } else {
        var config = createRequestHeaders(domain);
        axios.get(BASE_ARCHIVE_API + 'team', config)
        .then((response) => {

          if (response.data.team.length > 1) {
            throw domain;
          }
          let team = response.data.team[0];

          let teamModel = new Team({
            teamID: team.team_id,
            domain: team.domain,
            name: team.name,
            ready: false,
            error: false,
            progress: 0,
            icon: getIconAddress(team)
          });

          teamModel.save((err, doc) => {
            if (err) {
              res.status(500).json({message: `[${domain}] Error creating team for analysis`});
            } else {
              agenda.schedule(new Date(Date.now() + 500), 'analyze', {team: doc});
              res.json(doc);
            }
          });

        })
        .catch((error) => {
          logger.error(`Unable to get team with domain ${domain}`);
          res.status(500).json({message: `Unable to find team with domain ${domain}`})
        });
      }
    })
    .catch((error) => {
      res.status(500).json({message: `Unable to get ${domain} from db`});
    });

  })
  // ### Rerun the data for a team
  .post((req, res, next) => {
    let domain = req.params.domain;
    Team.findOne({domain}).exec()
    .then((team) => {
      if (!team) {
        res.status(404).json({message: `Unable to find ${domain}`});
      } else if (!team.ready && !team.error) {
        res.status(400).json({message: `Pending job found for ${domain}`});
      } else {
        rerunAnalyze(domain, team.teamID);
        res.json({message: `Queued rerun for ${domain}`});
      }
    })
    .catch((error) => {
      logger.error(`Unable to restart job for ${domain}`);
      logger.error(error.message);
      logger.error(error.stack);
      res.status(500).json({message: `Unable to restart job for ${domain}`});
    });

  })
  // ### Clean up team data
  .delete((req, res, next) => {
    let domain = req.params.domain;
    Team.findOne({domain}).exec()
    .then((team) => {
      if (!team) {
        res.status(404).json({message: `Unable to find ${domain}`});
      } else if (!team.ready && !team.error) {
        res.status(400).json({message: `Pending job found for ${domain}`});
      } else {
        cleanTeam(domain);
        res.json({message: `Started cleaning ${domain}`});
      }
    })
    .catch((error) => {
      logger.error(`Unable to clean up ${domain}`);
      logger.error(error.message);
      logger.error(error.stack);
      res.status(500).json({message: `Unable to clean up ${domain}`});
    });

  });

  router.route('/v1/teams/:domain/channels')
  .get((req, res, next) => {
  	let domain = req.params.domain;

    Channel.find({domain}).exec()
    .then((channels) => {
      res.json(channels);
    })
    .catch((error) => {
      logger.error(`Unable to get channels for ${domain}`);
      logger.error(error.message);
      logger.error(error.stack);
      res.status(500).json({message: `Unable to get channels for ${domain}`});
    });

  });

  router.route('/v1/teams/:domain/users')
  .get((req, res, next) => {
    let domain = req.params.domain;
    let limit = req.query.limit || DEFAULT_LIMIT;
    limit = parseInt(limit);

    User.find({domain}).sort({messages: -1}).limit(limit).exec()
    .then((users) => {
      res.json(users);
    })
    .catch((error) => {
      logger.error(`Unable to get users for ${domain}`);
      logger.error(error.message);
      logger.error(error.stack);
      res.status(500).json({message: `Unable to get users for ${domain}`});
    })
  });

  router.route('/v1/teams/:domain/channels/:channelID/mentions')
  .get((req, res, next) => {

  	let domain = req.params.domain;
    let channelID = req.params.channelID;
    let threshold = req.query.threshold || DEFAULT_THRESHOLD;
    threshold = parseInt(threshold);

    Mention.find({domain, channelID, mentions: {$gte: threshold}}).exec()
    .then((mentions) => {
      res.json(mentions);
    })
    .catch((error) => {
      logger.error(`Unable to get mentions for ${domain} - ${channelID}`);
      logger.error(error.message);
      logger.error(error.stack);
      res.status(500).json({message: `Unable to get mentions for ${domain} - ${channelID}`});
    });

  });

  agenda.define('analyze', {priority: 'high', concurrency:10, lockLifetime: LOCK_LIFETIME}, (job, done) => {
    let data = job.attrs.data;
    analyzeTeam(data.team, done);
  });

  agenda.on('ready', () => {
    agenda.start();
  });

  async function rerunAnalyze(domain, teamID) {
    try {
      await cleanTeam(domain);
      agenda.schedule(new Date(Date.now() + 500), 'analyze', {team: {domain, teamID}});
    } catch (error) {
      logger.error(`Unable to rerun ${team.domain}`);
      logger.error(error.message);
      logger.error(error.stack);
    }
  }

  async function cleanTeam(domain) {
    try {
      await Mention.deleteMany({domain});
      await User.deleteMany({domain});
      await Channel.deleteMany({domain});
      await Team.deleteMany({domain});
    } catch (error) {
      logger.error(`Unable to clean ${team.domain}`);
      logger.error(error.message);
      logger.error(error.stack);
    }
  }

  async function analyzeTeam(team, done) {
    let config = createRequestHeaders(team.domain);

    try {
      logger.debug(`Beginning analysis for ${team.domain}`);

      let response = await axios.get(BASE_ARCHIVE_API + 'channels', config);
      await processChannels(response.data.channels, team);

      logger.debug(`Finished analysis for ${team.domain}`);

      done();

    } catch (error) {
      logger.error(`Unable to process ${team.domain}`);
      logger.error(error.message);
      logger.error(error.stack);

      await Team.update({domain: team.domain}, {$set: {error: true}});
      done();
    }
  }

  async function processChannels(channels, team) {
    let promises = [];
    let config = createRequestHeaders(team.domain);
    let results = [];
    for (let channel of channels) {
      let channelID = channel.channel_id;
      let url = buildMessagesURL(team.teamID, channelID, 0, 0);
      try {
        let r = await axios.get(url, config);
        results.push(r);
        await timeout(500);
      } catch (error) {
        logger.debug(`[${team.domain}] Delay for throttling`);
        await timeout(5000);
        let r = await axios.get(url, config);
        results.push(r);
      }
    }

    let url = BASE_ARCHIVE_API + 'users';
    let r = await axios.get(url, config);
    let userList = r.data.users;

    let users = {};
    for (let user of userList) {
      users[user.user_id] = {
        domain: team.domain,
        userID: user.user_id,
        name: user.profile.real_name,
        messages: 0,
        channels: new Set()
      };
    }

    let totalBatches = 0;
    let messageCount = results.reduce((acc, response) => {
      let total = response.data.total;
      if (total > MAX_MESSAGES) {
        total = MAX_MESSAGES;
      }
      totalBatches += Math.ceil(total / BATCH_SIZE);
      acc += total;
      return acc;
    }, 0);

    let batchPercent = calculateBatchPercentage(totalBatches);

    logger.debug(`[${team.domain}] messages=${messageCount}, batches=${totalBatches}, percent=${batchPercent}`);
    // logger.debug(`[${team.domain}] Batch update percentage = ${batchPercent}`);
    for (let [index, response] of results.entries()) {
      await processChannel(channels[index], response.data.total, users, team.domain, batchPercent);
    }
    logger.debug(`[${team.domain}] Finished processing all batches`);

    await updateUsers(Object.values(users), team.domain);
    await updateTeamAfterBatch(team.domain, batchPercent, true);
  }

  async function processChannel(channel, messageCount, users, domain, batchPercent) {
    logger.debug(`[${domain}] Begin processing channel ${channel.name}`);
    let channelModel = new Channel({
      teamID: channel.team,
      domain: domain,
      name: channel.name,
      channelID: channel.channel_id,
      purpose: channel.purpose.value,
      members: channel.num_members
    });

    channel = await channelModel.save();

    let batches = Math.ceil(messageCount / BATCH_SIZE);

    if (messageCount > MAX_MESSAGES) {
      batches = Math.floor(MAX_MESSAGES / BATCH_SIZE);
    }

    let config = createRequestHeaders(domain);
    for (let i = 0; i < batches; i++) {
      let url = buildMessagesURL(channel.teamID, channel.channelID, BATCH_SIZE, i * BATCH_SIZE);
      let response = await axios.get(url, config);

      await processBatch(response.data.messages, users, domain, channel.channelID);

      await updateTeamAfterBatch(domain, batchPercent, false);
      logger.debug(`[${domain}] Finished processing batch ${i + 1} for ${channel.name}`)
    }
    logger.debug(`[${domain}] Finished processing channel ${channel.name}`);
  }

  async function processBatch(messages, users, domain, channelID) {
    let mentions = {};
    for (let message of messages) {
      if (!message.user || !users[message.user]) continue;
      //TODO: add topic processing
      users[message.user].messages++;
      users[message.user].channels.add(channelID);
      let re = /<@(\w+)>/g;
      let matches = [];
      let match;
      while (match = re.exec(message.text)) {
        matches.push(match[1]);
      }

      if (matches.length) {
        for (let m of matches) {
          if (!m || !users[m]) continue;

          let key = buildMentionKey(message.user, m);
          if (!mentions[key]) {
            mentions[key] = buildMentionValue(users[message.user], users[m], domain, channelID);
          }

          mentions[key].mentions++;
        }
      }
    }

    await updateMentions(Object.values(mentions), channelID);
  }

  async function updateUsers(users, domain) {
    for (let user of users) {
      if (!user.messages || user.channels.size == 0) continue;
      let query = {
        $set: {
          domain: domain,
          userID: user.userID,
          name: user.name
        },
        $push: {
          channels: {$each: Array.from(user.channels)}
        },
        $inc: {
          messages: user.messages
        }
      };

      let search = {
        userID: user.userID
      };

      await User.update(search, query, {upsert: true});
    }
  }

  async function updateMentions(mentions, channelID) {
    for (let mention of mentions) {
      let query = {
        $set: {
          domain: mention.domain,
          channelID: mention.channelID,
          user1: mention.user1,
          userID1: mention.userID1,
          user2: mention.user2,
          userID2: mention.userID2
        },
        $inc: {
          mentions: mention.mentions
        }
      };

      let search = {
        channelID: channelID,
        userID1: mention.userID1,
        userID2: mention.userID2
      };

      await Mention.update(search, query, {upsert: true});
    }
  }

  async function updateTeamAfterBatch(domain, percent, done) {
    let query = {$inc: {progress: percent}};
    if (done) {
      query = {
        $set: {ready: true, progress: 100}
      }
    }
    await Team.update({domain}, query);
  }

  function calculateBatchPercentage(batches) {
    var batchPercent = 100 / batches;
    // Floor to a certain amount of decimal places
    batchPercent = Math.floor(batchPercent * BATCH_PERCENT_DECIMAL) / BATCH_PERCENT_DECIMAL;

    return batchPercent;
  }

  function buildMentionKey(user1, user2) {
    return user1 > user2 ? user1 + user2 : user2 + user1;
  }

  function buildMentionValue(user1, user2, domain, channelID) {
    let value = {mentions: 0, domain, channelID};
    if (user1.userID > user2.userID) {
      value.user1 = user1.name;
      value.userID1 = user1.userID;
      value.user2 = user2.name;
      value.userID2 = user2.userID;
    } else {
      value.user1 = user2.name;
      value.userID1 = user2.userID;
      value.user2 = user1.name;
      value.userID2 = user1.userID;
    }

    return value;
  }

  function buildMessagesURL(teamID, channelID, limit, offset) {
    return BASE_ARCHIVE_API + `messages?size=${limit}&team=${teamID}&channel=${channelID}&offset=${offset}`;
  }

  function getIconAddress(team) {
    var icon = team.icon.image_original || '';
    return icon;
  }

  function createRequestHeaders(domain) {
    return {
      headers: {
        'Referer': `https://${domain}.slackarchive.io`
      }
    };
  }

  function timeout(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}
