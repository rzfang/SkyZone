import fs from 'fs';
import path from 'path';
import { cache, log } from 'rzjs';
import { fileURLToPath } from 'url';

import { Ssn } from '../library.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { IsLogged } = Ssn;

function FeedLastDateGet (next) {
  const CchKy = 'FdLstDt';
  const FdLstDt = cache.Get(CchKy);

  if (FdLstDt) { return next(0, FdLstDt); }

  fs.stat(
    __dirname + '/../../DAT/feed.xml',
    (Err, St) => {
      if (Err) {
        log(Err);
        next(-1, Err);

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

      cache.Set(CchKy, Dt, 60 * 60);
      next(0, Dt);
    });
}

const AdminPage = (request, option, next) => {
  FeedLastDateGet((Cd, FdLstDt) => {
    if (Cd < 0) { return next(-1, ''); }

    request.riotPlugin.StoreSet(
      'ADMIN',
      () => { return { FdLstDt, IsLgd: IsLogged(request) }; });

    next(0, {});
  })
};

export default AdminPage;
