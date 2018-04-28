const async = require('async'),
      http = require('http'),
      path = require('path'),
      querystring = require('querystring'),
      url = require('url'),
      Is = require('./RZ-Js-Is'),
      Cch = require('./RZ-Nd-Cache'),
      Log = require('./RZ-Js-Log');

const { port: Pt = 9004,
        riot: {
          componentPath: CpnPth = '.' }, // component path.
        resources: {
          path: RscPth, // resource path.
          fileMask: RscFlMsk = /[^/]+\.(js|css|tag|html|txt|xml)$/ }, // resrouce file mask.
        service: {
          urlPattern: SvcUrlPtn, // service url pattern.
          cases: SvcCss = {}, // service cases.
          default: SvcDftCs = null }, // service default case.
        pages: Pgs } = require('./RZ-Nd-HTTPServer.cfg.js');

let IdCnt = 0; // id count, for giving a unique id for each request.

/*
  @ request object.
  @ response object.
  @ file path.
  @ mine type. */
function StaticFileResponse (Rqst, Rspns, FlPth, MmTp) {
  if (Rqst.headers['if-modified-since']) {
    let Dt = (new Date(Rqst.headers['if-modified-since'])).getTime(); // date number.

    if (Cch.IsFileCached(FlPth, Dt)) {
      Rspns.writeHead(
        304,
        { 'Content-Type': MmTp,
          'Cache-Control': 'public, max-age=6000',
          'Last-Modified': Rqst.headers['if-modified-since'] });
      Rspns.write('\n');
      Rspns.end();

      return;
    }
  }

  Cch.FileLoad(
    FlPth,
    function (Err, Str) {
      if (Err < 0) {
        Rspns.writeHead(404, { 'Content-Type': MmTp });
        Rspns.write('can not found the content.');
        Log(`FileLoad(${Err}) - can not load file.`, 'error');
      }
      else {
        Rspns.writeHead(
          200,
          { 'Content-Type': MmTp,
            'Cache-Control': 'public, max-age=6000',
            'Last-Modified': (new Date()).toUTCString() });
        Rspns.write(Str);
      }

      Rspns.end();
    });
}

/*
  @ response object.
  @ path name. */
function Render (Rspns, UrlInfo) {
  let PthNm = UrlInfo.pathname,
      Pg = Object.assign({}, Pgs.default, Pgs[PthNm] || {}), // page info object.
      LdScrpts = '', // loading scripts.
      MntScrpts = '';  // mount scripts.

  if (!Pg.body) {
    Rspns.writeHead(404, {'Content-Type': 'text/html'});
    Rspns.write('can not found the content.');
    Rspns.end();
    Log(PthNm + '\ncan not found the body file for this path name.', 'warn');

    return;
  }

  async.map(
    Pg.body,
    function (Bd, Clbck) { // body info object|string, callback function.
      const Tp = typeof Bd;

      if (Tp === 'string') {
        const Cmpnt = Bd.substr(0, Bd.lastIndexOf('.')), // component name.
              Ext = Bd.substr(Bd.lastIndexOf('.') + 1); // extension name.

        if (Ext === 'html') {
          Cch.FileLoad(
            path.resolve(__dirname, CpnPth, Bd),
            function (Err, FlStr) { // error, file string.
              if (Err < 0) {
                Clbck('FileLoad', '<!-- can not load this component. -->');
                Log(`FileLoad(${Err}) - ${Bd} - load file failed.`, 'error');

                return;
              }

              Clbck(null, FlStr);
            });

          return;
        }

        if (Ext === 'tag') {
          LdScrpts += `<script type='riot/tag' src='/${Bd}'></script>\n`;
          MntScrpts += `riot.mount('${Cmpnt}');\n`;

          Clbck(null, `<${Cmpnt}><!-- this will be replaced by riot.mount. --></${Cmpnt}>`);

          return;
        }
      }

      if (Tp === 'function') {
        Bd(
          UrlInfo,
          function (Cd, Rst) {
            if (Cd < 0) {
              Clbck('Render', '<!-- can not render for this task. -->');
              Log('task run failed.');

              return;
            }

            if (!Rst.Js || !Rst.HTML || !Is.String(Rst.Js) || !Is.String(Rst.HTML)) {
              Clbck('Render', '<!-- can not render for this task. -->');
              Log('task give wrong format result.', 'warn');
            }

            MntScrpts += Rst.Js;

            Clbck(null, Rst.HTML);
          });

        return;
      }

      Clbck('Render', '<!-- can not render this component. -->');
      Log('do not know how to deal this component.', 'error');
    },
    function (Err, BdStrs) {
      let HdStr = ''; // head string.

      if (Err) {
        Rspns.writeHead(404, {'Content-Type': 'text/html'});
        Rspns.write('can not found the content.');
        Rspns.end();
        Log(PthNm + ' ' + Pg.body + '\nload the body file failed.', 'warn');

        return;
      }

      if (Pg.title) {
        HdStr += '<title>' + Pg.title + "</title>\n";
      }

      if (Pg.description) {
        HdStr += "<meta name='description' content='" + Pg.description + "'/>\n";
      }

      if (Pg.keywords) {
        HdStr += "<meta name='keywords' content='" + Pg.keywords + "'/>\n";
      }

      if (Pg.author) {
        HdStr += "<meta name='author' content='" + Pg.author + "'/>\n";
      }

      if (Pg.favicon) {
        HdStr += "<link rel='icon' href='favicon.ico' type='" + Pg.favicon + "'/>\n";
      }

      if (Pg.css && Pg.css.length) {
        for (let i = 0; i < Pg.css.length; i++) {
          HdStr += "<link rel='stylesheet' type='text/css' href='" + Pg.css[i] + "'/>\n";
        }
      }

      if (Pg.js && Pg.js.length) {
        let Scrpts = '';

        for (let i = 0; i < Pg.js.length; i++) {
          const Ext = Pg.js[i].substr(Pg.js[i].lastIndexOf('.') + 1); // extension name.

          Scrpts += (Ext === 'tag') ?
            `<script type='riot/tag' src='${Pg.js[i]}'></script>\n` :
            `<script language='javascript' src='${Pg.js[i]}'></script>\n`;
        }

        LdScrpts = Scrpts + LdScrpts;
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
        `<script>\nriot.mixin('Z.RM', Z.RM);\n${MntScrpts}</script>\n` +
        '</body>\n</html>\n');
      Rspns.end();
    });
}

