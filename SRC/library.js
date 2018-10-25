const cookie = require('cookie'),
      crypto = require('crypto'),
      fs = require('fs'),
      path = require('path'),
      tarStream = require('tar-stream');

const Cch = require('./RZ-Nd-Cache'),
      Cnst = require('./constant.json'),
      Img = require('./image'),
      Is = require('./RZ-Js-Is'),
      Kwd = require('./keyword.json'),
      SQLite = require('./RZ-Nd-SQLite');

const ADMIN_SESSION_EXPIRE = 60 * 60 * 12, // admin session expire.
      ADMIN_SESSION_KEY = 'SSN', // admin session key.
      BLG_PTH = path.resolve(__dirname, '..', Cnst.BLG_PTH), // blog files path.
      CCH_PTH = path.resolve(__dirname, '..', Cnst.CCH_PTH), // cache files path.
      DB_PTH = path.resolve(__dirname, '..', Cnst.DB_PTH), // Sqlite database path.
      FD_PTH = path.resolve(__dirname, '..', Cnst.FD_PTH); // feed.xml path.

let Cnt = 0; // a count for any situation to create an unique thing.

/* extend original callback function to be packed.
  @ original callback function.
  @ extra action function.
  < new callback function. */
function PackedEnd (End, ExtrActn) {
  return function () {
    if (typeof ExtrActn === 'function') { ExtrActn(); }

    if (typeof End === 'function') { End.apply(this, arguments); }
  }
}

/* create a Uuid format string.
  @ type, the type of UUID, can be 13, 22, 32, 36, default 13.
  < Uuid format string. */
function MakeId (Tp = 13) {
  const Hmac = crypto.createHmac('sha256', 'something unique.');
  const TpMp = [ 13, 22, 32, 36, 64 ]; // type map.

  Hmac.update((new Date()).getTime().toString() + (++Cnt).toString());

  let Id = Hmac.digest('hex').toString();

  if (!Is.Number(Tp) || !TpMp.indexOf(Tp) < 0) { Tp = 13; }

  switch (Tp) {
    case 22:
      Id = Id.substr(0, 22);
      break;

    case 32:
      Id = Id.substr(0, 32);
      break;

    case 36:
      Id = Id.substr(0, 8) + '-' + Id.substr(8, 4) + '-' + Id.substr(12, 4) + '-' + Id.substr(16, 4) + '-' +
           Id.substr(20, 12);
       break;

    case 13:
      Id = Id.substr(0, 13);
      break;

    // default: // 64 don't do anything.
  }

  return Id.substr(0, Id.length - Cnt.toString().length) + Cnt.toString(); // use Cnt to make id unique.
}

function GetIp (Rqst) {
  let HdrIps = Rqst.headers['x-forwarded-for'] && Rqst.headers['x-forwarded-for'].split(',');

  return (HdrIps && HdrIps.length && HdrIps.pop()) ||
         Rqst.connection.remoteAddress ||
         Rqst.socket.remoteAddress ||
         Rqst.connection.socket.remoteAddress ||
         '';
}

function Trim (Str) {
  return Str.replace(/^\s+|\s+$/g, '');
}

function GetDatetime (Scd) {
  const Dt = Scd ? new Date(Scd * 1000) : new Date(); // datetime object.

  return Dt.getFullYear().toString() + '-' +
        (Dt.getMonth() + 1).toString().padStart(2, '0') + '-' +
        Dt.getDate().toString().padStart(2, '0') + ' ' +
        Dt.getHours().toString().padStart(2, '0') + ':' +
        Dt.getMinutes().toString().padStart(2, '0') + ':' +
        Dt.getSeconds().toString().padStart(2, '0');
}

/* encode/decode XML/HTML special chars.
  @ string to parse'Txt' = Text to parse.
  @ flag to reserse escape. true|decode. optional, default false.
  < parsed string, or '' as error. */
