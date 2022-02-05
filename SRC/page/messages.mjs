import { Log } from 'rzjs';

import { Msg } from '../library.mjs';

export const MsgsPage = (Rqst, {}, Then) => {
  Msg.List(
    Rqst,
    { Lmt: 5 },
    (Idx, Msg, MsgLst) => {
      if (Idx < 0) {
        Log(`${Idx} - ${Msg}`, 'error');
        Then(-1);

        return;
      }

      Rqst.RMI.StoreSet('MESSAGES', () => MsgLst);
      Then(0);
    });
};

export default MsgsPage;
