import async from 'async';
import cookie from 'cookie';
import crypto from 'crypto';
import fs from 'fs';
import getFolderSize from 'get-folder-size'; // To do - implmenet to retire this.
import markdownIt from 'markdown-it';
import path from 'path';
import tarStream from 'tar-stream';
import { Cache as Cch, Is, Log, SQLite } from 'rzjs';
import { fileURLToPath } from 'url';

import Cnst from './constant.json';
import Kwd from './keyword.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

markdownIt();

const ADMIN_SESSION_EXPIRE = 60 * 60 * 12, // admin session expire, 1 hour.
      ADMIN_SESSION_KEY = 'SSN', // admin session key.
      NOW_ART_CORNER_KEY = 'NAC', // now art corner key.
      ARTCNR_PTH = path.resolve(__dirname, '..', Cnst.ARTCNR_PTH), // blog files path.
      BLG_PTH = path.resolve(__dirname, '..', Cnst.BLG_PTH), // blog files path.
      CCH_PTH = path.resolve(__dirname, '..', Cnst.CCH_PTH), // cache files path.
      DAT_PTH = path.resolve(__dirname, '..', Cnst.DAT_PTH), // data folder path.
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

/* give a date time format string: YYYY-MM-DD HH:II:SS
  @ second, optional, default is current date time second.
  < format string. */
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

/* extract a file from tar file to system.
  @ header object from tar-stream library.
  @ stream object from tar-stream library.
  @ file path to write to.
  @ callback function. */
function TarStreamFileWrite (Hdr, Strm, Pth, Then) {
  function FileWrite () {
    let ImgFlStrm = fs.createWriteStream(Pth, { encoding: 'binary', flags: 'w' });

    Strm.on('end', Then);
    Strm.pipe(ImgFlStrm);
  }

  // somehow, fs.stat's error result will breaks tar-stream. here use sync way to try catch the error.
  try {
    const St = fs.statSync(Pth); // stat.

    if (!St.mtime || Hdr.mtime > St.mtime) { return FileWrite(); }
  }
  catch (Err) {
    return FileWrite();
  }

  Then();
}

