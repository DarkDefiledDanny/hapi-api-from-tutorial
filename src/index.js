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
import Boom from 'boom';
import path from 'path'
import fs from 'fs';
import Loki from 'lokijs';
import { imageFilter, loadCollection, uploader } from './utils';

//Uploader SETUP

const DB_NAME = 'DB.json';
const COLLECTION_NAME = 'images';
const UPLOAD_PATH = 'uploads';
const fileOptions: FileUploaderOption = { dest: `${UPLOAD_PATH}/` };
const DB = new Loki(`${UPLOAD_PATH}/${DB_NAME}`, { persistenceMethod: 'fs' });

if (!fs.existsSync(UPLOAD_PATH)) fs.mkdirSync(UPLOAD_PATH);




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

server.route({
    method: 'POST',
    path: '/SingleUpload',
    config: {
      auth: false,
      tags: ['api'],
        payload: {
            output: 'stream',
            allow: 'multipart/form-data' // important
        }
    },
    handler: async function (request, reply) {
        try {
            const data = request.payload;
            const file = data['avatar']; // accept a field call avatar

            // save the file
            const fileDetails = await uploader(file, fileOptions);

            // save data to database
            const col = await loadCollection(COLLECTION_NAME, DB);
            const result = col.insert(fileDetails);
            DB.saveDatabase();

            // return result
            return({ id: result.$loki, fileName: result.filename, originalName: result.originalname });

        } catch (err) {
            // error handling
            return(Boom.badRequest(err.message, err));
        }
    }
});

server.route({
    method: 'POST',
    path: '/MultipleUpload',
    config: {
      auth: false,
      tags: ['api'],
        payload: {
            output: 'stream',
            allow: 'multipart/form-data'
        }
    },
    handler: async function (request, reply) {
        try {
            const data = request.payload;
            const files = data['photos'];

            const filesDetails = await uploader(files, fileOptions);
            const col = await loadCollection(COLLECTION_NAME, DB);
            const result = [].concat(col.insert(filesDetails));

            DB.saveDatabase();
            return(result.map(x => ({ id: x.$loki, fileName: x.filename, originalName: x.originalname })));
        } catch (err) {
            return(Boom.badRequest(err.message, err));
        }
    }
});

server.route({
    method: 'GET',
    path: '/images/{id}',
    config: {
      auth: false,
      tags:['api']
    },
    handler: async function (request, reply) {
        try {
            const col = await loadCollection(COLLECTION_NAME, DB)
            const result = col.get(request.params['id']);

            if (!result) {
                return(Boom.notFound());
                return;
            };

            return(fs.createReadStream(path.join(UPLOAD_PATH, result.filename)))
               // .header('Content-Type', result.mimetype); // important
        } catch (err) {
            return(Boom.badRequest(err.message, err));
        }
    }
});


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
