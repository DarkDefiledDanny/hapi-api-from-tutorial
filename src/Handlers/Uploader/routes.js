/* @flow */
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




const routes = [
{
    method: 'POST',
    path: '/Uploader/SingleUpload',
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
},
{
    method: 'POST',
    path: '/Uploader/MultipleUpload',
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
},
{
    method: 'GET',
    path: '/Uploader/images/{id}',
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
             
        } catch (err) {
            return(Boom.badRequest(err.message, err));
        }
    }
}];

export default routes;