export const Blog = {
  Tp: [ 'text', 'markdown', 'zft' ],
  List: (Rqst, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    let TgIds = []; // tag ids.

    if (Prm.TgIDA) {
      if (!Is.Array(Prm.TgIDA)) { Prm.TgIDA = [ Prm.TgIDA ]; }

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
      .catch(Cd => {
        Log(Cd);
        PckEnd(Cd, Kwd.RM.DbCrash);
      });
  },
  AdminList: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

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
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

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
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    let SQL = '',
        Kys = [], // keys.
        Vls = []; // values.

    if (Prm.Ttl) {
      Kys.push('title = ?');
      Vls.push(Prm.Ttl);
    }

    if (Prm.Tp && Blog.Tp.indexOf(Prm.Tp) > -1) {
      Kys.push('type = ?');
      Vls.push(Prm.Tp);
    }

    if (Prm.Dt && Is.TimeStamp(Prm.Dt)) {
      Kys.push('datetime = ?');
      Vls.push(Prm.Dt);
    }

    if (Prm.Pswd) {
      Kys.push('password = ?');
      Vls.push(Prm.Pswd);
    }

    if (Prm.Smry) {
      Kys.push('summary = ?');
      Vls.push(Prm.Smry);
    }

    if (!Kys.length || !Vls.length) { return PckEnd(-3, Kwd.RM.StrangeValue); }

    SQL = 'UPDATE Blog SET ' + Kys.join(', ') + ' WHERE id = ?;';

    Vls.push(Prm.ID);

    Db.Transaction('BEGIN')
      .then(() => Db.Query(SQL, Vls))
      // this will always delete old and insert new TagLink record, can be improved.
      .then(() => Db.Query('DELETE FROM TagLink WHERE link_id = ?;', [ Prm.ID ]))
      .then(() => {
        if (!Prm.TgIDA) { return Promise.resolve(); }

        if (!Is.Array(Prm.TgIDA)) { Prm.TgIDA = [ Prm.TgIDA ]; }

        Kys = [];
        Vls = [];

        for (let i = 0; i < Prm.TgIDA.length; i++) {
          Kys.push('(?, ?, ?)');
          Vls.push(MakeId());
          Vls.push(Prm.TgIDA[i]);
          Vls.push(Prm.ID);
        }

        SQL = 'INSERT INTO TagLink (id, tag_id, link_id) VALUES ' + Kys.join(', ') + ';';

        return Db.Query(SQL, Vls);
      })
      .then(() => Db.Transaction('COMMIT'))
      .then(() => PckEnd(0, Kwd.RM.Done))
      .catch(Err => {
        Log(Err, 'error');
        PckEnd(-4, Kwd.RM.DbCrash);
      });
  },
  Upload: (Rqst, Rspns, Prm, Fls, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    if (!Fls || Fls.length === 0) { return End(-2, Kwd.RM.StrangeValue); }

    const PthInfo = path.parse(Fls[0]);

    if (!PthInfo || (PthInfo.ext !== '.tar' && PthInfo.ext !== '.txt')) {
      return End(-3, Kwd.RM.StrangeValue);
    }

    fs.rename(
      Fls[0],
      BLG_PTH + '/' + PthInfo.base,
      () => { End(0, Kwd.RM.Done); });
  },
  /* create blog with existing file. */
  Create: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    if (!Prm || !Prm.Fl || !Is.String(Prm.Fl) || !Prm.Ttl || !Is.String(Prm.Ttl) || !Prm.Dt || !Is.TimeStamp(Prm.Dt) ||
        !Prm.Tp || Blog.Tp.indexOf(Prm.Tp) < 0) {
      return End(-2, Kwd.RM.StrangeValue);
    }

    if (!Prm.Pswd || !Is.String(Prm.Pswd)) { Prm.Pswd = ''; }

    if (!Prm.Smry || !Is.String(Prm.Smry)) { Prm.Smry = ''; }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-3, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });
    const BlgId = MakeId();

    let SQL = 'INSERT INTO Blog (id, title, file, type, datetime, password, summary) VALUES (?, ?, ?, ?, ?, ?, ?);';

    Db.Transaction('BEGIN')
      .then(() => Db.Query(SQL, [ BlgId, Prm.Ttl, Prm.Fl, Prm.Tp, Prm.Dt, Prm.Pswd, Prm.Smry ]))
      .then(() => {
        if (!Prm.TgIDA) { return Promise.resolve(); }

        if (!Is.Array(Prm.TgIDA)) { Prm.TgIDA = [ Prm.TgIDA ]; }

        let Kys = [],
            Vls = [];

        for (let i = 0; i < Prm.TgIDA.length; i++) {
          Kys.push('(?, ?, ?)');
          Vls.push(MakeId());
          Vls.push(Prm.TgIDA[i]);
          Vls.push(BlgId);
        }

        SQL = 'INSERT INTO TagLink (id, tag_id, link_id) VALUES ' + Kys.join(', ') + ';';

        return Db.Query(SQL, Vls);
      })
      .then(() => Db.Transaction('COMMIT'))
      .then(() => PckEnd(0, Kwd.RM.Done))
      .catch(Err => {
        Log(Err, 'error');
        PckEnd(-4, Kwd.RM.DbCrash);
      });
  },
  Delete: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    if (!Prm || !Prm.ID || !Is.UUID(Prm.ID)) {
      return End(-2, Kwd.RM.StrangeValue);
    }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-3, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    Db.Transaction('BEGIN')
      .then(() => Db.Query('DELETE FROM Blog WHERE id = ?;', [ Prm.ID ]))
      .then(() => Db.Query('DELETE FROM TagLink WHERE link_id = ?;', [ Prm.ID ]))
      .then(() => Db.Transaction('COMMIT'))
      .then(() => PckEnd(0, Kwd.RM.Done))
      .catch(Err => {
        Log(Err, 'error');
        PckEnd(-4, Kwd.RM.DbCrash);
      });
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
          if (Cnt < 1) { return PckEnd(1, Kwd.RM.NoSuchData); }

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
        if (!Rst) { return PckEnd(2, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, Rst);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -5, Kwd.RM.DbCrash); });
  },
  CommentLeave: (Rqst, Prm, End) => {
    if (!Prm || !Is.Object(Prm) || !Is.Function(End)) { return; }

    const Nm = Prm.Nm && Is.String(Prm.Nm) && Prm.Nm.trim() || '',
          Cmt = Prm.Cmt && Is.String(Prm.Cmt) && Prm.Cmt.trim() || '';

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
      .then(Rst => { PckEnd(0, Kwd.RM.Done); })
      .catch(Cd => { PckEnd(-4, Kwd.RM.DbCrash, Cd); });
  },
  CommentDelete: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    if (!Prm || !Prm.ID || !Is.UUID(Prm.ID)) {
      return End(-2, Kwd.RM.StrangeValue);
    }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-3, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    Db.Query('DELETE FROM BlogComment WHERE id = ?;', [ Prm.ID ])
      .then(() => PckEnd(0, Kwd.RM.Done))
      .catch(Err => {
        Log(Err, 'error');
        PckEnd(-4, Kwd.RM.DbCrash);
      });
  },
  FeedPublish: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

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
            <link href="https://skyzone.zii.tw/text?b=${ID}"/>
            <link rel="alternate" type="text/html" href="https://skyzone.zii.tw/text?b=${ID}"/>
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

    let SqlRst; // SQL result.

    (new Promise((Resolve, Reject) => {
      if (!Prm.Rdm || Prm.Rdm === '0') { return Resolve(); }

      Db.RandomGet('Blog')
        .then(Rst => {
          if (!Rst || !Rst.id) { return Reject({ Cd: -3, Msg: Kwd.RM.NoSuchData + ' can not get a random blog.' }); }

          Prm.Id = Rst.id;

          Resolve();
        });
    }))
      .then(() => {
        const SQL = 'SELECT Blog.id AS Id, Blog.title AS Ttl, Blog.file AS Fl, Blog.summary AS Smry, Blog.type AS Tp, ' +
                  'Blog.datetime AS Dt, Blog.password AS Pswd, COUNT(BlogComment.id) AS CmtCnt ' +
                  'FROM Blog LEFT JOIN BlogComment ON Blog.id = BlogComment.blog_id ' +
                  'WHERE Blog.id = ? GROUP BY Ttl, Fl, Tp, Dt, Pswd;';

        return Db.Query(SQL, [ Prm.Id ]);
      })
      .then(Rst => {
        if (!Rst || !Is.Array(Rst) || !Rst.length) { return Promise.reject({ Cd: -4, Msg: Kwd.RM.NoSuchData }); }

        const SQL = 'SELECT Tag.id AS ID, Tag.name AS Nm FROM Tag, TagLink ' +
              'WHERE Tag.id = TagLink.tag_id AND TagLink.link_id = ?;';

        SqlRst = Rst[0];

        return Db.Query(SQL, [ SqlRst.Id ]);
      })
      .then(Rslt => {
        if (Rslt || Is.Array(Rslt) || Rslt.length) { SqlRst.Tgs = Rslt; }

        SqlRst.Url = '/blog/' + SqlRst.Id;

        if (SqlRst.Tp === 'image' || SqlRst.Tp === 'images') { SqlRst.Tp = 'markdown'; }

        switch (SqlRst.Tp) {
          case 'text':
          case 'zft' :
            Cch.FileLoad(
              `${BLG_PTH}/${SqlRst.Fl}`,
              (Cd, Str) => {
                if (Cd < 0) { return PckEnd(1, Kwd.RM.SystemError); }

                SqlRst.Info = Str;

                PckEnd(0, Kwd.RM.Done, SqlRst);
              });

            return;

          case 'markdown':
            Blog.TarMarkdownRead(SqlRst, Cd => { PckEnd(Cd, (Cd < 0) ? Kwd.RM.SystemError : Kwd.RM.Done, SqlRst); });

            return;

          default:
            return PckEnd(1, Kwd.RM.StepTest);
        }
      })
      .catch(({ Cd = -1, Msg = '' }) => {
        PckEnd(Cd, Msg || Kwd.RM.DbCrash);
      });
  },
  TarMarkdownRead: (SqlRst, Then) => {
    if (!SqlRst || !SqlRst.Fl) { return Then(-1); }

    const TarNm = SqlRst.Fl.replace('.tar', ''),
          FlStrm = fs.createReadStream(`${BLG_PTH}/${SqlRst.Fl}`);

    let Extr = tarStream.extract();

    SqlRst.Info = { Lst: [], Imgs: {}, Str: '' };

    Extr.on(
      'entry',
      (Hdr, Strm, Next) => { // file header in the tar; stream object; callback function.
        if (Hdr.name.indexOf('.md') > -1) { // markdown.
          let Chks = []; // chunks.

          Strm.on('data', Chk=> { Chks.push(Chk); });

          Strm.on(
            'end',
            () => {
              SqlRst.Info.IsMrkdwn = true;
              SqlRst.Info.Str = Chks.join('').toString('utf8');

              Next();
            });
        }
        else {
          const Pth = `${CCH_PTH}/${TarNm}-${Hdr.name}`; // image file path.

          SqlRst.Info.Imgs[Hdr.name] = `/resource/image/${TarNm}-${Hdr.name}`; // image file url.

          TarStreamFileWrite(Hdr, Strm, Pth, Next);
        }

        Strm.resume();
      });

    Extr.on(
      'finish',
      () => {
        if (SqlRst.Info.IsMrkdwn) {
          const Kys = Object.keys(SqlRst.Info.Imgs),
                KysLngth = Kys.length;

          for (let i = 0; i < KysLngth; i++) {
            const Ky = Kys[i];

            SqlRst.Info.Str = SqlRst.Info.Str.replace(`tmd{${Ky}}`, SqlRst.Info.Imgs[Ky]);
          }

          SqlRst.Info = markdownIt.render(SqlRst.Info.Str).replace(/<img /g, '<img loading="lazy" ');
        }
        else {
          for (let i = 0; i < SqlRst.Info.Lst.length; i++) {
            let Itm = SqlRst.Info.Lst[i],
                FlbckFl = Itm.Fl.replace(/\.jpg$/, '.png'); // fallback PNG file name.

            Itm.ImgUrl = SqlRst.Info.Imgs[Itm.Fl] || SqlRst.Info.Imgs[FlbckFl] || '';
          }

          SqlRst.Info = SqlRst.Info.Lst;
        }

        Then(0);
      });

    FlStrm.pipe(Extr);
  }
};

