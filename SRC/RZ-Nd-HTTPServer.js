const async = require('async'),
      http = require('http'),
      path = require('path'),
      url = require('url'),
      Is = require('./RZ-Js-Is'),
      Cch = require('./RZ-Nd-Cache'),
      Log = require('./RZ-Js-Log');
const { riot: {
          componentPath: CpnPth = '.' }, // component path.
        resources: {
          path: RscPth, // resource path.
          fileMask: RscFlMsk = /[^\/]+\.(js|css|tag|html|txt|xml)$/ }, // resrouce file mask.
        pages: Pgs,
        services: Svcs } = require('./RZ-Nd-HTTPServer.cfg.js');

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
function Render (Rspns, URLInfo) {
  let PthNm = URLInfo.pathname,
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
          URLInfo,
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
  @ url info object.
  @ response object. */
function ServiceResponse (RqstInfo, Rspns) {
  let MdlNm = RqstInfo.URL.pathname.replace('/service/', ''); // module name.

  if (!Svcs[MdlNm]) {
    Rspns.writeHead(404, {'Content-Type': 'application/json'});
    Rspns.write('can not found the content.');
    Rspns.end();

    return;
  }

  Svcs[MdlNm](
    RqstInfo,
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
  let URLInfo = url.parse(Rqst.url),
      RscFlChk = RscFlMsk.exec(URLInfo.pathname), // static file check.
      PstBdy = ''; // post body.

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

      if (URLInfo.pathname.indexOf('/service/') === 0) {
        let RqstInfo = { URL: URLInfo, Bdy: {} },
            LpTms; // loop times.

        PstBdy = PstBdy.replace(/(\r\n)+/g, '\n').split('\n');
        LpTms = PstBdy.length - 1;

        for (let i = 1; i < LpTms; i += 3) {
          let Ky = PstBdy[i + 0].match(/name="(.+)"/), // key.
              Vl = PstBdy[i + 1]; // value.

          if (!Ky || !Is.Array(Ky) || Ky.length < 2) { continue; }

          RqstInfo.Bdy[Ky[1]] = Vl;
        }

        return ServiceResponse(RqstInfo, Rspns);
      }

      if (URLInfo.pathname.indexOf('/.well-known/acme-challenge/') > -1) { // for SSL cert.
        return StaticFileResponse(
          Rqst,
          Rspns,
          'WEB/' + URLInfo.pathname.substr(URLInfo.pathname.lastIndexOf('/') + 1),
          'text/plain');
      }

      Render(Rspns, URLInfo);
    });
}

http.createServer(Route).listen(9004, '127.0.0.1');
Log('server has started.');
Cch.RecycleRoll(10);
