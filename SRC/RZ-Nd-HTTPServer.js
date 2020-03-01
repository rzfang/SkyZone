const async = require('async'),
      busboy = require('busboy'),
      fs = require('fs'),
      http = require('http'),
      path = require('path'),
      querystring = require('querystring'),
      requireFromString = require('require-from-string'),
      url = require('url');

const riot = require('riot'),
      ssr = require('@riotjs/ssr');

const Cch = require('./RZ-Nd-Cache'),
      Is = require('./RZ-Js-Is'),
      Log = require('./RZ-Js-Log'),
      Riot4Compile = require('./RZ-Nd-Riot4'),
      RM = require('./RZ-Js-RiotMixin');

const MM_TP = {
        '.bmp':  'image/x-windows-bmp',
        '.css':  'text/css',
        '.gif':  'image/gif',
        '.ico':  'image/x-icon',
        '.jpg':  'image/jpeg',
        '.js':   'application/javascript',
        '.png':  'image/png',
        '.riot': 'application/javascript',
        '.svg':  'image/svg+xml',
        '.tag':  'text/plain',
        '.tar':  'application/x-tar',
        '.txt':  'text/plain',
        '.xml':  'application/xml' }; // mime type map.

const { port: Pt = 9004,
        keyword: Kwd = {},
        cdn: {
          riot3: Riot3Url = 'https://cdn.jsdelivr.net/npm/riot@3.13/riot+compiler.min.js',
          riot4: Riot4Url = 'https://unpkg.com/riot@4/riot+compiler.min.js'
        },
        uploadFilePath: UpldFlPth,
        page: Pg,
        service: {
          pathPatterm: SvcPthPtrm = null,
          case: SvcCs = {}
        } = {},
        route: Rt = [] } = require('./RZ-Nd-HTTPServer.cfg.js'),
      RtLth = Rt.length || 0; // route length.

let IdCnt = 0; // id count, for giving a unique id for each request.

/* Riot 4 component Js respond. this should be the end action of a request.
  @ request object.
  @ response object.
  @ file path.
  @ expired second, default 1 hour (3600 seconds). */