export const Tag = {
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

export const Msg = { // message.
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
  },
  /*
    @ name.
    @ mail.
    @ message.
    @ target message id. */
  Leave: (Rqst, Rspns, { Nm, Ml, Msg, Tgt }, End) => {
    if (!Is.Function(End)) { return; }

    if (!Nm || !Is.String(Nm) || !Ml || !Is.EMail(Ml) || !Msg || !Is.String(Msg))
    { return End(-1, 0, Kwd.RM.StrangeValue); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); }),
          Id = MakeId(),
          IP = GetIp(Rqst),
          Dt = GetDatetime();
    let SQL = 'INSERT INTO Message (id, name, mail, ip, datetime, message) VALUES (?, ?, ?, ?, ?, ?);',
        Prm = [ Id, Nm, Ml, IP, Dt, Msg ];

    if (Tgt && Is.UUID(Tgt)) {
      SQL = 'INSERT INTO Message (id, name, mail, ip, datetime, message, target) VALUES (?, ?, ?, ?, ?, ?, ?);';
      Prm = [ Id, Nm, Ml, IP, Dt, Msg, Tgt ];
    }

    Db.Query(SQL, Prm)
      .then(Rst => {
        if (!Rst) { return PckEnd(-3, Kwd.RM.SystemError); }

        PckEnd(0, Kwd.RM.Done, Id);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -4, Kwd.RM.DbCrash); });
  },
  AdminList: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    // ==== total count. ====

    if (parseInt(Prm.Cnt, 10)) {
      Db.Query('SELECT COUNT(id) As Cnt FROM Message;')
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
          Ofst = Prm.Ofst && parseInt(Prm.Ofst, 10) || 0, // offset.
          SQL = 'SELECT id AS ID, name AS Nm, mail AS Ml, ip AS IP, datetime AS Dt, message AS Msg, target AS Tgt ' +
                'FROM Message ORDER BY Dt DESC LIMIT ?, ?;';

    Db.Query(SQL, [ Ofst, Lmt ])
      .catch(Cd => { PckEnd(-5, Kwd.RM.DbCrash, Cd); })
      .then((DbRst) => {
        if (!DbRst || !Is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  },
  Delete: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const { ID = '' } = Prm;

    if (!ID || !Is.UUID(ID)) {
      return End(-2, Kwd.RM.StrangeValue);
    }

    const Db = new SQLite(DB_PTH),
          PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (!Db.IsReady()) { return End(-3, Kwd.RM.DbCrash); }

    Db.IsARowExist('Message', 'id', ID)
      .then(IsExt => {
        if (!IsExt) {
          PckEnd(-4, Kwd.RM.NoSuchData);

          return Promise.reject(-4);
        }

        const SQL = 'DELETE FROM Message WHERE id = ? OR target = ?;';

        return Db.Query(SQL, [ ID ]);
      })
      .catch(Cd => { PckEnd(-5, Kwd.RM.DbCrash, Cd); })
      .then(DbRst => {
        if (!DbRst || !Is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  }
};

export const Wds = { // good words.
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
  },
  List: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    // ==== total count. ====

    if (parseInt(Prm.Cnt, 10)) {
      Db.Query('SELECT COUNT(id) AS Cnt FROM GoodWords;')
        .catch(Cd => { PckEnd(-3, Kwd.RM.DbCrash, Cd); })
        .then(DbRst => {
          (!DbRst || !DbRst[0] || !DbRst[0].Cnt) ?
          PckEnd(-4, Kwd.RM.NoSuchData) :
          PckEnd(1, Kwd.RM.Done, DbRst[0].Cnt);
        });

      return;
    }

    // ==== one page. ====

    const Lmt = Prm.Lmt && parseInt(Prm.Lmt, 10) || 10, // limit.
          Ofst = Prm.Ofst && parseInt(Prm.Ofst, 10) || 0; // offset.

    let SQL = 'SELECT id AS ID, words AS Wds, datetime AS Dt FROM GoodWords ORDER BY Dt DESC LIMIT ?, ?;';

    Db.Query(SQL, [ Ofst, Lmt ])
      .catch(Cd => { PckEnd(-5, Kwd.RM.DbCrash, Cd); })
      .then(DbRst => {
        if (!DbRst || !Is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  },
  Create: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); }),
          { Wds = '' } = Prm;

    if (!Wds || !Is.String(Wds)) {
      return PckEnd(-3, Kwd.RM.StrangeValue);
    }

    const SHA1 = crypto.createHmac('sha1', Wds).digest('hex');
    let Id = '';

    Db.IsARowExist('GoodWords', 'sha1', SHA1)
      .then(IsExt => {
        if (IsExt) { return PckEnd(-4, Kwd.RM.DuplicateData); }

        const SQL = 'INSERT INTO GoodWords (id, words, sha1, datetime) VALUES (?, ?, ?, ?);';

        Id = MakeId();

        return Db.Query(SQL, [ Id, Wds, SHA1, GetDatetime() ]);
      })
      .catch(Cd => { PckEnd(-5, Kwd.RM.DbCrash, Cd); })
      .then(DbRst => {
        if (!DbRst || !Is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, Id);
      });
  },
  Update: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); }),
          { ID = '', Wds = '' } = Prm;

    if (!ID || !Is.UUID(ID) || !Wds || !Is.String(Wds)) {
      return PckEnd(-3, Kwd.RM.StrangeValue);
    }

    const SHA1 = crypto.createHmac('sha1', Wds).digest('hex');

    Db.IsARowExist('GoodWords', 'id', ID)
      .then(IsExt => {
        if (!IsExt) {
          PckEnd(-4, Kwd.RM.NoSuchData);

          return Promise.reject(-4); // stop Promise chain.
        }

        const SQL = 'UPDATE GoodWords SET words = ?, sha1 = ? WHERE id = ?;';

        return Db.Query(SQL, [ Wds, SHA1, ID ]);
      })
      .catch(Cd => { PckEnd(-5, Kwd.RM.DbCrash, Cd); })
      .then(DbRst => {
        if (!DbRst || !Is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  },
  Delete: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new SQLite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); }),
          { ID = '' } = Prm;

    if (!ID || !Is.UUID(ID)) {
      return PckEnd(-3, Kwd.RM.StrangeValue);
    }

    Db.IsARowExist('GoodWords', 'id', ID)
      .then(IsExt => {
        if (!IsExt) {
          PckEnd(-4, Kwd.RM.NoSuchData);

          return Promise.reject(-4);
        }

        const SQL = 'DELETE FROM GoodWords WHERE id = ?;';

        return Db.Query(SQL, [ ID ]);
      })
      .catch(Cd => { PckEnd(-5, Kwd.RM.DbCrash, Cd); })
      .then(DbRst => {
        if (!DbRst || !Is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  }
};

export const ArtCnr = { // Art Corner.
  RandomOneGet: (Rqst, Prm, End) => {
    let Info = Cch.Get(NOW_ART_CORNER_KEY);

    if (Info) { return End(1, Kwd.RM.StepTest, Info); }

    fs.readdir(
      ARTCNR_PTH,
      (Err, Fls) => {
        if (Err) { return End(-1, Kwd.RM.LoadDataFail, 0); }

        // const Idx = parseInt(Math.random() * Fls.length, 10),
        const Idx = 1,
              TarFl = Fls[Idx],
              FlStrm = fs.createReadStream(`${ARTCNR_PTH}/${TarFl}`),
              Extr = tarStream.extract();

        Info = {};

        Extr.on(
          'entry',
          (Hdr, Strm, Next) => {
            if (Hdr.name === 'info.xml') {
              let Chks = []; // chunks.

              Strm.on('data', Chk => { Chks.push(Chk); });

              Strm.on(
                'end',
                () => {
                  const Src = Chks.join('').toString('utf8');

                  Info.Ttl = Src.match(/<Title>(.+)<\/Title>/)[1];
                  Info.Atr = Src.match(/<Author>(.+)<\/Author>/)[1];
                  Info.Dt = Src.match(/<Datetime>(.+)<\/Datetime>/)[1];

                  Next();
                });
            }
            else {
              const FlNm = TarFl.replace('.tar', '') + '-' + Hdr.name;
              const Pth = `${CCH_PTH}/${FlNm}`; // image file path.

              Info.ImgUrl = '/resource/image/' + FlNm;

              TarStreamFileWrite(Hdr, Strm, Pth, Next);
            }

            Strm.resume(); // this is important.
          });

        Extr.on(
          'finish',
          () => {
            Cch.Set(NOW_ART_CORNER_KEY, Info);
            End(1, Kwd.RM.StepTest, Info);
          });

        FlStrm.pipe(Extr);
      });
  }
};

export const Systm = {
  CacheClear: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    fs.readdir(
      CCH_PTH,
      (Err, Fls) => {
        if (Err) { return End(-2, Kwd.RM.LoadDataFail, 0); }

        const { Scd = 0 } = Prm,
              ExprTm = new Date((new Date()).getTime() - (Scd * 1000));

        let Cnt = 0;

        const Tsks = Fls.map(Fl => { // tasks.
          return Then => {
            const Pth = CCH_PTH + '/' + Fl;

            fs.stat(
              Pth,
              (Err, St) => {
                if (Err || !St.mtime || St.mtime > ExprTm) { return Then(); }

                Cnt++;

                fs.unlink(Pth, () => {});
                Then();
              });
          };
        });

        async.parallel(
          Tsks,
          (Err, Rsts) => { // error, results.
            End(0, Kwd.RM.Done, Cnt);
          });
      });
  },
  // To do.
  // _FolderSizeGet: (Pth, Then) => {
  //   if (!Pth || !Is.String(Pth)) { return 0; }

  //   fs.stat(
  //     Pth,
  //     (Err, St) => {
  //       if (Err) { return Then(-1, Err); }

  //       if (!St.isDirectory()) { return Then(-2, Kwd.RM.SystemError); }

  //       fs.readdir(
  //         Pth,
  //         (Err, Fls) => {
  //           if (Err) { return Then(-3, Err); }

  //           const Tsks = Fls.map(Fl => {
  //             return Then => {
  //               const FlPth = Pth + '/' + Fl;

  //               fs.stat(
  //                 FlPth,
  //                 (Err, St) => {
  //                   if (Err) { return Then(Err, 0); }

  //                   if (St.isDirectory()) {
  //                     Then(null, System._FolderSizeGet())
  //                   }
  //                 });
  //             };
  //           });
  //         })
  //     });
  // },
  DataSize: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    fs.readdir(
      DAT_PTH,
      (Err, Fls) => {
        const Tsks = Fls.map(Fl => {
          return Then => {
            getFolderSize(
              DAT_PTH + '/' + Fl,
              (Err, Sz) => Then(Err, { Fl, Sz }));
          };
        });

        async.parallel(
          Tsks,
          (Err, Rsts) => { End(0, Kwd.RM.Done, Rsts); });
      });
  }
};

export const Ssn = { // session.
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
          Ck = cookie.serialize(ADMIN_SESSION_KEY, Ssn, { maxAge: ADMIN_SESSION_EXPIRE, path: '/' }); // cookie.

    Rspns.setHeader('Set-Cookie', Ck);
    Cch.Set(ADMIN_SESSION_KEY, Ssn, ADMIN_SESSION_EXPIRE);

    End(0, Kwd.RM.Done);
  },
  LogOut (Rqst, Rspns, Prm, End) {
    const Ck = cookie.serialize(ADMIN_SESSION_KEY, '', { maxAge: -1, path: '/' }); // cookie.

    Rspns.setHeader('Set-Cookie', Ck);
    Cch.Set(ADMIN_SESSION_KEY, '', 0); // make the cache expired.
    End(0, Kwd.RM.Done);
  }
};

const Lbry = {
  ArtCnr,
  Blog,
  Msg,
  Ssn,
  Systm,
  Tag,
  Wds
};

export default Lbry;
