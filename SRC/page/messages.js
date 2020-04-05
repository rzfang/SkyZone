const Log = require('../RZ-Js-Log'),
      { Msg } = require('../library');

module.exports = (Rqst, { UrlInfo, Prm }, Then) => {
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