function Riot4ComponentJsRespond (Rqst, Rspns, FlPth, ExprScd = 3600) {
  const Expr = ExprScd.toString(), // expire seconds string.
        { base: Bs, ext: Ext } = path.parse(FlPth),
        MmTp = MM_TP[Ext] || 'text/plain';

  if (Cch.Has(Bs)) {
    const Js = Cch.Get(Bs);
    let IfMdfSnc = Rqst.headers['if-modified-since']; // if-modified-since.

    if (!IfMdfSnc || IfMdfSnc === 'Invalid Date') {
      IfMdfSnc = (new Date()).toUTCString();
    }

    Rspns.writeHead(
      200,
      { 'Cache-Control': 'public, max-age=' + Expr,
        'Content-Length': Js.length,
        'Content-Type': MmTp,
        'Last-Modified': IfMdfSnc });
    Rspns.write(Js);
    Rspns.end();

    return;
  }

  Riot4Compile(
    FlPth,
    'esm',
    (ErrCd, Cd) => { // error code, code string.
      if (ErrCd < 0) {
        Rspns.writeHead(
          500,
          { 'Content-Type': MmTp,
            'Content-Length': 0 });
        Rspns.write('');
        Rspns.end();
        Log('can not compile Riot4 component file. ' + ErrCd, 'error');

        return;
      }

      Rspns.writeHead(
        200,
        { 'Cache-Control': 'public, max-age=' + Expr,
          // 'Content-Length': Cd.length, // Cd.length is not precise if there has non ASCII characters.
          'Content-Type': MmTp,
          'Last-Modified': (new Date()).toUTCString() });
      Rspns.write(Cd);
      Rspns.end();
    });
}

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
function PageRespond (Rqst, Rspns, UrlInfo, BdInfo) {
  const PthNm = UrlInfo.pathname,
        PgInfo = Pg[PthNm] || {}; // page info object.

  if (!PgInfo.body) {
    Rspns.writeHead(404, {'Content-Type': 'text/html'});
    Rspns.write('can not found the content.');
    Rspns.end();
    Log(PthNm + '\ncan not found the body file for this path name.', 'warn');

    return;
  }

  RM.InstanceCreate(Rqst); // create a RM instance.

  // bind RiotMixin to each component on server side rendering.
  riot.install(Cmpnt => {
    Object.assign(Cmpnt, Rqst.RM);

    Cmpnt.OnNode = (Tsk) => { Rqst.RM.OnNode(Tsk, Rqst); }; // pass Rqst object to OnNode function.
  });

  let LdCsss = '', // loading Css.
      LdScrpts = '', // loading scripts.
      MntScrpts = '',  // mount scripts.
      RiotUsed = { V3: false, V4: false }; // used riot verion.

  function HtmlRender (Bd, Clbck) {
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
  }

  function Riot3Render (Bd, Clbck) {
    const { base: Bs, ext: Ext, name: Nm } = path.parse(Bd.component); // path info.

    RiotUsed.V3 = true;
    LdScrpts += `<script type='riot/tag' src='${Bs}'></script>\n`;

    if (!Bd.initialize || !Is.Function(Bd.initialize)) {
      MntScrpts += `riot.mount('${Nm}');\n`;

      return Clbck(null, `<${Nm}><!-- this will be replaced by riot.mount. --></${Nm}>`);
    }

    Bd.initialize(
      Rqst,
      UrlInfo,
      (Cd, Dt) => {
        if (Cd < 0) { return Clbck(null, `<!-- can not render '${Nm}' component. -->`); }

        const Jsn = JSON.stringify(Dt);

        MntScrpts += `riot.mount('${Nm}', ${Jsn});\n`;

        Clbck(null, `<${Nm}><!-- this will be replaced by riot.mount. --></${Nm}>`);
      });
  }

  function Riot4Render (Bd, Clbck) {
    const { base: Bs, ext: Ext, name: Nm } = path.parse(Bd.component); // path info.

    Riot4Compile(
      './SRC/' + Bd.component,
      'node',
      (ErrCd, Cd) => {
        if (ErrCd < 0) {
          Log('riot 4 compile+ failed: ' + ErrCd, 'error');

          return Clbck(null, '');
        }

        const Cmpnts = requireFromString(Cd, Bd.component),
              Cmpnt = Cmpnts.default;

        RiotUsed.V4 = true;

        if (!Bd.initialize || !Is.Function(Bd.initialize)) {
          const { html: HTML, css: CSS } = ssr.fragments(Nm, Cmpnt, {});

          MntScrpts += `<script type='module'>\nimport ${Nm} from '/${Bs}';\nconst ${Nm}Shell = hydrate(${Nm});\n${Nm}Shell(document.querySelector('${Nm}'));\n</script>\n`;

          if (CSS) { LdCsss += `<style>${CSS}</style>\n`; }

          return Clbck(null, HTML);
        }

        Bd.initialize(
          Rqst,
          UrlInfo,
          (Cd, Dt) => {
            if (Cd < 0) { return Clbck(null, `<!-- can not render '${Nm}' component. -->`); }

            const Jsn = JSON.stringify(Dt),
                  { html: HTML, css: CSS } = ssr.fragments(Nm, Cmpnt, Dt);

            MntScrpts += `<script type='module'>import ${Nm} from '/${Bs}';\nconst ${Nm}Shell = hydrate(${Nm});\n${Nm}Shell(document.querySelector('${Nm}'));\n</script>\n`;

            if (CSS) { LdCsss += `<style>${CSS}</style>\n`; }

            return Clbck(null, HTML);
          });
      });
  }

  async.map(
    PgInfo.body,
    (Bd, Clbck) => { // body info object|string, callback function.
      const Tp = typeof Bd;

      if (Tp === 'string') {
        const { ext: Ext } = path.parse(Bd); // path info.

        switch (Ext) {
          case '.tag':
            return Riot3Render({ component: Bd }, Clbck);

          case '.riot':
            return Riot4Render({ component: Bd }, Clbck);

          case '.html':
          default:
            return HtmlRender(Bd, Clbck);
        }
      }

      if (Tp === 'object' && Bd.component && Is.String(Bd.component)) {
        const { ext: Ext } = path.parse(Bd.component); // path info.

        if (Ext === '.tag') {
          return Riot3Render(Bd, Clbck);
        }
        else if (Ext === '.riot') {
          return Riot4Render(Bd, Clbck);
        }
      }

      Clbck(null, '<!-- can not render this component. -->');
      Log('do not know how to deal this component.', 'error');
    },
    (Err, Bds) => {
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

          if (Ext === '.tag') { Scrpts += `<script type='riot/tag' src='${Pth}'></script>\n`; }
          else if (Ext === '.riot') { Scrpts += `<script type='riot' src='${Pth}'></script>\n`; }
          else { Scrpts += `<script src='${Pth}'></script>\n`; }

          LdScrpts = Scrpts + LdScrpts;
        }
      }

      // make browser supports keyword data.
      const KwdScrpt =
        '<script>\n' +
        'if (!window.Z) { window.Z = {}; }\n' +
        'if (!window.Z.Kwd) { window.Z.Kwd = {}; }\n' +
        'window.Z.Kwd = ' + JSON.stringify(Kwd) + ';\n' +
        '</script>\n';

      if (MntScrpts) {
        if (RiotUsed.V3) {
          LdScrpts = `<script src='${Riot3Url}'></script>\n` + LdScrpts + '\n';
          MntScrpts = `<script>\nriot.mixin('Z.RM', Z.RM);\nriot.compile(() => {\n${MntScrpts}});\n</script>\n`;
        }
        else if (RiotUsed.V4) {
          LdScrpts = `<script src='${Riot4Url}'></script>\n` + LdScrpts + '\n';
          MntScrpts = '<script>riot.install(Cmpnt => { Object.assign(Cmpnt, Z.RM); });</script>\n' + MntScrpts;
        }
      }

      Rspns.writeHead(200, {'Content-Type': 'text/html'});
      Rspns.write(
        "<!DOCTYPE HTML>\n<html>\n<head>\n<meta http-equiv='content-type' content='text/html; charset=utf-8'/>\n" +
        "<meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
        HdStr +
        LdCsss +
        LdScrpts +
        "</head>\n<body>\n<div id='Base'>\n" +
        Bds.join('\n') +
        '</div>\n' +
        KwdScrpt +
        Rqst.RM.StorePrint() +
        MntScrpts +
        `<script>if (top != self) { document.body.innerHTML = ''; }</script>\n` + // this defend being iframe.
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
function ServiceRespond (Rqst, Rspns, UrlInfo, BdInfo, Service) {
  if (!Service) {
    Rspns.writeHead(404, {'Content-Type': 'application/json'});
    Rspns.write('can not found the content.');
    Rspns.end();

    return;
  }

  const Prm = { // params.
      Bd: BdInfo.Flds || null,
      Fls: BdInfo.Fls || [],
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

function RouteAfterParse (Rqst, Rspns, UrlInfo, BdInfo) {
  const { pathname: PthNm } = UrlInfo,
        PthInfo = path.parse(PthNm);

  // service response.
  if (Is.RegExp(SvcPthPtrm) && SvcPthPtrm.test(PthNm)) {
    const Mthd = Rqst.method.toLowerCase();

    if (SvcCs[PthNm] && SvcCs[PthNm][Mthd] && Is.Function(SvcCs[PthNm][Mthd])) {
      return ServiceRespond(Rqst, Rspns, UrlInfo, BdInfo, SvcCs[PthNm][Mthd]);
    }
  }

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
      case 'riot4js':
      case 'resource': // static file response.
        if (!Lctn) {
          Log('the resource type route case ' + PthInfo.base + ' misses the location or mime type.', 'warn');

          continue;
        }

        FlPth = decodeURI(PthNm.charAt(0) === '/' ? PthNm.substr(1) : PthNm);
        FlPth = path.resolve(__dirname, Lctn, RtCs.nameOnly ? path.basename(FlPth) : FlPth);

        return Tp === 'riot4js' ? Riot4ComponentJsRespond(Rqst, Rspns, FlPth) : FileRespond(Rqst, Rspns, FlPth);

      case 'process': // process response.
        if (!Is.Function(Prcs)) {
          Log('the process type route case ' + PthInfo.base + 'misses the process.', 'error');

          continue;
        }

        return Prcs(Rqst, Rspns, UrlInfo);
    }
  }

  PageRespond(Rqst, Rspns, UrlInfo, BdInfo);
}

function Route (Rqst, Rspns) {
  const UrlInfo = url.parse(Rqst.url);

  if (!Rqst.Id) { Rqst.Id = (new Date()).getTime().toString() + (++IdCnt).toString(); } // give a id for each request.

  if (!Rqst.headers['content-type']) {
    return RouteAfterParse(Rqst, Rspns, UrlInfo, { Flds: null, Fls: [] });
  }

  const BsBy = new busboy({ headers: Rqst.headers, fileSize: 1024 * 1024 * 10, files: 100 }); // file size: 10mb.
  let Flds = {},
      Fls = [];

  BsBy.on(
    'file',
    (Ky, FlStrm, FlNm, Encd, Mmtp) => { // key, file stream, file name, encoding, mine type.
      const DstFlPth = UpldFlPth + '/' + FlNm; // destination file path.

      FlStrm.pipe(fs.createWriteStream(DstFlPth));
      FlStrm.on('end', () => Fls.push(DstFlPth));
    });

  BsBy.on(
    'field',
    (Ky, Vl, FldnmTrnct, VlTrnct, valTruncated, Encd, Mmtp) => { // key, value, fieldnameTruncated, fieldnameTruncated, encoding, mimetype.
      if (Ky.substr(-2) !== '[]') {
        Flds[Ky] = Vl;

        return ;
      }

      // ==== handle array type fields. ====

      const ArrKy = Ky.substr(0, Ky.length -2); // array key.

      if (!Object.prototype.hasOwnProperty.call(Flds, ArrKy)) { Flds[ArrKy] = [ Vl ]; }
      else { Flds[ArrKy].push(Vl); }
    });

  BsBy.on('filesLimit', () => { Log('upload file size is out of limitation.', 'warn'); });
  BsBy.on('finish', () => { RouteAfterParse(Rqst, Rspns, UrlInfo, { Flds, Fls }); });
  Rqst.pipe(BsBy);
}

http.createServer(Route).listen(Pt, '127.0.0.1');
Log('server has started.');
Cch.RecycleRoll(10); // 10 minutes a round.
