import cookie from 'cookie';
import crypto from 'crypto';
import fs from 'fs';
import getFolderSize from 'get-folder-size'; // To do - implmenet to retire this.
import path from 'path';
import yauzl from 'yauzl';
import { cache, is, log, sqlite } from 'rzjs';
import { customAlphabet } from 'nanoid';
import { fileURLToPath } from 'url';

import Cnst from './constant.json.mjs';
import Kwd from './wording.mjs';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const ADMIN_SESSION_EXPIRE = 60 * 60 * 12; // admin session expire, 1 hour.
const ADMIN_SESSION_KEY = 'SSN'; // admin session key.
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'; // for nanoid.

const BLG_PTH = path.resolve(__dirname, '..', Cnst.BLG_PTH); // blog files path.
const CCH_PTH = path.resolve(__dirname, '..', Cnst.CCH_PTH); // cache files path.
const DAT_PTH = path.resolve(__dirname, '..', Cnst.DAT_PTH); // data folder path.
const DB_PTH = path.resolve(__dirname, '..', Cnst.DB_PTH); // Sqlite database path.
const FD_PTH = path.resolve(__dirname, '..', Cnst.FD_PTH); // feed.xml path.
const NOW_ART_CORNER_KEY = 'NAC'; // now art corner key.

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
function MakeId (type = 13) {
  const typeCases = [ 13, 22, 32, 36, 64 ]; // type map.

  if (!is.Number(type) || !typeCases.indexOf(type) < 0) {
    type = 13;
  }

  const nanoid = customAlphabet(ALPHABET, type);

  return nanoid();
}