/*
  @ request object.
  @ response object.
  @ post body.
  @ service function. */
function ServiceResponse (Rqst, Rspns, UrlInfo, Bd, Svc) {
  if (!Svc) {
    Rspns.writeHead(404, {'Content-Type': 'application/json'});
    Rspns.write('can not found the content.');
    Rspns.end();

    return;
  }

  // ==== parse data. ====

  let PrsBd = {}; // parsed body.

  if (Rqst.headers['content-type'] && Rqst.headers['content-type'].indexOf('multipart/form-data') === 0) { // parse form data format params.
    const BdPrts = Bd.split(/-+\d+\r\n/); // body parts.

    for (let i = 0; i < BdPrts.length; i++) {
      if (!BdPrts[i]) { continue; }

      const BdPrt = BdPrts[i].match(/form-data; name="([^\s]+)"\r\n\r\n([^\s]+)\r\n/); // body part.

      if (!Array.isArray(BdPrt) || BdPrt.length < 2) { continue; }

      const V = BdPrt[2] || '';

      if (BdPrt[1].match(/\[\]$/)) {
        const Ky = BdPrt[1].replace(/\[\]$/, '');

        if (PrsBd.hasOwnProperty(Ky)) { PrsBd[Ky].push(V); }
        else { PrsBd[Ky] = [ V ]; }
      }
      else { PrsBd[BdPrt[1]] = V; }
    }
  }
  else { PrsBd = querystring.parse(Bd); }

  let Prm = { // params.
      Bd: PrsBd || null,
      Url: UrlInfo.query ? querystring.parse(UrlInfo.query) : null
    };

  Svc(
    Rqst,
    Prm,
    function (Cd, RstObj) { // code, result object.
      if (Cd < 0) {
        Rspns.writeHead(400, {'Content-Type': 'text/html'});
        Rspns.write('error');
      }
      else if (!RstObj) {
        Rspns.writeHead(200, {'Content-Type': 'text/html'});
        Rspns.write('');
      }
      else if (!Is.Object(RstObj)) {
        Rspns.writeHead(200, {'Content-Type': 'text/html'});
        Rspns.write(RstObj);
      }
      else {
        Rspns.writeHead(200, {'Content-Type': 'application/json'});
        Rspns.write(JSON.stringify(RstObj));
      }

      Rspns.end();
    });
}

function Route (Rqst, Rspns) {
  let UrlInfo = url.parse(Rqst.url),
      PstBdy = ''; // post body.

  if (!Rqst.Id) { Rqst.Id = (new Date()).getTime().toString() + (++IdCnt).toString(); } // give a id for each request.

  Rqst.on(
    'data',
    function (Chnk) { // chunk.
      PstBdy += Chnk;

      // if (body.length > 1e6) { // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      //   request.connection.destroy(); // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
      // }
    });

  Rqst.on(
    'end',
    function () {
      // ==== static file response. ====

      const RscFlChk = RscFlMsk.exec(UrlInfo.pathname); // static file check.

      if (RscFlChk && RscFlChk.length && RscFlChk.length > 1) {
        const MmTp = {
                js: 'application/javascript',
                css: 'text/css',
                tag: 'text/plain',
                html: 'text/html',
                txt: 'text/plain',
                xml: 'text/xml' }; // mine type.

        if (RscFlChk[1] === 'tag') {
          return StaticFileResponse(Rqst, Rspns, path.resolve(__dirname, CpnPth, RscFlChk[0]), MmTp[RscFlChk[1]]);
        }

        return StaticFileResponse(Rqst, Rspns, path.resolve(__dirname, RscPth, RscFlChk[0]), MmTp[RscFlChk[1]]);
      }

      // ==== service response. ====

      const SvcChk = SvcUrlPtn.exec(UrlInfo.pathname);

      if (SvcChk) { return ServiceResponse(Rqst, Rspns, UrlInfo, PstBdy, SvcCss[SvcChk[1]] || SvcDftCs || null); }

      // ====

      if (UrlInfo.pathname.indexOf('/.well-known/acme-challenge/') > -1) { // for SSL cert.
        return StaticFileResponse(
          Rqst,
          Rspns,
          'WEB/' + UrlInfo.pathname.substr(UrlInfo.pathname.lastIndexOf('/') + 1),
          'text/plain');
      }

      Render(Rspns, UrlInfo);
    });
}

http.createServer(Route).listen(Pt, '127.0.0.1');
Log('server has started.');
Cch.RecycleRoll(10);
