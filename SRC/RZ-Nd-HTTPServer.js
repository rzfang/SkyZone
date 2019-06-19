const async = require('async'),
      busboy = require('busboy'),
      fs = require('fs'),
      http = require('http'),
      path = require('path'),
      querystring = require('querystring'),
      // riot = require('riot'),
      url = require('url');

const Cch = require('./RZ-Nd-Cache'),
      Is = require('./RZ-Js-Is'),
      Log = require('./RZ-Js-Log');

const MM_TP = {
  '.bmp': 'image/x-windows-bmp',
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js':  'application/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.tag': 'text/plain',
  '.txt': 'text/plain',
  '.xml': 'application/xml' }; // mime type map.

const { port: Pt = 9004,
        keyword: Kwd = {},
        cdn: { riot: RiotUrl = 'https://cdn.jsdelivr.net/npm/riot@3.13/riot+compiler.min.js' },
        page: Pg,
        route: Rt } = require('./RZ-Nd-HTTPServer.cfg.js'),
      RtLth = Rt.length || 0; // route length.

let IdCnt = 0; // id count, for giving a unique id for each request.

/* HTTP file respond. this should be the end action of a request.
  @ request object.
  @ response object.
  @ file path.
  @ expired second, default 1 hour (3600 seconds). */
function FileRespond (Rqst, Rspns, FlPth, ExprScd = 3600) {
  fs.stat(
    FlPth,
    (Err, St) => {
      const MmTp = MM_TP[path.extname(FlPth)] || 'text/plain';

      if (Err) {
        Rspns.writeHead(
          404,
          { 'Content-Type': MmTp,
            'Content-Length': 0 });
        Rspns.write('');
        Rspns.end();

        return;
      }

      const Expr = ExprScd.toString(), // expire seconds string.
            Mms = St.mtimeMs || (new Date(St.mtime)).getTime(), // mtime milisecond.
            IfMdfSnc = Rqst.headers['if-modified-since']; // if-modified-since.

      if (IfMdfSnc && IfMdfSnc !== 'Invalid Date') {
        const ChkdMs = (new Date(IfMdfSnc)).getTime(); // checked milisecond.

        if (Mms < ChkdMs) {
          Rspns.writeHead(
            304,
            { 'Content-Type': MmTp,
              'Cache-Control': 'public, max-age=' + Expr,
              'Last-Modified': IfMdfSnc });

          Rspns.write('\n');
          Rspns.end();

          return;
        }
      }

      const RdStrm = fs.createReadStream(FlPth); // ready stream.

      Rspns.writeHead(
        200,
        { 'Content-Type': MmTp,
          'Cache-Control': 'public, max-age=' + Expr,
          'Last-Modified': (new Date(Mms + 1000)).toUTCString() });

      RdStrm.pipe(Rspns);
    });
}

/*
  @ response object.
  @ path name. */