function GetIp (Rqst) {
  const HdrIps = Rqst.headers['x-forwarded-for'] && Rqst.headers['x-forwarded-for'].split(',');

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
  let ChrMp = {
    "'": '&apos;',
    '"': '&quot;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  }; // char map.

  if (Flg) {
    const Kys = Object.keys(ChrMp),
      Lth = Kys.length;
    const RvChrMp = {};

    for (let i = 0; i < Lth; i++) {
      const Ky = Kys[i];

      RvChrMp[ChrMp[Ky]] = Ky;
    }

    ChrMp = RvChrMp;
  }

  const RE = new RegExp(Object.keys(ChrMp).join('|'), 'g'); // RegExp.

  return Str.replace(RE, Ch => ChrMp[Ch] );
}

/*
  @ array.
  @ filled string.
  @ separated string. */
function MakeCircularString (Arr, FlStr = '?', SpStr = ', ') {
  return (new Array(Arr.length)).fill(FlStr).join(SpStr)
}

export const Blog = {
  List: (Rqst, Prm, End) => {
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    const TgIds = []; // tag ids.

    if (Prm.TgIDA) {
      if (!is.Array(Prm.TgIDA)) { Prm.TgIDA = [ Prm.TgIDA ]; }

      for (let i = 0; i < Prm.TgIDA.length; i++) {
        if (is.UUID(Prm.TgIDA[i])) { TgIds.push(Prm.TgIDA[i]); }
      }
    }

    const Prt = TgIds.length ? MakeCircularString(TgIds, '?', ', ') : ''; // part.
    let SQL;

    if (parseInt(Prm.Cnt, 10)) {
      SQL = TgIds.length ?
        `
          SELECT COUNT(Blog.id) AS Cnt
          FROM Blog, TagLink
          WHERE Blog.id = TagLink.link_id AND TagLink.tag_id IN (${Prt});
        ` :
        'SELECT COUNT(Blog.id) AS Cnt FROM Blog;';

      return Db.Query(SQL, TgIds)
        .then((Rst) => {
          if (!Rst || !is.Array(Rst)) { return PckEnd(-1, Kwd.RM.NoSuchData); }

          PckEnd(0, Kwd.RM.Done, Rst[0].Cnt);
        })
        .catch(Cd => { PckEnd(Cd, Kwd.RM.DbCrash); });
    }

    const Lmt = Prm.Lmt && parseInt(Prm.Lmt, 10) || 10,
      Ofst = Prm.Ofst && parseInt(Prm.Ofst, 10) || 0,
      QryPrm = TgIds.concat([ Lmt, Ofst ]);

    if (TgIds.length) {
      SQL = `
        SELECT
          Blog.id AS ID,
          Blog.title AS Ttl,
          Blog.summary as Smry,
          Blog.datetime AS Dt
        FROM Blog, TagLink
        WHERE Blog.id = TagLink.link_id AND TagLink.tag_id IN (${Prt})
        ORDER BY Blog.datetime DESC LIMIT ? OFFSET ?;
      `;
    }
    else {
      SQL = `
        SELECT id AS ID, title AS Ttl, summary as Smry, datetime AS Dt
        FROM Blog
        ORDER BY datetime DESC
        LIMIT ? OFFSET ?;
      `;
    }

    let FnlRst; // final result.

    Db.Query(SQL, QryPrm)
      .then(Rst => {
        if (!Rst || !is.Array(Rst)) { return PckEnd(-2, Kwd.RM.NoSuchData); }

        const Ids = [];

        for(let i = 0; i < Rst.length; i++) {
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
        if (!Rst || !is.Array(Rst)) { return PckEnd(-2, Kwd.RM.NoSuchData); }

        for (let i = 0; i < Rst.length; i++) { // append tag info to each blog.
          const Rltn = Rst[i]; // tag, blog relation. Rltn

          for (let j = 0; j < FnlRst.length; j++) {
            const Blg = FnlRst[j];

            if (Rltn.TgtID === Blg.ID) {
              if (!Blg.Tg) { Blg.Tg = []; }

              Blg.Tg.push({ ID: Rltn.TgID, Nm: Rltn.TgNm })
            }
          }
        }

        PckEnd(0, Kwd.RM.Done, FnlRst);
      })
      .catch(Cd => {
        log(Cd);
        PckEnd(Cd, Kwd.RM.DbCrash);
      });
  },
  AdminList: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new sqlite(DB_PTH);

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

    let SQL =
      'SELECT BlogComment.blog_id, COUNT(BlogComment.id) AS CmtCnt FROM BlogComment GROUP BY BlogComment.blog_id';

    SQL = 'SELECT Blog.id AS ID, Blog.title AS Ttl, Blog.file AS Fl, Blog.datetime AS Dt, ' +
          'Blog.summary AS Smry, BlogCmt.CmtCnt ' +
          'FROM Blog LEFT JOIN (' + SQL + ') AS BlogCmt ON Blog.id = BlogCmt.blog_id ORDER BY Dt DESC LIMIT ?, ?;';

    Db.Query(SQL, [ Ofst, Lmt ])
      .catch(Cd => { PckEnd(-5, Kwd.RM.DbCrash, Cd); })
      .then((DbRst) => {
        if (!DbRst || !is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        const Ids = [];
        let i = 0;

        while (DbRst[i]) {
          const One = DbRst[i];

          // ==== error handle. ====

          if (!is.Number(One.CmtCnt)) { One.CmtCnt = 0; }

          if (!is.String(One.Smry)) { One.Smry = ''; }

          One.Fl = XmlEscape(One.Fl, true); // once no html special char case, this can be removed.
          One.Tg = [];

          // ====

          Ids.push(One.ID);

          i++;
        }

        return new Promise(Resolve => { Resolve({ Blgs: DbRst, BlgIds: Ids }); }); // blogs, blog ids.
      })
      .then(({ Blgs, BlgIds }) => { // step result.
        SQL = 'SELECT Tag.id AS ID, Tag.name AS Nm, TagLink.link_id AS BlogID ' +
              'FROM TagLink, Tag WHERE TagLink.tag_id = Tag.id AND TagLink.link_id ' +
              'IN (' + MakeCircularString(BlgIds) + ');';

        Db.Query(SQL, BlgIds)
          .catch(Cd => { PckEnd(-7, Kwd.RM.DbCrash, Cd); })
          .then((DbRst) => {
            if (!DbRst || !is.Array(DbRst) || !DbRst.length) { return PckEnd(2, Kwd.RM.Done, Blgs); }

            for (let i = 0; i < DbRst.length; i++) {
              for (let j = 0; j < Blgs.length; j++) {
                const Rcd = DbRst[i], // record of tag - blog.
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

    const Db = new sqlite(DB_PTH);

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

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    let SQL = '',
      Kys = [], // keys.
      Vls = []; // values.

    if (Prm.Ttl) {
      Kys.push('title = ?');
      Vls.push(Prm.Ttl);
    }

    if (Prm.Dt && is.TimeStamp(Prm.Dt)) {
      Kys.push('datetime = ?');
      Vls.push(Prm.Dt);
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

        if (!is.Array(Prm.TgIDA)) { Prm.TgIDA = [ Prm.TgIDA ]; }

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
        log(Err, 'error');
        PckEnd(-4, Kwd.RM.DbCrash);
      });
  },
  Upload: (Rqst, Rspns, Prm, Fls, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    if (!Fls || Fls.length === 0) { return End(-2, Kwd.RM.StrangeValue); }

    const allowedExt = [ '.md', '.txt', '.zip' ];
    const PthInfo = path.parse(Fls[0]);

    if (!PthInfo || !allowedExt.includes(PthInfo.ext)) {
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

    if (!Prm || !Prm.Fl || !is.String(Prm.Fl) || !Prm.Ttl || !is.String(Prm.Ttl) || !Prm.Dt || !is.TimeStamp(Prm.Dt)) {
      return End(-2, Kwd.RM.StrangeValue);
    }

    if (!Prm.Smry || !is.String(Prm.Smry)) { Prm.Smry = ''; }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-3, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });
    const BlgId = MakeId();

    let SQL = 'INSERT INTO Blog (id, title, file, datetime, summary) VALUES (?, ?, ?, ?, ?);';

    Db.Transaction('BEGIN')
      .then(() => Db.Query(SQL, [ BlgId, Prm.Ttl, Prm.Fl, Prm.Dt, Prm.Smry ]))
      .then(() => {
        if (!Prm.TgIDA) { return Promise.resolve(); }

        if (!is.Array(Prm.TgIDA)) { Prm.TgIDA = [ Prm.TgIDA ]; }

        const Kys = [],
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
        log(Err, 'error');
        PckEnd(-4, Kwd.RM.DbCrash);
      });
  },
  Delete: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    if (!Prm || !Prm.ID || !is.UUID(Prm.ID)) {
      return End(-2, Kwd.RM.StrangeValue);
    }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-3, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    Db.Transaction('BEGIN')
      .then(() => Db.Query('DELETE FROM Blog WHERE id = ?;', [ Prm.ID ]))
      .then(() => Db.Query('DELETE FROM TagLink WHERE link_id = ?;', [ Prm.ID ]))
      .then(() => Db.Transaction('COMMIT'))
      .then(() => PckEnd(0, Kwd.RM.Done))
      .catch(Err => {
        log(Err, 'error');
        PckEnd(-4, Kwd.RM.DbCrash);
      });
  },
  CommentList: (Rqst, Prm, End) => {
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    if (!Prm.ID || !is.UUID(Prm.ID)) { return End(-1, Kwd.RM.StrangeValue); }

    const Db = new sqlite(DB_PTH);

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
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    const Nm = Prm.Nm && is.String(Prm.Nm) && Prm.Nm.trim() || '',
      Cmt = Prm.Cmt && is.String(Prm.Cmt) && Prm.Cmt.trim() || '';

    if (!Nm || !Prm.Ml || !is.EMail(Prm.Ml) || !Cmt || !Prm.TgtID || !is.UUID(Prm.TgtID)) {
      return End(-1, Kwd.RM.StrangeValue);
    }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    Db.IsARowExist('Blog', 'id', Prm.TgtID)
      .then(IsExt => {
        if (!IsExt) { return PckEnd(-3, Kwd.RM.NoSuchData); }

        const SQL = 'INSERT INTO BlogComment (id, name, mail, ip, datetime, comment, blog_id) ' +
                    'VALUES (?, ?, ?, ?, ?, ?, ?) ' +
                    'RETURNING datetime, id;';

        return Db.Query(SQL, [ MakeId(13), Nm, Prm.Ml, GetIp(Rqst), GetDatetime(), Cmt, Prm.TgtID ]);
      })
      .then(Rst => { PckEnd(0, Kwd.RM.Done, Rst); })
      .catch(Cd => { PckEnd(-4, Kwd.RM.DbCrash, Cd); });
  },
  CommentDelete: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    if (!Prm || !Prm.ID || !is.UUID(Prm.ID)) {
      return End(-2, Kwd.RM.StrangeValue);
    }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-3, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    Db.Query('DELETE FROM BlogComment WHERE id = ?;', [ Prm.ID ])
      .then(() => PckEnd(0, Kwd.RM.Done))
      .catch(Err => {
        log(Err, 'error');
        PckEnd(-4, Kwd.RM.DbCrash);
      });
  },
  FeedPublish: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });
    const SQL = 'SELECT id AS ID, title AS Ttl, summary as Smry, datetime AS Dt FROM Blog ORDER BY Dt DESC LIMIT 10;';

    Db.Query(SQL, [])
      .then(Rst => {
        if (!Rst || !is.Array(Rst)) { return PckEnd(-3, Kwd.RM.NoSuchData); }

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
  FileRespond: (Rqst, Rspns, Then) => {
    const { id, file } = Rqst.params;

    if (!id || !file) { return Then(); }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return Then(); }

    Db.Query('SELECT file FROM Blog WHERE id = ?;', [ id ])
      .then(Rst => {
        if (!Rst || !is.Array(Rst) || !Rst.length) {
          Db.Close();

          return Then();
        }

        const Fl = Rst[0].file;
        const Pth = path.join(BLG_PTH, Fl);

        yauzl.open(Pth, { lazyEntries: true }, (error, zip) => {
          if (error) {
            Db.Close();

            return Then();
          }

          let Fnd = false; // found flag.

          zip.on('entry', entry => {
            if (entry.fileName === file) {
              Fnd = true;

              const mimeTypes = {
                '.bmp':  'image/x-windows-bmp',
                '.gif':  'image/gif',
                '.ico':  'image/x-icon',
                '.jpg':  'image/jpeg',
                '.png':  'image/png',
                '.svg':  'image/svg+xml',
                '.webp': 'image/webp',
              };

              const mimeType = mimeTypes[path.extname(file)] || 'text/plain';
              const lastMod = entry.getLastModDate ? entry.getLastModDate() : null;
              const ifModifiedSince = Rqst.headers['if-modified-since'];
              const cacheSeconds = 3600;

              if (lastMod && ifModifiedSince && ifModifiedSince !== 'Invalid Date') {
                const checkedMs = (new Date(ifModifiedSince)).getTime();

                if (lastMod.getTime() <= checkedMs) {
                  Rspns.writeHead(304, {
                    'Cache-Control': `public, max-age=${cacheSeconds}`,
                    'Content-Type': mimeType,
                    'Last-Modified': ifModifiedSince,
                  });
                  Rspns.end();
                  zip.close();
                  Db.Close();

                  return;
                }
              }

              zip.openReadStream(entry, (error, stream) => {
                if (error) {
                  zip.close();
                  Db.Close();

                  return Then();
                }

                const headers = {
                  'Cache-Control': `public, max-age=${cacheSeconds}`,
                  'Content-Type': mimeType,
                };

                if (lastMod) {
                  headers['Last-Modified'] = lastMod.toUTCString();
                }

                Rspns.writeHead(200, headers);

                stream.on('end', () => {
                  zip.close();
                  Db.Close();
                });

                stream.pipe(Rspns);
              });

              return;
            }

            zip.readEntry();
          });

          zip.on('end', () => {
            if (!Fnd) {
              zip.close();
              Db.Close();

              Then();
            }
          });

          zip.readEntry();
        });
      })
      .catch(() => {
        Db.Close();

        Then();
      });
  },
  Read: (Rqst, Prm, End) => {
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    if (!is.String(Prm.Id)) { return End(-1, Kwd.RM.StrangeValue); }

    const Db = new sqlite(DB_PTH);

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
        const SQL =
          'SELECT Blog.id AS Id, Blog.title AS Ttl, Blog.file AS Fl, Blog.summary AS Smry, ' +
          'Blog.datetime AS Dt, COUNT(BlogComment.id) AS CmtCnt ' +
          'FROM Blog LEFT JOIN BlogComment ON Blog.id = BlogComment.blog_id ' +
          'WHERE Blog.id = ? GROUP BY Ttl, Fl, Dt;';

        return Db.Query(SQL, [ Prm.Id ]);
      })
      .then(Rst => {
        if (!Rst || !is.Array(Rst) || !Rst.length) { return Promise.reject({ Cd: -4, Msg: Kwd.RM.NoSuchData }); }

        const SQL = 'SELECT Tag.id AS ID, Tag.name AS Nm FROM Tag, TagLink ' +
              'WHERE Tag.id = TagLink.tag_id AND TagLink.link_id = ?;';

        SqlRst = Rst[0];

        return Db.Query(SQL, [ SqlRst.Id ]);
      })
      .then(Rslt => {
        if (Rslt || is.Array(Rslt) || Rslt.length) { SqlRst.Tgs = Rslt; }

        SqlRst.Url = '/blog/' + SqlRst.Id;

        switch (path.extname(SqlRst.Fl)) {
          case '.txt':
          case '.md':
            cache.FileLoad(
              `${BLG_PTH}/${SqlRst.Fl}`,
              (Cd, Str) => {
                if (Cd < 0) { return PckEnd(1, Kwd.RM.SystemError); }

                SqlRst.Info = Str;

                PckEnd(0, Kwd.RM.Done, SqlRst);
              });

            return;

          case '.zip':
            Blog.ZipRead(SqlRst, Cd => { PckEnd(Cd, (Cd < 0) ? Kwd.RM.SystemError : Kwd.RM.Done, SqlRst); });

            return;

          default:
            return PckEnd(1, Kwd.RM.StepTest);
        }
      })
      .catch(({ Cd = -1, Msg = '' }) => {
        PckEnd(Cd, Msg || Kwd.RM.DbCrash);
      });
  },
  ZipRead: (SqlRst, Then) => {
    if (!SqlRst || !SqlRst.Fl) { return Then(-1); }

    yauzl.open(`${BLG_PTH}/${SqlRst.Fl}`, { lazyEntries: true }, (error, zipFile) => {
      if (error) {
        return Then(-2);
      }

      zipFile.on('entry', entry => {
        if (!entry.fileName.endsWith('.md')) {
          zipFile.readEntry();

          return;
        }

        zipFile.openReadStream(entry, (error, stream) => {
          if (error) {
            zipFile.close();

            return Then(-3);
          }

          let data = '';

          stream.on('data', chunk => {
            data += chunk.toString();
          });

          stream.on('end', () => {
            SqlRst.Info = data.replace(/\((.+?)\)/g, `(/blog/${SqlRst.Id}/$1)`);

            zipFile.close();
            Then(0);
          });
        });
      });

      zipFile.readEntry();
    });
  },
};

export const Tag = {
  List: (Rqst, Prm, End) => {
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    const Db = new sqlite(DB_PTH);

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
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (!Ssn.IsLogged(Rqst, Rspns)) { return PckEnd(-1, Kwd.RM.NotLogin); }

    if (!Prm.Nm || !is.String(Prm.Nm)) { return PckEnd(-2, Kwd.RM.StrangeValue); }

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
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (!Ssn.IsLogged(Rqst, Rspns)) { return PckEnd(-1, Kwd.RM.NotLogin); }

    if (!Prm.ID || !is.String(Prm.ID) || !Prm.Nm || !is.String(Prm.Nm)) { return PckEnd(-2, Kwd.RM.StrangeValue); }

    const SQL = 'UPDATE Tag SET name = ? WHERE id = ?;';

    Db.Query(SQL, [ Prm.Nm, Prm.ID ])
      .then(Rst => {
        if (!Rst) { return PckEnd(-3, Kwd.RM.DbCrash); }

        PckEnd(0, Kwd.RM.Done);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -4, Kwd.RM.DbCrash); });
  },
  Delete: (Rqst, Rspns, Prm, End) => {
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (!Ssn.IsLogged(Rqst, Rspns)) { return PckEnd(-2, Kwd.RM.NotLogin); }

    if (!Prm.ID || !is.String(Prm.ID)) { return PckEnd(-3, Kwd.RM.StrangeValue); }

    Db.Transaction('BEGIN')
      .then(() => { return Db.Query('DELETE FROM TagLink WHERE tag_id = ?;', [ Prm.ID ]); })
      .then(() => { return Db.Query('DELETE FROM Tag WHERE id = ?;', [ Prm.ID ]) })
      .catch(Cd => { PckEnd(-4, Kwd.RM.DbCrash, Cd); })
      .then(() => {
        Db.Transaction('COMMIT');
        PckEnd(0, Kwd.RM.Done);
      });
  },
};

