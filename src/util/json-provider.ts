import locate from './file-locator';
import * as fs from 'fs';
import { relative } from 'path';
import { to_json } from 'xmljson';

const types = {
    JS: 'js',
    JSON: 'json',
    XML: 'xml'
}

const validExtension = (path: String, extension: String) => {
    if (path.split('.')[path.split('.').length - 1] !== extension) {
        return false;
    }

    return true;
}

export const jsonLoader = (path) => {
    return new Promise((resolve, reject) => {
        if (path.split('.')[path.split('.').length - 1] !== types.JSON) {
            reject(new Error(`${path} don't have a ${types.JSON} extension`));
        }

        fs.readFile(path, 'utf8', (err, data) => {
            err ? reject(err) : resolve(JSON.parse(data));
        });
    });
}

export const jsLoader = (path) => {
    return new Promise((resolve, reject) => {
        if (!validExtension(path, types.JS)) {
            reject(new Error(`${path} don't have ${types.JS} extension`));
        }

        const data = require(`./${relative(__dirname, path)}`);
        data !== null ? resolve(data()) : reject(new Error('File not found'));
    });
};

export const xmlLoader = (path) => {
    return new Promise((resolve, reject) => {
        if (!validExtension(path, types.XML)) {
            reject(new Error(`${path} don't have ${types.XML} extension`));
        }

        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            }
            to_json(data, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    });
}

const mapper = {
    'json': jsonLoader,
    'js': jsLoader,
    'xml': xmlLoader
}

const extensionMapper = (paths) => {
    const promises = [];
    paths.map(path => {
        const ext = path.split('.')[path.split('.').length - 1];
        promises.push(mapper[ext](path));
    });

    return promises;
}

const jsonProvider = (paths: Array<String>, configName: String, type: String, extensions: Array<String> = []) => {
    return locate(paths, configName, type, extensions)
    .then(paths => Promise.all(extensionMapper(paths)))
    .then(data => Object.assign({}, ...data));
}

export default jsonProvider;