function PageRespond (Rqst, Rspns, UrlInfo) {
  const PthNm = UrlInfo.pathname,
        PgInfo = Pg[PthNm] || {}; // page info object.

  if (!PgInfo.body) {
    Rspns.writeHead(404, {'Content-Type': 'text/html'});
    Rspns.write('can not found the content.');
    Rspns.end();
    Log(PthNm + '\ncan not found the body file for this path name.', 'warn');

    return;
  }

  let LdScrpts = '', // loading scripts.
      MntScrpts = '';  // mount scripts.

  function FileRender (Bd, Clbck) {
    const { base: Bs, ext: Ext, name: Nm } = path.parse(Bd); // path info.

    if (Ext === '.html') {
      Cch.FileLoad(
        path.resolve(__dirname, Bd),
        (Err, FlStr) => { // error, file string.
          if (Err < 0) {
            Clbck('FileLoad', '<!-- can not load this component. -->');
            Log(`FileLoad(${Err}) - ${Bd} - load file failed.`, 'error');

            return;
          }

          Clbck(null, FlStr);
        });

      return;
    }

    if (Ext === '.tag') {
      LdScrpts += `<script type='riot/tag' src='${Bs}'></script>\n`;
      MntScrpts += `riot.mount('${Nm}');\n`;

      return Clbck(null, `<div data-is='${Nm}'><!-- this will be replaced by riot.mount. --></div>`);
    }

    Clbck(null, `<${Nm}><!-- this will be replaced by riot.mount. --></${Nm}>`);
  }

  async.map(
    PgInfo.body,
    (Bd, Clbck) => { // body info object|string, callback function.
      const Tp = typeof Bd;

      if (Tp === 'string') { return FileRender(Bd, Clbck); }
      else if (Tp === 'object' && Bd.type === 'riot' && Bd.component && Is.String(Bd.component)) { // to do.
          const { base: Bs, ext: Ext, name: Nm } = path.parse(Bd.component); // path info.

          LdScrpts += `<script type='riot/tag' src='${Bs}'></script>\n`;

          if (!Bd.initialize || !Is.Function(Bd.initialize)) {
            MntScrpts += `riot.mount('${Nm}');\n`;

            Clbck(null, `<${Nm}><!-- this will be replaced by riot.mount. --></${Nm}>`);

            return;
          }

          Bd.initialize(
            Rqst,
            UrlInfo,
            (Cd, Dt) => {
              if (Cd < 0) { return Clbck(`<!-- can not render '${Nm}' component. -->`); }

              const Jsn = JSON.stringify(Dt);

              MntScrpts += `riot.mount('${Nm}', ${Jsn});\n`;

              Clbck(null, `<${Nm}><!-- this will be replaced by riot.mount. --></${Nm}>`);
            });

          return;
      }

      Clbck('Render', '<!-- can not render this component. -->');
      Log('do not know how to deal this component.', 'error');
    },
    (Err, BdStrs) => {
      let HdStr = ''; // head string.

      if (Err) {
        Rspns.writeHead(404, {'Content-Type': 'text/html'});
        Rspns.write('can not found the content.');
        Rspns.end();
        Log(PthNm + ' ' + PgInfo.body + '\nload the body file failed.', 'warn');

        return;
      }

      if (PgInfo.title) {
        HdStr += '<title>' + PgInfo.title + "</title>\n";
      }

      if (PgInfo.description) {
        HdStr += "<meta name='description' content='" + PgInfo.description + "'/>\n";
      }

      if (PgInfo.keywords) {
        HdStr += "<meta name='keywords' content='" + PgInfo.keywords + "'/>\n";
      }

      if (PgInfo.author) {
        HdStr += "<meta name='author' content='" + PgInfo.author + "'/>\n";
      }

      if (PgInfo.favicon) {
        HdStr += "<link rel='icon' href='favicon.ico' type='" + PgInfo.favicon + "'/>\n";
      }

      if (PgInfo.feed) {
        HdStr += "<link rel='alternate' type='application/atom+xml' title='atom' href='" + PgInfo.feed + "'/>\n";
      }

      if (PgInfo.css && PgInfo.css.length) {
        for (let i = 0; i < PgInfo.css.length; i++) {
          HdStr += "<link rel='stylesheet' type='text/css' href='" + PgInfo.css[i] + "'/>\n";
        }
      }

      if (PgInfo.js && PgInfo.js.length) {
        for (let i = 0; i < PgInfo.js.length; i++) {
          const Pth = PgInfo.js[i],
                { ext: Ext } = path.parse(Pth);
          let Scrpts = ''; // scripts.

          Scrpts += (Ext === '.tag') ?
            `<script type='riot/tag' src='${Pth}'></script>\n` :
            `<script language='javascript' src='${Pth}'></script>\n`;

          LdScrpts = Scrpts + LdScrpts;
        }
      }

      // make browser supports keyword data.
      const KwdScrpt =
        'if (!window.Z) { window.Z = {}; }\n' +
        'if (!window.Z.Kwd) { window.Z.Kwd = {}; }\n' +
        'window.Z.Kwd = ' + JSON.stringify(Kwd) + ';';

      if (MntScrpts) {
        LdScrpts = `<script language='javascript' src='${RiotUrl}'></script>\n` + LdScrpts + '\n';
        MntScrpts = `<script>\n${KwdScrpt}\nriot.mixin('Z.RM', Z.RM);\nriot.compile(() => {\n${MntScrpts}});\n</script>\n`;
      }
      else {
        MntScrpts = `<script>\n${KwdScrpt}\n</script>\n`;
      }

      Rspns.writeHead(200, {'Content-Type': 'text/html'});
      Rspns.write(
        "<!DOCTYPE HTML>\n<html>\n<head>\n<meta http-equiv='content-type' content='text/html; charset=utf-8'/>\n" +
        "<meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
        HdStr +
        LdScrpts +
        "</head>\n<body>\n<div id='Base'>\n" +
        BdStrs.join('\n') +
        '</div>\n' +
        MntScrpts +
        `<script>if (top != self) { document.body.innerHTML = ''; }</script>` + // this defend being iframe.
        '</body>\n</html>\n');
      Rspns.end();
    });
}

/*
  @ request object.
  @ response object.
  @ url info object.
  @ post body.
  @ service function. */
