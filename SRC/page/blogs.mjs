import { Log } from 'rzjs';

import { Blog, Tag } from '../library.mjs';

export const BlogsPage = (Rqst, Optn, Then) => {
  const { t: TgId } = Rqst.query || {},
        PckdIds = [ TgId ]; // picked ids.

  const TagList = new Promise((Resolve, Reject) => {
    Tag.List(
      Rqst,
      {},
      (Idx, Msg, Tgs) => {
        if (Idx < 0) {
          Log(`${Idx} - ${Msg}`, 'error');
          Reject(-1);

          return;
        }

        if (PckdIds.length > 0) {
          Tgs.map(Tg => {
            if (PckdIds.indexOf(Tg.ID) > -1) { Tg.IsPckd = true; }
          });
        }

        Rqst.R4FMI.StoreSet('TAGS', () => Tgs);
        Resolve(0);
      });
  });

  const BlogList = new Promise(Resolve => {
    Blog.List(
      Rqst,
      { Lmt: 5, TgIDA: PckdIds },
      (Idx, Msg, Blgs) => {
        Rqst.R4FMI.StoreSet('BLOGS', () => Blgs);
        Resolve(0);
      });
  });

  Promise.all([ TagList, BlogList ]).then(() => Then(0));
};

export default BlogsPage;
