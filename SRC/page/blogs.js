const async = require('async');

const Log = require('../RZ-Js-Log'),
      { Blog, Tag } = require('../library');

module.exports = (Rqst, { UrlInfo, Prm }, Then) => {
  let PckdIds = [];

  if (Prm.Url && Prm.Url.t) { PckdIds = Array.isArray(Prm.Url.t) ? Prm.Url.t : Prm.Url.t.split(','); }

  async.parallel(
    {
      TagList: Then1 => {
        Tag.List(
          Rqst,
          {},
          (Idx, Msg, Tgs) => {
            if (Idx < 0) {
              Log(`${Idx} - ${Msg}`, 'error');
              Then1(-1);

              return;
            }

            if (PckdIds.length > 0) {
              Tgs.map(Tg => {
                if (PckdIds.indexOf(Tg.ID) > -1) { Tg.IsPckd = true; }
              });
            }

            Rqst.RMI.StoreSet('TAGS', () => Tgs);
            Then1(0);
          });
      },
      BlogList: Then2 => {
        Blog.List(
          Rqst,
          { Lmt: 5, TgIDA: PckdIds },
          (Idx, Msg, Blgs) => {
            Rqst.RMI.StoreSet('BLOGS', () => Blgs);
            Then2(0);
          });
      }
    },
    (Err, Rslt) => { Then(0); });
};
