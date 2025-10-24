import log from 'rzjs/log.mjs';

import { Msg } from '../library.mjs';

export const MsgsPage = (request, option, next) => {
  Msg.List(
    request,
    { Lmt: 5 },
    (Idx, Msg, MsgLst) => {
      if (Idx < 0) {
        log(`${Idx} - ${Msg}`, 'error');
        next(-1);

        return;
      }

      request.riotPlugin.StoreSet('MESSAGES', () => MsgLst);
      next(0);
    });
};

export default MsgsPage;
