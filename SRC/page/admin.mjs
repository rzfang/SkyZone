import fs from 'fs';
import path from 'path';
import { Cache as Cch, Log } from 'rzjs';
import { fileURLToPath } from 'url';

import { Ssn } from '../library.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { IsLogged } = Ssn;

function FeedLastDateGet (Then) {
  const CchKy = 'FdLstDt';
  const FdLstDt = Cch.Get(CchKy);

  if (FdLstDt) { return Then(0, FdLstDt); }

  fs.stat(
    __dirname + '/../../DAT/feed.xml',
    (Err, St) => {
      if (Err) {
        Log(Err);
        Then(-1, Err);

        return;
      }

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

const AdminPage = (Rqst, Optn, Then) => {
  FeedLastDateGet((Cd, FdLstDt) => {
    if (Cd < 0) { return Then(-1, ''); }

    Rqst.R4FMI.StoreSet(
      'ADMIN',
      () => { return { FdLstDt, IsLgd: IsLogged(Rqst) }; });

    Then(0, {});
  })
};

export default AdminPage;
