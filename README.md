SkyZone
=======

RZ's website.

## note
this project needs the key file to get everything fine.

## this project uses
* HTML, Js, CSS
* [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/)
* [Riot 4](https://riot.js.org/)
* [Sass](https://sass-lang.com/)
* [markdown-it](https://markdown-it.github.io/) for blog content handling.
* [riot-4-fun](https://github.com/rzfang/riot-4-fun), packs Riot and [Express](https://expressjs.com/) as an HTTP server.

## to be a HTTP server, this project also uses
* [nginx](https://nginx.org/)
* [PM2](https://pm2.keymetrics.io/)

### P.S. for security reason, these files don't join the git.
* nginx config.
* constant key.

## set up dev enviroment
```sh
./UTL/precompile.js
```

## run dev server
for development.
```sh
npm run dev;
```
for production.
```sh
node skyzone.js;
```
or use PM2.
```sh
pm2 start skyzone.js;
```

## package dependency
- sqlite3@5.0.0 - lock version as a short term workaround.
