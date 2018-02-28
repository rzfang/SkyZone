const crypto = require('crypto');
const path = require('path');

const Cnst = require('./constant.json'),
      Kwd = require('./keyword.json'),
      Is = require('./RZ-Js-Is'),
      SQLite = require('./RZ-Nd-SQLite');

const DB_PTH = path.resolve(__dirname, '..', Cnst.DB_PTH);

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

function GetDatetime () {
  const Dt = new Date(); // datetime object.

  return Dt.getFullYear().toString() + '-' +
        (Dt.getMonth() + 1).toString().padStart(2, '0') + '-' +
        Dt.getDate().toString().padStart(2, '0') + ' ' +
        Dt.getHours().toString().padStart(2, '0') + ':' +
        Dt.getMinutes().toString().padStart(2, '0') + ':' +
        Dt.getSeconds().toString().padStart(2, '0');
}

function MakeCircularString (Arr, FlStr = '?', SpStr = ', ') {
  return (new Array(Arr.length)).fill(FlStr).join(SpStr)
}

module.exports = {
  Blog: {
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
          .catch(Cd => { PckEnd(Cd, Kwd.RM.SystemError); });
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

      return Db.Query(SQL, QryPrm)
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
        .catch(Cd => { PckEnd(Cd, Kwd.RM.SystemError); });
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
        .catch(Cd => { PckEnd(Cd, Kwd.RM.SystemError); });
    }
  },
  Tag: {
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
    }
  },
  Msg: { // message.
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
    }
  },
  Wds: { // good words.
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
  }
};
