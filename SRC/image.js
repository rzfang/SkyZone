const fs = require('fs'),
      path = require('path');

const Cnst = require('./constant.json');

const CCH_PTH = path.resolve(__dirname, '..', Cnst.CCH_PTH), // cached files path.
      STTC_PTH = path.resolve(__dirname, '../WEB/www/image'), // static files path.
      MM_TP = {
        '.bmp': 'image/x-windows-bmp',
        '.gif': 'image/gif',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml' }; // mime type map.

function FileLoad (Rqst, Rspns, FlPth) {
  fs.stat(
    FlPth,
    (Err, St) => {
      if (Err) {
        Rspns.writeHead(
          404,
          { 'Content-Type': MM_TP[path.extname(FlPth)],
            'Content-Length': 0 });
        Rspns.write('');
        Rspns.end();

        return;
      }

      const Mms = St.mtimeMs || (new Date(St.mtime)).getTime(); // mtime milisecond.

      if (Rqst.headers['if-modified-since'] && Rqst.headers['if-modified-since'] !== 'Invalid Date') {
        const ChkdMs = (new Date(Rqst.headers['if-modified-since'])).getTime(); // checked milisecond.

        if (Mms < ChkdMs) {
          Rspns.writeHead(
            304,
            { 'Content-Type': MM_TP[path.extname(FlPth)],
              'Cache-Control': 'public, max-age=6000',
              'Last-Modified': Rqst.headers['if-modified-since'] });

          Rspns.write('\n');
          Rspns.end();

          return;
        }
      }

      const RdStrm = fs.createReadStream(FlPth); // ready stream.

      Rspns.writeHead(
        200,
        { 'Content-Type': MM_TP[path.extname(FlPth)],
          'Cache-Control': 'public, max-age=6000',
          'Last-Modified': (new Date(Mms + 1000)).toUTCString() });

      RdStrm.pipe(Rspns);
    });
}

function CachedFileRespond (Rqst, Rspns, UrlInfo) {
  let FlPth = UrlInfo.pathname.match(/^\/resource\/image\/(.+)/); // file name.

  if (!FlPth || FlPth.length < 2) {
    Rspns.writeHead(404, { 'Content-Type': 'text/plain' });
    Rspns.write('');
    Rspns.end();

    return;
  }

  FlPth = CCH_PTH + '/' + decodeURI(FlPth[1]);

  FileLoad(Rqst, Rspns, FlPth);
}

function StaticFileRespond (Rqst, Rspns, UrlInfo) {
  let FlPth = UrlInfo.pathname.match(/^\/image\/(.+)/); // file name.

  if (!FlPth || FlPth.length < 2) {
    Rspns.writeHead(404, { 'Content-Type': 'text/plain' });
    Rspns.write('');
    Rspns.end();

    return;
  }

  FlPth = STTC_PTH + '/' + decodeURI(FlPth[1]);

  FileLoad(Rqst, Rspns, FlPth);
}

module.exports = {
  CachedFileRespond,
  StaticFileRespond
};