function XmlEscape (Str, Flg = false) {
  let RE; // RegExp.
  let ChrMp = {
    "'": '&apos;',
    '"': '&quot;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  }; // char map.

  if (Flg) {
    const Kys = Object.keys(ChrMp),
          Lth = Kys.length;
    let RvChrMp = {};

    for (let i = 0; i < Lth; i++) {
      const Ky = Kys[i];

      RvChrMp[ChrMp[Ky]] = Ky;
    }

    ChrMp = RvChrMp;
  }

  RE = new RegExp(Object.keys(ChrMp).join('|'), 'g');

  return Str.replace(RE, Ch => ChrMp[Ch] );
}

/*
  @ array.
  @ filled string.
  @ separated string. */
function MakeCircularString (Arr, FlStr = '?', SpStr = ', ') {
  return (new Array(Arr.length)).fill(FlStr).join(SpStr)
}

const Blog = {
  List: (Rqst, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    let TgIds = []; // tag ids.

    if (Prm.TgIDA && Is.Array(Prm.TgIDA)) {
      for (let i = 0; i < Prm.TgIDA.length; i++) {
        if (Is.UUID(Prm.TgIDA[i])) { TgIds.push(Prm.TgIDA[i]); }
      }
    }

    let Prt = TgIds.length ? MakeCircularString(TgIds, '?', ', ') : '', // part.
        SQL;

    if (parseInt(Prm.Cnt, 10)) {
      SQL = TgIds.length ?
            'SELECT COUNT(Blog.id) AS Cnt FROM Blog, TagLink WHERE Blog.id = TagLink.link_id AND TagLink.tag_id IN (' + Prt + ');' :
            'SELECT COUNT(Blog.id) AS Cnt FROM Blog;';

      return Db.Query(SQL, TgIds)
        .then((Rst) => {
          if (!Rst || !Is.Array(Rst)) { return PckEnd(-1, Kwd.RM.NoSuchData); }

          PckEnd(0, Kwd.RM.Done, Rst[0].Cnt);
        })
        .catch(Cd => { PckEnd(Cd, Kwd.RM.DbCrash); });
    }

    const Lmt = Prm.Lmt && parseInt(Prm.Lmt, 10) || 10,
          Ofst = Prm.Ofst && parseInt(Prm.Ofst, 10) || 0,
          QryPrm = TgIds.concat([ Lmt, Ofst ]);

    if (TgIds.length) {
      SQL = 'SELECT Blog.id AS ID, Blog.title AS Ttl, Blog.summary as Smry, Blog.type AS Tp, Blog.datetime AS Dt, Blog.password AS Pswd ' +
            'FROM Blog, TagLink WHERE Blog.id = TagLink.link_id AND TagLink.tag_id IN (' +
            Prt + ') ORDER BY Blog.datetime DESC LIMIT ? OFFSET ?;';
    }
    else {
      SQL = 'SELECT id AS ID, title AS Ttl, summary as Smry, type AS Tp, datetime AS Dt, password AS Pswd ' +
            'FROM Blog ORDER BY datetime DESC LIMIT ? OFFSET ?;';
    }

    let FnlRst; // final result.

    Db.Query(SQL, QryPrm)
      .then(Rst => {
        if (!Rst || !Is.Array(Rst)) { return PckEnd(-2, Kwd.RM.NoSuchData); }

        let Ids = [];

        for(let i = 0; i < Rst.length; i++) {
          if (Rst[i].Pswd) { Rst[i].Pswd = '???'; } // hide passowrd.

          Ids.push(Rst[i].ID); // collect ids for tag appending.
        }

        FnlRst = Rst;
        SQL = 'SELECT Tag.id AS TgID, Tag.name AS TgNm, TagLink.link_id AS TgtID FROM Tag, TagLink ' +
              'WHERE Tag.id = TagLink.tag_id AND TagLink.link_id IN (' +
              MakeCircularString(Ids, '?', ', ') + ') ORDER BY TgtID;';

        // PckEnd(0, Kwd.RM.Done, Rst);
        return Db.Query(SQL, Ids);
      })
      .then((Rst) => {
        if (!Rst || !Is.Array(Rst)) { return PckEnd(-2, Kwd.RM.NoSuchData); }

        for (let i = 0; i < Rst.length; i++) { // append tag info to each blog.
          const Rltn = Rst[i]; // tag, blog relation. Rltn

          for (let j = 0; j < FnlRst.length; j++) {
            let Blg = FnlRst[j];

            if (Rltn.TgtID === Blg.ID) {
              if (!Blg.Tg) { Blg.Tg = []; }

              Blg.Tg.push({ ID: Rltn.TgID, Nm: Rltn.TgNm })
            }
          }
        }

        PckEnd(0, Kwd.RM.Done, FnlRst);
      })
      .catch(Cd => { PckEnd(Cd, Kwd.RM.DbCrash); });
  },
  AdminList: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kw.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    // ==== total count. ====

    if (parseInt(Prm.Cnt, 10)) {
      Db.Query('SELECT COUNT(id) As Cnt FROM Blog;')
        .catch(Cd => { PckEnd(-3, Kwd.RM.DbCrash, Cd); })
        .then(DbRst => {
          return (!DbRst || !DbRst[0] || !DbRst[0].Cnt) ?
            PckEnd(-4, Kwd.RM.NoSuchData) :
            PckEnd(1, Kwd.RM.Done, DbRst[0].Cnt);
        });

      return;
    }

    // ==== one page. ====

    const Lmt = Prm.Lmt && parseInt(Prm.Lmt, 10) || 10, // limit.
          Ofst = Prm.Ofst && parseInt(Prm.Ofst, 10) || 0; // offset.

    let SQL = 'SELECT BlogComment.blog_id, COUNT(BlogComment.id) AS CmtCnt FROM BlogComment GROUP BY BlogComment.blog_id';

    SQL = 'SELECT Blog.id AS ID, Blog.title AS Ttl, Blog.file AS Fl, Blog.type AS Tp, Blog.datetime AS Dt, ' +
          'Blog.password AS Pswd, Blog.summary AS Smry, BlogCmt.CmtCnt ' +
          'FROM Blog LEFT JOIN (' + SQL + ') AS BlogCmt ON Blog.id = BlogCmt.blog_id ORDER BY Dt DESC LIMIT ?, ?;';

    Db.Query(SQL, [ Ofst, Lmt ])
      .catch(Cd => { PckEnd(-5, Kwd.RM.DbCrash, Cd); })
      .then((DbRst) => {
        if (!DbRst || !Is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        let Ids = [],
            i = 0;

        while (DbRst[i]) {
          let One = DbRst[i];

          // ==== error handle. ====

          if (!Is.Number(One.CmtCnt)) { One.CmtCnt = 0; }

          if (!Is.String(One.Smry)) { One.Smry = ''; }

          One.Fl = XmlEscape(One.Fl, true); // once no html special char case, this can be removed.
          One.Tg = [];

          // ====

          Ids.push(One.ID);

          i++;
        }

        return new Promise((Resolve, Reject) => { Resolve({ Blgs: DbRst, BlgIds: Ids }); }); // blogs, blog ids.
      })
      .then(({ Blgs, BlgIds }) => { // step result.
        SQL = 'SELECT Tag.id AS ID, Tag.name AS Nm, TagLink.link_id AS BlogID ' +
              'FROM TagLink, Tag WHERE TagLink.tag_id = Tag.id AND TagLink.link_id ' +
              'IN (' + MakeCircularString(BlgIds) + ');';

        Db.Query(SQL, BlgIds)
          .catch(Cd => { PckEnd(-7, Kwd.RM.DbCrash, Cd); })
          .then((DbRst) => {
            if (!DbRst || !Is.Array(DbRst) || !DbRst.length) { return PckEnd(2, Kwd.RM.Done, Blgs); }

            for (let i = 0; i < DbRst.length; i++) {
              for (let j = 0; j < Blgs.length; j++) {
                let Rcd = DbRst[i], // record of tag - blog.
                    Blg = Blgs[j]; // blog.

                if (Rcd.BlogID === Blg.ID) { Blg.Tg.push({ ID: Rcd.ID, Nm: Rcd.Nm }); }
              }
            }

            PckEnd(1, Kwd.RM.Done, Blgs);
          });
      });
  },
  UnpublishedList: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kw.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    fs.readdir(
      BLG_PTH,
      (Err, Fls) => {
        if (Err) { return PckEnd(-3, Kwd.RM.SystemError); }

        Db.Query('SELECT file FROM Blog;')
          .catch(Cd => { PckEnd(-4, Kwd.RM.DbCrash, Cd); })
          .then(DbRst => {
            for (let i = 0; i < DbRst.length; i++) {
              if (!DbRst[i].file) { continue; }

              const Idx = Fls.indexOf(DbRst[i].file);

              if (Idx < 0) { continue; }

              Fls.splice(Idx, 1);
            }

            PckEnd(0, Kwd.RM.Done, Fls);
          });
      });
  },
  Update: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kw.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });
  },
  CommentList: (Rqst, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    if (!Prm.ID || !Is.UUID(Prm.ID)) { return End(-1, Kwd.RM.StrangeValue); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (parseInt(Prm.Cnt, 10)) {
      return Db.TableRows('BlogComment', { Fld: 'blog_id', Prms: [ Prm.ID ]})
        .then(Cnt => {
          if (Cnt < 1) { return PckEnd(-2, Kwd.RM.NoSuchData); }

          PckEnd(1, Kwd.RM.Done, Cnt);
        })
        .catch(Cd => { PckEnd(Cd * 10 + -3, Kwd.RM.DbCrash); });
    }

    const Lmt = Prm.Lmt && parseInt(Prm.Lmt, 10) || -1,
          Ofst = Prm.Ofst && parseInt(Prm.Ofst, 10) || 0,
          SQL = 'SELECT id AS ID, name AS Nm, datetime AS Dt, comment AS Cmt FROM BlogComment ' +
                'WHERE blog_id = ? ORDER BY Dt LIMIT ? OFFSET ?';

    Db.Query(SQL, [ Prm.ID, Lmt, Ofst ])
      .then(Rst => {
        if (!Rst) { return PckEnd(-4, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, Rst);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -5, Kwd.RM.DbCrash); });
  },
  CommentLeave: (Rqst, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Nm = Prm.Nm && Is.String(Prm.Nm) && Trim(Prm.Nm) || '',
          Cmt = Prm.Cmt && Is.String(Prm.Cmt) && Trim(Prm.Cmt) || '';

    if (!Nm || !Prm.Ml || !Is.EMail(Prm.Ml) || !Cmt || !Prm.TgtID || !Is.UUID(Prm.TgtID)) {
      return End(-1, Kwd.RM.StrangeValue);
    }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    Db.IsARowExist('Blog', 'id', Prm.TgtID)
      .then(IsExt => {
        if (!IsExt) { return PckEnd(-3, Kwd.RM.NoSuchData); }

        const SQL = 'INSERT INTO BlogComment (id, name, mail, ip, datetime, comment, blog_id) ' +
                    'VALUES (?, ?, ?, ?, ?, ?, ?);';

        return Db.Query(SQL, [ MakeId(13), Nm, Prm.Ml, GetIp(Rqst), GetDatetime(), Cmt, Prm.TgtID ]);
      })
      .then((a, b, c) => { PckEnd(0, Kwd.RM.Done); })
      .catch(Cd => { PckEnd(-4, Kwd.RM.DbCrash, Cd); });
  },
  FeedPublish: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kw.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });
    const SQL = 'SELECT id AS ID, title AS Ttl, summary as Smry, datetime AS Dt FROM Blog WHERE password = \'\' ' +
                'ORDER BY Dt DESC LIMIT 10;';

    Db.Query(SQL, [])
      .then(Rst => {
        if (!Rst || !Is.Array(Rst)) { return PckEnd(-3, Kwd.RM.NoSuchData); }

        let XML = '';

        for (let i = 0; i < Rst.length; i++) {
          const { ID, Ttl, Smry, Dt } = Rst[i]; // entry.
          const EdtDt = Dt.replace(' ', 'T') + 'Z'; // edited date time string.
          const EdtSmry = XmlEscape(Smry);
          const EdtTtl = XmlEscape(Ttl);

          XML += `<entry>
            <title>${EdtTtl}</title>
            <id>${ID}</id>
            <updated>${EdtDt}</updated>
            <summary>${EdtSmry}</summary>
            <link href="https://skyzone.zii.tw/text.php?b=${ID}"/>
            <link rel="alternate" type="text/html" href="https://skyzone.zii.tw/text.php?b=${ID}"/>
            <author><name>RZ</name><email>skywine13@hotmail.com</email></author>
            </entry>
            `;
        }

        const LstDt = GetDatetime().replace(' ', 'T') + 'Z';

        XML = `<?xml version="1.0" encoding="UTF-8"?>
          <feed xmlns="http://www.w3.org/2005/Atom">
          <title>空域</title>
          <subtitle>RZ 的發呆空間</subtitle>
          <link rel="self" href="https://skyzone.zii.tw/"/>
          <link rel="alternate" type="text/html" href="http://skyzone.zii.tw/"/>
          <id>urn:uuid:28b28433-3f00-4a88-96ae-86bcc7fe16ae</id>
          <updated>${LstDt}</updated>
          ${XML}
          </feed>
          `;

        fs.writeFile(
          FD_PTH,
          XML,
          (Err) => {
            if (Err) { return PckEnd(-4, Kwd.RM.UploadFail); }

            PckEnd(0, Kwd.RM.Done, LstDt);
          });
      });
  },
  Read: (Rqst, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    if (!Is.String(Prm.Id)) { return End(-1, Kwd.RM.StrangeValue); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); }); // packed end function.
    let SQL = 'SELECT Blog.id AS Id, Blog.title AS Ttl, Blog.file AS Fl, Blog.summary AS Smry, Blog.type AS Tp, ' +
              'Blog.datetime AS Dt, Blog.password AS Pswd, COUNT(BlogComment.id) AS CmtCnt ' +
              'FROM Blog LEFT JOIN BlogComment ON Blog.id = BlogComment.blog_id ' +
              'WHERE Blog.id = ? GROUP BY Ttl, Fl, Tp, Dt, Pswd;',
        SqlRst; // SQL result.

    Db.Query(SQL, [ Prm.Id ])
      .then(Rst => {
        if (!Rst || !Is.Array(Rst) || !Rst.length) { return PckEnd(-3, Kwd.RM.NoSuchData); }

        SqlRst = Rst[0];
        SQL = 'SELECT Tag.id AS ID, Tag.name AS Nm FROM Tag, TagLink ' +
              'WHERE Tag.id = TagLink.tag_id AND TagLink.link_id = ?;';

        return Db.Query(SQL, [ SqlRst.Id ]);
      })
      .then(Rst => {
        if (Rst || Is.Array(Rst) || Rst.length) { SqlRst.Tgs = Rst; }

        switch (SqlRst.Tp) {
          case 'text':
            SqlRst.Url = 'https://skyzone.zii.tw/text?b=' + SqlRst.Id;

            Cch.FileLoad(
              `${BLG_PTH}/${SqlRst.Fl}`,
              (Cd, Str) => {
                if (Cd < 0) { return PckEnd(1, Kwd.RM.SystemError); }

                SqlRst.Info = Str;

                PckEnd(0, Kwd.RM.Done, SqlRst);
              });

            return;

          case 'image':
            SqlRst.Url = 'https://skyzone.zii.tw/image?b=' + SqlRst.Id;

            Blog.ImageRead(SqlRst, Cd => { PckEnd(Cd, (Cd < 0) ? Kwd.RM.SystemError : Kwd.RM.Done, SqlRst); });

            return;

          case 'images':
          default:
            return PckEnd(1, Kwd.RM.StepTest);
        }
      })
      .catch(Cd => { PckEnd(Cd, Kwd.RM.DbCrash); });
  },
  /*
    @ SQL result.
    @ callback(Cd) function.
      @ result code. */
  ImageRead: (SqlRst, Then) => {
    if (!SqlRst || !SqlRst.Fl) { return Then(-1); }

    const FlStrm = fs.createReadStream(`${BLG_PTH}/${SqlRst.Fl}`);

    let Extr = tarStream.extract();

    SqlRst.Info = { Str: '', ImgUrl: '' };

    Extr.on('entry', (Hdr, Strm, Next) => { // file header in the tar; stream object; callback function.
      if (Hdr.name === 'comment.txt') {
        let Chks = []; // chunks.

        Strm.on('data', Chk => { Chks.push(Chk); });

        Strm.on(
          'end',
          () => {
            SqlRst.Info.Str = Chks.join('').toString('utf8');

            Next();
          });
      }
      else {
        const TarNm = SqlRst.Fl.replace('.tar', ''),
              Pth = `${CCH_PTH}/${TarNm}-${Hdr.name}`, // image file path.
              Url = `/resource/image/${TarNm}-${Hdr.name}`; // image file url.

        SqlRst.Info.ImgUrl = Url;

        fs.stat(
          Pth,
          (Err, St) => {
            if (Err || !St.mtime || Hdr.mtime > St.mtime) {
              let ImgFlStrm = fs.createWriteStream(Pth, { encoding: 'binary', flags: 'w' });

              Strm.on('end', Next);
              Strm.pipe(ImgFlStrm);

              return;
            }

            Next();
          });
      }

      Strm.resume();
    });

    Extr.on('finish', () => { Then(0); });
    FlStrm.pipe(Extr);
  },
  ImagesRead: () => {

  }
};