export const Msg = { // message.
  List: (Rqst, Prm, End) => {
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    const Db = new sqlite(DB_PTH);

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
                'ORDER BY ChnDt DESC LIMIT ? OFFSET ?;';

    Db.Query(SQL, [ Lmt, Ofst ])
      .then(Rst => {
        if (!Rst) { return PckEnd(-4, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, Rst);
      })
      .catch(Cd => { PckEnd(Cd * 10 + -5, Kwd.RM.DbCrash); });
  },
  ChainList: (Rqst, Prm, End) => {
    if (!Prm || !is.Object(Prm) || !is.Function(End)) { return; }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-1, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    if (!Prm.ID || !is.UUID(Prm.ID)) { return PckEnd(-2, Kwd.RM.StrangeValue); }

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
    if (!is.Function(End)) { return; }

    if (!Nm || !is.String(Nm) || !Ml || !is.EMail(Ml) || !Msg || !is.String(Msg))
    { return End(-1, 0, Kwd.RM.StrangeValue); }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); }),
      Id = MakeId(),
      IP = GetIp(Rqst),
      Dt = GetDatetime();
    let SQL = 'INSERT INTO Message (id, name, mail, ip, datetime, message) VALUES (?, ?, ?, ?, ?, ?);',
      Prm = [ Id, Nm, Ml, IP, Dt, Msg ];

    if (Tgt && is.UUID(Tgt)) {
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

    const Db = new sqlite(DB_PTH);

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
        if (!DbRst || !is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  },
  Delete: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const { ID = '' } = Prm;

    if (!ID || !is.UUID(ID)) {
      return End(-2, Kwd.RM.StrangeValue);
    }

    const Db = new sqlite(DB_PTH),
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
        if (!DbRst || !is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  },
};

