SkyZone
=======

RZ's website.

## note
this project needs the key file to get everything fine.

## this project uses
* HTML, Js, CSS
* [node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/)
* [Express](https://expressjs.com/)
* [Riot 4](https://riot.js.org/) with v3 compatible.
* [Sass](https://sass-lang.com/)
* [markdown-it](https://markdown-it.github.io/) for blog content handling.

## to be a HTTP server, this project also uses
* [nginx](https://nginx.org/)
* [PM2](https://pm2.keymetrics.io/)

##### P.S. for security reason, these files don't join the git.
* nginx config.
* constant key.

## set up dev enviroment
```
./UTL/precompile.js
```

## run dev server
for development.
```
npm run dev;
```
for production.
```
node skyzone.js;
```
or use PM2.
```
pm2 start skyzone.js;
```

## package dependency
- sqlite3@5.0.0 - lock version as a short term workaround.