const Tag = {
  List: (Rqst, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (parseInt(Prm.Cnt, 10)) {
      return Db.TableRows('Tag')
        .then(Cnt => {
          if (Cnt < 1) { return PckEnd(-2, Kwd.RM.NoSuchData); }

          PckEnd(1, Kwd.RM.Done, Cnt);
        })
        .catch(Cd => { PckEnd(Cd * 10 + -3, Kwd.RM.DbCrash); });
    }

    const Lmt = Prm.Lmt && parseInt(Prm.Lmt, 10) || -1,
          Ofst = Prm.Ofst && parseInt(Prm.Ofst, 10) || 0,
          SQL = 'SELECT id AS ID, name AS Nm FROM Tag ORDER BY Nm LIMIT ? OFFSET ?;';

    Db.Query(SQL, [ Lmt, Ofst ])
      .then(Rst => {
        if (!Rst) { return PckEnd(-4, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, Rst);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -5, Kwd.RM.DbCrash); });
  },
  Add: (Rqst, Rspns, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (!Ssn.IsLogged(Rqst, Rspns)) { return PckEnd(-1, Kwd.RM.NotLogin); }

    if (!Prm.Nm || !Is.String(Prm.Nm)) { return PckEnd(-2, Kwd.RM.StrangeValue); }

    const Id = MakeId(),
          SQL = 'INSERT INTO Tag (id, name) VALUES (?, ?);';

    Db.Query(SQL, [ Id, Prm.Nm ])
      .then(Rst => {
        if (!Rst) { return PckEnd(-3, Kwd.RM.DbCrash); }

        PckEnd(0, Kwd.RM.Done, Id);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -4, Kwd.RM.DbCrash); });
  },
  Rename: (Rqst, Rspns, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (!Ssn.IsLogged(Rqst, Rspns)) { return PckEnd(-1, Kwd.RM.NotLogin); }

    if (!Prm.ID || !Is.String(Prm.ID) || !Prm.Nm || !Is.String(Prm.Nm)) { return PckEnd(-2, Kwd.RM.StrangeValue); }

    const SQL = 'UPDATE Tag SET name = ? WHERE id = ?;';

    Db.Query(SQL, [ Prm.Nm, Prm.ID ])
      .then(Rst => {
        if (!Rst) { return PckEnd(-3, Kwd.RM.DbCrash); }

        PckEnd(0, Kwd.RM.Done);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -4, Kwd.RM.DbCrash); });
  },
  Delete: (Rqst, Rspns, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (!Ssn.IsLogged(Rqst, Rspns)) { return PckEnd(-2, Kwd.RM.NotLogin); }

    if (!Prm.ID || !Is.String(Prm.ID)) { return PckEnd(-3, Kwd.RM.StrangeValue); }

    Db.Transaction('BEGIN')
      .then(() => { return Db.Query('DELETE FROM TagLink WHERE tag_id = ?;', [ Prm.ID ]); })
      .then(() => { return Db.Query('DELETE FROM Tag WHERE id = ?;', [ Prm.ID ]) })
      .catch(Cd => { PckEnd(-4, Kwd.RM.DbCrash, Cd); })
      .then(() => {
        Db.Transaction('COMMIT');
        PckEnd(0, Kwd.RM.Done);
      });
  }
};