export const Wds = { // good words.
  /*
    @ request object.
    @ params.
    @ callback function to end process. */
  NowOneGet: (Rqst, Prm, End) => {
    if (!is.Function(End)) { return; }

    const Db = new sqlite(DB_PTH);

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

    const Db = new sqlite(DB_PTH);

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

    const SQL = 'SELECT id AS ID, words AS Wds, datetime AS Dt FROM GoodWords ORDER BY Dt DESC LIMIT ?, ?;';

    Db.Query(SQL, [ Ofst, Lmt ])
      .catch(Cd => { PckEnd(-5, Kwd.RM.DbCrash, Cd); })
      .then(DbRst => {
        if (!DbRst || !is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  },
  Create: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); }),
      { Wds = '' } = Prm;

    if (!Wds || !is.String(Wds)) {
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
        if (!DbRst || !is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, Id);
      });
  },
  Update: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); }),
      { ID = '', Wds = '' } = Prm;

    if (!ID || !is.UUID(ID) || !Wds || !is.String(Wds)) {
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
        if (!DbRst || !is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  },
  Delete: (Rqst, Rspns, Prm, End) => {
    if (!Ssn.IsLogged(Rqst, Rspns)) { return End(-1, Kwd.RM.NotLogin); }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) { return End(-2, Kwd.RM.DbCrash); }

    const PckEnd = PackedEnd(End, () => { Db.Close(); }),
      { ID = '' } = Prm;

    if (!ID || !is.UUID(ID)) {
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
        if (!DbRst || !is.Array(DbRst)) { return PckEnd(-6, Kwd.RM.NoSuchData); }

        PckEnd(0, Kwd.RM.Done, DbRst);
      });
  },
};

