const async = require('async'),
      http = require('http'),
      path = require('path'),
      querystring = require('querystring'),
      // riot = require('riot'),
      url = require('url');

const Cch = require('./RZ-Nd-Cache'),
      Img = require('./image.js'),
      Is = require('./RZ-Js-Is'),
      Log = require('./RZ-Js-Log');

const { port: Pt = 9004,
        keyword: Kwd = {},
        cdn: { riot: RiotUrl = 'https://cdn.jsdelivr.net/npm/riot@3.13/riot+compiler.min.js' },
        page: Pg,
        route: Rt } = require('./RZ-Nd-HTTPServer.cfg.js'),
      RtLth = Rt.length || 0; // route length.

let IdCnt = 0; // id count, for giving a unique id for each request.

/*
  @ request object.
  @ response object.
  @ file path.
  @ mine type. */
function StaticFileRespond (Rqst, Rspns, FlPth, MmTp = '') {
  if (Rqst.headers['if-modified-since'] && Cch.IsFileCached(FlPth)) {
    Rspns.writeHead(
      304,
      { 'Content-Type': MmTp,
        'Cache-Control': 'public, max-age=3600', // 1 hour.
        'Last-Modified': Rqst.headers['if-modified-since'] });
    Rspns.write('\n');
    Rspns.end();

    return;
  }

  if (path.extname(FlPth) === '.ico') {
    return Img.FileLoad(Rqst, Rspns, FlPth);
  }

  Cch.FileLoad(
    FlPth,
    (Err, Str, Dt) => {
      if (Err < 0) {
        Rspns.writeHead(404, { 'Content-Type': MmTp });
        Rspns.write('can not found the content.');
        Log(`FileLoad(${Err}) - can not load file. ${FlPth}`, 'error');
      }
      else {
        Rspns.writeHead(
          200,
          { 'Content-Type': MmTp,
            'Cache-Control': 'public, max-age=3600', // 1 hour.
            'Last-Modified': (new Date(Dt)).toUTCString() });
        Rspns.write(Str);
      }

      Rspns.end();
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
          const { base: Bs, ext: Ext } = path.parse(PgInfo.js[i]); // extension name.
          let Scrpts = ''; // scripts.

          Scrpts += (Ext === '.tag') ?
            `<script type='riot/tag' src='${Bs}'></script>\n` :
            `<script language='javascript' src='${PgInfo.js[i]}'></script>\n`;

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
function ServiceRespond (Rqst, Rspns, UrlInfo, Bd, Svc) {
  if (!Svc) {
    Rspns.writeHead(404, {'Content-Type': 'application/json'});
    Rspns.write('can not found the content.');
    Rspns.end();

    return;
  }

  // ==== parse data. ====

  let PrsBd = {}; // parsed body.

  if (Rqst.headers['content-type'] && Rqst.headers['content-type'].indexOf('multipart/form-data') === 0) { // parse form data format params.

    const BrkStr = Bd.substr(0, Bd.indexOf('\n') - 1); // broken string.
    let BdPrts = Bd.split(BrkStr);

    BdPrts = BdPrts.slice(1, BdPrts.length - 1);

    for (let i = 0; i < BdPrts.length; i++) {
      if (!BdPrts[i]) { continue; }

      const BdPrt = BdPrts[i].match(/form-data; name="([^\s]+)"\r\n\r\n([.\S\r\n]+)\r\n$/); // body part.

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
  let UrlInfo = url.parse(Rqst.url),
      PstBdy = ''; // post body.

  if (!Rqst.Id) { Rqst.Id = (new Date()).getTime().toString() + (++IdCnt).toString(); } // give a id for each request.

  Rqst.on(
    'data',
    (Chk) => { // chunk.
      PstBdy += Chk;

      // if (body.length > 1e6) { // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      //   request.connection.destroy(); // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
      // }
    });

  Rqst.on(
    'end',
    () => {
      for (let i = 0; i < RtLth; i++) {
        const RtCs = Rt[i], // route case.
              {
                location: Lctn = '',
                mimeType: MmTp = '',
                path: Pth = '',
                process: Prcs = null,
                type: Tp = '' } = RtCs;

        if (!Pth || !Tp) {
          Log('the route case misses path or type.', 'error');

          continue;
        }

        if (!Pth.test(UrlInfo.pathname)) { continue; }

        switch (Tp) {
          case 'resource': // static file response.
            if (!Lctn || !MmTp) {
              Log(
                'the resource type route case ' + path.basename(UrlInfo.pathname) +
                ' misses the location or mime type.',
                'warn');

              continue;
            }

            return StaticFileRespond(Rqst, Rspns, path.resolve(__dirname, Lctn, path.basename(UrlInfo.pathname)), MmTp);

          case 'process': // process response.
          case 'service': // service response.
            if (!Is.Function(Prcs)) {
              Log('the process/service type route case ' + path.basename(UrlInfo.pathname) + 'misses the process.',
                  'error');

              continue;
            }

            return (Tp === 'process') ?
              Prcs(Rqst, Rspns, UrlInfo) :
              ServiceRespond(Rqst, Rspns, UrlInfo, PstBdy, Prcs);
        }
      }

      // ====

      if (UrlInfo.pathname.indexOf('/.well-known/acme-challenge/') > -1) { // for SSL cert.
        return StaticFileRespond(
          Rqst,
          Rspns,
          'WEB/' + UrlInfo.pathname.substr(UrlInfo.pathname.lastIndexOf('/') + 1),
          'text/plain');
      }

      PageRespond(Rqst, Rspns, UrlInfo);
    });
}

http.createServer(Route).listen(Pt, '127.0.0.1');
Log('server has started.');
Cch.RecycleRoll(10);
