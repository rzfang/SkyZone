const async = require('async');
const fs = require('fs');

const Cch = require('../RZ-Nd-Cache');
const Log = require('../RZ-Js-Log');
const { Ssn: { IsLogged } } = require('../library');

function FeedLastDateGet (Then) {
  const CchKy = 'FdLstDt';
  const FdLstDt = Cch.Get(CchKy);

  if (FdLstDt) { return Then(0, FdLstDt); }

  fs.stat(
    __dirname + '/../../DAT/feed.xml',
    (Err, St) => {
      if (Err) { return Then(-1, Err); }

      let Dt = new Date(St.mtime);
      const Y = Dt.getFullYear().toString();
      const M = (Dt.getMonth() + 1).toString().padStart(2, '0');
      const D = Dt.getDate().toString().padStart(2, '0');
      const H = Dt.getHours().toString().padStart(2, '0');
      const m = Dt.getMinutes().toString().padStart(2, '0');
      const S = Dt.getSeconds().toString().padStart(2, '0');

      Dt = `${Y}-${M}-${D} ${H}:${m}:${S}`;

      Cch.Set(CchKy, Dt, 60 * 60);
      Then(0, Dt);
     });
}

module.exports = (Rqst, Optn, Then) => {
  async.parallel(
    {
      FdLstDt: (Then) => {
        FeedLastDateGet((Cd, Rst) => {
          if (Cd < 0) { return Then(Rst); }

          Then(null, Rst);
        });
      }
    },
    (Err, Rst) => {
      if (Err) {
        Log(Err);

        return Then(-1, Err);
      }

      const { FdLstDt } = Rst;

      Rqst.RMI.StoreSet(
        'ADMIN',
        () => {
          return {
            FdLstDt,
            IsLgd: IsLogged(Rqst)
          };
        });

      Then(0, {});
    });
};
