import log from 'rzjs/log.mjs';

import { Blog, Tag } from '../library.mjs';

export const BlogsPage = (request, option, next) => {
  const { t: TgId } = request.query || {},
    PckdIds = [ TgId ]; // picked ids.

  const TagList = new Promise((Resolve, Reject) => {
    Tag.List(
      request,
      {},
      (Idx, Msg, Tgs) => {
        if (Idx < 0) {
          log(`${Idx} - ${Msg}`, 'error');
          Reject(-1);

          return;
        }

        if (PckdIds.length > 0) {
          Tgs.map(Tg => {
            if (PckdIds.indexOf(Tg.ID) > -1) { Tg.IsPckd = true; }
          });
        }

        request.riotPlugin.StoreSet('TAGS', () => Tgs);
        Resolve(0);
      });
  });

  const BlogList = new Promise(Resolve => {
    Blog.List(
      request,
      { Lmt: 5, TgIDA: PckdIds },
      (Idx, Msg, Blgs) => {
        request.riotPlugin.StoreSet('BLOGS', () => Blgs);
        Resolve(0);
      });
  });

  Promise.all([ TagList, BlogList ]).then(() => next(0));
};

export default BlogsPage;