const Msg = { // message.
  List: (Rqst, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (parseInt(Prm.Cnt, 10)) {
      return Db.TableRows('Message')
        .then(Cnt => {
          if (Cnt < 1) { return PckEnd(-2, Kwd.RM.NoSuchData); }

          PckEnd(1, Kwd.RM.Done, Cnt);
        })
        .catch(Cd => { PckEnd(Cd * 10 + -3, Kwd.RM.DbCrash); });
    }

    const Lmt = Prm.Lmt && parseInt(Prm.Lmt, 10) || 5, // default 5.
          Ofst = Prm.Ofst && parseInt(Prm.Ofst, 10) || 0,
          PsV0 = 'CASE WHEN ChnDt IS NULL THEN datetime ELSE ChnDt END AS ChnDt', // parsed value 0.
          PsV1 = 'CASE WHEN ChnCnt IS NULL THEN 0 ELSE  ChnCnt END AS ChnCnt',
          SbSQL = 'SELECT COUNT(id) AS ChnCnt, MAX(datetime) AS ChnDt, target AS ChnTgt FROM Message GROUP BY ChnTgt', // sub SQL.
          SQL = `SELECT id AS ID, name AS Nm, mail AS Ml, ip AS IP, datetime AS Dt, ${PsV0}, ${PsV1}, message AS Msg ` +
                `FROM Message LEFT JOIN (${SbSQL}) AS Chn ON Chn.ChnTgt = ID WHERE target IS NULL ` +
                `ORDER BY ChnDt DESC LIMIT ? OFFSET ?;`;

    Db.Query(SQL, [ Lmt, Ofst ])
      .then(Rst => {
        if (!Rst) { return PckEnd(-4, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, Rst);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -5, Kwd.RM.DbCrash); });
  },
  ChainList: (Rqst, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (!Prm.ID || !Is.UUID(Prm.ID)) { return PckEnd(-2, Kwd.RM.StrangeValue); }

    if (parseInt(Prm.Cnt, 10)) {
      return Db.TableRows('Message', { Fld: 'target', Prms: [ Prm.ID ]})
        .then(Cnt => { PckEnd(1, Kwd.RM.Done, Cnt); })
        .catch(Cd => { PckEnd(Cd * 10 + -3, Kwd.RM.DbCrash); });
    }

    const Lmt = Prm.Lmt && parseInt(Prm.Lmt, 10) || -1, // default -1.
          Ofst = Prm.Ofst && parseInt(Prm.Ofst, 10) || 0,
          SQL = 'SELECT id AS ID, name AS Nm, datetime AS Dt, message AS Msg FROM ' +
                'Message WHERE target = ? ORDER BY Dt LIMIT ? OFFSET ?;';

    Db.Query(SQL, [ Prm.ID, Lmt, Ofst ])
      .then(Rst => {
        if (!Rst) { return PckEnd(-4, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, Rst);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -5, Kwd.RM.DbCrash); });
  }
};