function ServiceRespond (Rqst, Rspns, UrlInfo, Bd, Service) {
  if (!Service) {
    Rspns.writeHead(404, {'Content-Type': 'application/json'});
    Rspns.write('can not found the content.');
    Rspns.end();

    return;
  }

  const Prm = { // params.
      Bd: Bd || null,
      Url: UrlInfo.query ? querystring.parse(UrlInfo.query) : null
    };

  Service(
    Rqst,
    Rspns,
    Prm,
    (Cd, RstObj) => { // code, result object.
      if (Cd < 0) {
        Rspns.writeHead(400, {'Content-Type': 'text/html'});
        Rspns.write(Is.String(RstObj) ? RstObj : 'error');
        Rspns.end();

        return;
      }

      if (!RstObj) {
        Rspns.writeHead(204, {'Content-Type': 'text/html'});
        Rspns.write('');
        Rspns.end();

        return;
      }

      if (Is.Function(RstObj)) { // take over whole process to end.
        RstObj(Rspns, () => { Rspns.end(); });

        return;
      }

      if (!Is.Object(RstObj)) {
        Rspns.writeHead(200, {'Content-Type': 'text/html'});
        Rspns.write(RstObj);
        Rspns.end();

        return;
      }

      Rspns.writeHead(200, {'Content-Type': 'application/json'});
      Rspns.write(JSON.stringify(RstObj));
      Rspns.end();
    });
}

function Route (Rqst, Rspns) {
  if (!Rqst.Id) { Rqst.Id = (new Date()).getTime().toString() + (++IdCnt).toString(); } // give a id for each request.

  if (Rqst.method !== 'POST') { return Then({ Flds: null, Fls: null }); }

  const BsBy = new busboy({ headers: Rqst.headers });
  let Flds = {};

  // BsBy.on(
  //   'file',
  //   function (fieldname, file, filename, encoding, mimetype) {
  //     console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
  //     file.on('data', function(data) {
  //       console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
  //     });
  //     file.on('end', function() {
  //       console.log('File [' + fieldname + '] Finished');
  //     });
  //   });

  BsBy.on(
    'field',
    (Ky, Vl, FldnmTrnct, VlTrnct, valTruncated, Encd, Mmtp) => { // key, value, fieldnameTruncated, fieldnameTruncated, encoding, mimetype.
      if (Ky.substr(-2) !== '[]') {
        Flds[Ky] = Vl;

        return ;
      }

      // ==== handle array type fields. ====

      const ArrKy = Ky.substr(0, Ky.length -2); // array key.

      if (!Flds.hasOwnProperty(ArrKy)) { Flds[ArrKy] = [ Vl ]; }
      else { Flds[ArrKy].push(Vl); }
    });

  BsBy.on('finish', () => { Then({ Flds, Fls: null }); });

  Rqst.pipe(BsBy);

  function Then ({ Flds: BdFlds, Fls }) {
    const UrlInfo = url.parse(Rqst.url),
          { pathname: PthNm } = UrlInfo,
          PthInfo = path.parse(PthNm);

    for (let i = 0; i < RtLth; i++) {
      const RtCs = Rt[i], // route case.
            {
              location: Lctn = '',
              path: Pth = '',
              process: Prcs = null,
              type: Tp = '' } = RtCs;

      if (!Pth || !Tp) {
        Log('the route case misses path or type.', 'error');

        continue;
      }

      if (!Pth.test(PthNm)) { continue; }

      let FlPth;

      switch (Tp) {
        case 'resource': // static file response.
          if (!Lctn) {
            Log('the resource type route case ' + PthInfo.base + ' misses the location or mime type.', 'warn');

            continue;
          }

          FlPth = decodeURI(PthNm.charAt(0) === '/' ? PthNm.substr(1) : PthNm);
          FlPth = path.resolve(__dirname, Lctn, RtCs.nameOnly ? path.basename(FlPth) : FlPth);

          return FileRespond(Rqst, Rspns, FlPth);

        case 'process': // process response.
        case 'service': // service response.
          if (!Is.Function(Prcs)) {
            Log('the process/service type route case ' + PthInfo.base + 'misses the process.', 'error');

            continue;
          }

          return (Tp === 'process') ?
            Prcs(Rqst, Rspns, UrlInfo) :
            ServiceRespond(Rqst, Rspns, UrlInfo, BdFlds, Prcs);
      }
    }

    PageRespond(Rqst, Rspns, UrlInfo);
  }
}

http.createServer(Route).listen(Pt, '127.0.0.1');
Log('server has started.');
Cch.RecycleRoll(10); // 10 minutes a round.
