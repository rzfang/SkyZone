const Log = require('../RZ-Js-Log'),
      { Blog } = require('../library');

module.exports = (Rqst, {}, Then) => {
  const { b: Id = '' } = Rqst.query || {};

  if (!Id) {
    Log('no blog id.', 'error');
    Then(-1);

    return;
  }

  Blog.Read(
    Rqst,
    { Id },
    (Idx, Msg, Blg) => {
      if (Idx < 0) {
        Log(`${Idx} - ${Msg}`, 'error');
        Then(-1);

        return;
      }

      Rqst.RMI.StoreSet('BLOG', () => Blg);
      Then(0);
    });
};
