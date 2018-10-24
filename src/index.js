/* @flow */
import 'babel-polyfill';
const MongoClient = require('mongodb').MongoClient;
import Hapi from 'hapi';
import mongoose from 'mongoose';
import { load as loadEnv } from 'dotenv';
import routes from './Handlers';
import plugins from './plugins';
import consoleTime from 'console-stamp';
import Bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Auth } from './Models';
import { getKey } from './Services';

consoleTime(console, {
  pattern: 'dd/mm/yyyy HH:MM:ss.l',
  colors: {
    stamp: 'yellow'
  }
});

if (process.env.NODE_ENV !== 'production') {
  loadEnv();
}

const port = process.env.PORT || 3000;

const server = new Hapi.server({ port });

/*
server.route({
    method: "POST",
    path: "/Upload/upload",
    config: {
      auth: false,
      tags: ['api'],
        payload: {
            output: "stream",
            parse: true,
            allow: "multipart/form-data",
            maxBytes: 2 * 10000 * 10000
        }
    },
    handler: (request, response) => {
        var result = [];
        for(var i = 0; i < request.payload["file"].length; i++) {
            result.push(request.payload["file"][i].hapi);
            request.payload["file"][i].pipe(fs.createWriteStream(__dirname + "/uploads/" + request.payload["file"][i].hapi.filename))
        }
        return result;
    }
});
*/
server.route(routes);

const validate = async function(decoded, request) {
  if (decoded.user) {
    return { isValid: true, credentials: decoded.user };
  } else {
    return { isValid: false };
  }
};

const init = async () => {
  await server.register(plugins);

  server.auth.strategy('jwt', 'jwt', {
    key: getKey(), // Never Share your secret key
    validate: validate // validate function defined above
  });

  server.auth.default('jwt');

  server.start();
};

init()
  .then(() => {
    console.log('App Started');
  })
  .catch(err => {
    console.log(err);
  });

const MONGO_USER = process.env.MONGO_USER || 'USER';
const MONGO_PW = process.env.MONGO_PW || 'PASSWORD';
const MONGO_URI = process.env.MONGO_URI || 'localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'DBNAME';

mongoose.connect(
  `mongodb://${MONGO_USER}:${MONGO_PW}@${MONGO_URI}/${MONGO_DB_NAME}`
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('CONNECTED TO THE DB!!!');
});