const Wds = { // good words.
  /*
    @ request object.
    @ params.
    @ callback function to end process. */
  NowOneGet: (Rqst, Prm, End) => {
    if (!Is.Function(End)) { return; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    Db.TableRows('GoodWords')
      .then(Cnt => {
        if (Cnt < 1) { return PckEnd(-2, Kwd.RM.NoSuchData); }

        const Idx = parseInt((new Date()).getTime() / 3600000, 10) % Cnt,
              SQL = 'SELECT id AS ID, words AS Wds FROM GoodWords LIMIT ' + Idx + ', 1;';

        return Db.Query(SQL, []);
      })
      .then(Wds => {
        if (!Wds || !Wds[0]) { return PckEnd(-3, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, Wds[0]);
      })
      .catch(Cd => { PckEnd(Cd, Kwd.RM.DbCrash); });
  }
};

const Ssn = { // session.
  /* check if is logged, and extend session expiration if need.
    @ request object.
    @ response object.
    < true|false. */
  IsLogged (Rqst, Rspns) {

    // return true; // for dev.

    const Cks = cookie.parse(Rqst.headers.cookie || ''); // cookies.

    if (!Cks[ADMIN_SESSION_KEY]) { return false; }

    const Ssn = Cch.Get(ADMIN_SESSION_KEY); // session.

    if (!Ssn || Ssn !== Cks[ADMIN_SESSION_KEY]) { return false; }

    // ==== extend session expiration. ====

    const Ck = cookie.serialize(ADMIN_SESSION_KEY, Ssn, { maxAge: ADMIN_SESSION_EXPIRE, path: '/' }); // cookie.

    if (Rspns && (typeof Rspns.setHeader === 'function')) {
      Rspns.setHeader('Set-Cookie', Ck);
      Cch.Set(ADMIN_SESSION_KEY, Ssn, ADMIN_SESSION_EXPIRE);
    }

    return true;
  },
  LogIn (Rqst, Rspns, Prm, End) {
    if (!Is.Function(End)) { return; }

    if (this.IsLogged(Rqst, Rspns)) { return End(1, Kwd.RM.HasLoggedIn); }

    if (!Prm || !Is.Object(Prm) || !Is.String(Prm.Pswd)) { return End(-1, Kwd.RM.PasswordNeed); }

    const Dt = new Date(),
          Y = Dt.getFullYear().toString(); // year.
    let M = (Dt.getMonth() + 1).toString(), // month.
        D = Dt.getDate().toString(); // day.

    if (M.length < 2) { M = '0' + M; }
    if (D.length < 2) { D = '0' + D; }

    const Pswd = Cnst.ADMIN_PSWD + Y + M + D;

    if (Prm.Pswd !== Pswd) { return End(-2, Kwd.RM.WrongPassword); }

    const Hmac = crypto.createHmac('sha256', 'something unique.');

    Hmac.update(Y + M + D);

    const Ssn = Hmac.digest('hex').toString(), // session value.
          Cks = cookie.parse(Rqst.headers.cookie || ''), // cookies.
          Ck = cookie.serialize(ADMIN_SESSION_KEY, Ssn, { maxAge: ADMIN_SESSION_EXPIRE, path: '/' }); // cookie.

    Rspns.setHeader('Set-Cookie', Ck);
    Cch.Set(ADMIN_SESSION_KEY, Ssn, ADMIN_SESSION_EXPIRE);

    End(0, Kwd.RM.Done);
  },
  LogOut (Rqst, Prm, End) {

  }
};

module.exports = {
  Blog,
  Msg,
  Ssn,
  Tag,
  Wds
};
