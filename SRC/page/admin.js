const async = require('async');
const fs = require('fs');

const Cch = require('../RZ-Nd-Cache');
const Log = require('../RZ-Js-Log');
const { Ssn: { IsLogged } } = require('../library');

function FeedLastDateGet (Clbck) {
  const CchKy = 'FdLstDt';
  const FdLstDt = Cch.Get(CchKy);

  if (FdLstDt) { return Clbck(0, FdLstDt); }

  fs.stat(
    __dirname + '/../../DAT/feed.xml',
    (Err, St) => {
      if (Err) { return Clbck(-1, Err); }

      let Dt = new Date(St.mtime);
      const Y = Dt.getFullYear().toString();
      const M = (Dt.getMonth() + 1).toString().padStart(2, '0');
      const D = Dt.getDate().toString().padStart(2, '0');
      const H = Dt.getHours().toString().padStart(2, '0');
      const m = Dt.getMinutes().toString().padStart(2, '0');
      const S = Dt.getSeconds().toString().padStart(2, '0');

      Dt = `${Y}-${M}-${D} ${H}:${m}:${S}`;

      Cch.Set(CchKy, Dt, 60 * 60);
      Clbck(0, Dt);
     });
}

module.exports = (Rqst, UrlInfo, Clbck) => {
  async.parallel(
    {
      FdLstDt: (Clbck) => {
        FeedLastDateGet((Cd, Rst) => {
          if (Cd < 0) { return Clbck(Rst); }

          Clbck(null, Rst);
        });
      }
    },
    (Err, Rst) => {
      if (Err) {
        Log(Err);

        return Clbck(-1, Err);
      }

      const { FdLstDt } = Rst;

      Clbck(
        0,
        {
          IsLgd: IsLogged(Rqst),
          FdLstDt
        });
    });
};