export const ArtCnr = { // Art Corner.
  RandomOneGet: (Rqst, Prm, End) => {
    const imageUrl = cache.Get(NOW_ART_CORNER_KEY);

    if (imageUrl) {
      return End(1, Kwd.RM.Done, imageUrl);
    }

    const Db = new sqlite(DB_PTH);

    if (!Db.IsReady()) {
      return End(-1, Kwd.RM.DbCrash);
    }

    const PckEnd = PackedEnd(End, () => { Db.Close(); });

    Db
      .Query(`
        SELECT Blog.id, Blog.file, Blog.published
        FROM
          Blog RIGHT JOIN (
            SELECT link_id
            FROM TagLink
            WHERE tag_id = 'f45ed33ada78873f268ace3fdca9c975'
          ) AS Wanted
          ON Blog.id = Wanted.link_id
        ORDER BY datetime DESC;
      `)
      .then(result => {
        if (!is.Array(result)) {
          return PckEnd(-2, Kwd.RM.NoSuchData);
        }

        const index = Math.floor(Math.random() * result.length);

        const { id, file } = result[index];

        yauzl.open(`${BLG_PTH}/${file}`, { lazyEntries: true }, (error, zipFile) => {
          if (error) {
            return PckEnd(-3, Kwd.RM.LoadDataFail);
          }

          zipFile.on('entry', entry => {
            const allowedExtensions = [ '.png', '.jpg', '.webp' ];
            const extension = path.extname(entry.fileName);

            if (!allowedExtensions.includes(extension)) {
              zipFile.readEntry();

              return;
            }

            const imageUrl = `/blog/${id}/${entry.fileName}`;

            cache.RecycleRoll(10); // passively start the cache recyle.
            cache.Set(NOW_ART_CORNER_KEY, imageUrl, 1800);
            zipFile.close();

            PckEnd(0, Kwd.RM.Done, imageUrl);
          });

          zipFile.readEntry();
        })
      })
      .catch(_ => {
        PckEnd(-4, Kwd.RM.SystemError);
      });
  },
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

        const Tsks = Fls.map(Fl => {
          return new Promise(Resolve => {
            const Pth = CCH_PTH + '/' + Fl;

            fs.stat(
              Pth,
              (Err, St) => {
                if (Err || !St.mtime || St.mtime > ExprTm) { return Resolve(); }

                Cnt++;

                fs.unlink(Pth, () => {});
                Resolve();
              });
          });
        });

        Promise
          .all(Tsks)
          .then(() => End(0, Kwd.RM.Done, Cnt));
      });
  },
  // To do.
  // _FolderSizeGet: (Pth, Then) => {
  //   if (!Pth || !is.String(Pth)) { return 0; }

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
          return new Promise(Resolve => {
            getFolderSize(DAT_PTH + '/' + Fl).then(({ size: Sz, errors: Errs }) => {
              if (Errs) { log(Errs); }

              Resolve({ Fl, Sz });
            });
          });
        });

        Promise.all(Tsks).then(Rslts => End(0, Kwd.RM.Done, Rslts));
      });
  },
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

    const Ssn = cache.Get(ADMIN_SESSION_KEY); // session.

    if (!Ssn || Ssn !== Cks[ADMIN_SESSION_KEY]) { return false; }

    // ==== extend session expiration. ====

    const Ck = cookie.serialize(ADMIN_SESSION_KEY, Ssn, { maxAge: ADMIN_SESSION_EXPIRE, path: '/' }); // cookie.

    if (Rspns && (typeof Rspns.setHeader === 'function')) {
      Rspns.setHeader('Set-Cookie', Ck);
      cache.Set(ADMIN_SESSION_KEY, Ssn, ADMIN_SESSION_EXPIRE);
    }

    return true;
  },
  LogIn (Rqst, Rspns, Prm, End) {
    if (!is.Function(End)) { return; }

    if (this.IsLogged(Rqst, Rspns)) { return End(1, Kwd.RM.HasLoggedIn); }

    if (!Prm || !is.Object(Prm) || !is.String(Prm.Pswd)) { return End(-1, Kwd.RM.PasswordNeed); }

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
    cache.Set(ADMIN_SESSION_KEY, Ssn, ADMIN_SESSION_EXPIRE);

    End(0, Kwd.RM.Done);
  },
  LogOut (Rqst, Rspns, Prm, End) {
    const Ck = cookie.serialize(ADMIN_SESSION_KEY, '', { maxAge: -1, path: '/' }); // cookie.

    Rspns.setHeader('Set-Cookie', Ck);
    cache.Set(ADMIN_SESSION_KEY, '', 0); // make the cache expired.
    End(0, Kwd.RM.Done);
  },
};

const Lbry = {
  ArtCnr,
  Blog,
  Msg,
  Ssn,
  Systm,
  Tag,
  Wds,
};

export default Lbry;
