const { Log } = require('rzjs');

const { Blog } = require('../library');

module.exports = (Rqst, Optn, Then) => {
  const {
      query: { b: QryId = '' },
      params: { id: PrmId = '' }
    } = Rqst || {},
    Id = QryId || PrmId; // support both /[type]?b=[id] and /blog/[id].

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

        return Then(-1);
      }

      Rqst.RMI.StoreSet('BLOG', () => Blg);

      if (Blg.Ttl) {
        Rqst.RMI.StoreSet(
          'PAGE',
          () => { return { title: '空域 - 網誌 - ' + Blg.Ttl }; });
      }

      Then(0);
    });
};
