import async from 'async';
import { Log } from 'rzjs';

import { Blog, Tag } from '../library.mjs';

export const BlogsPage = (Rqst, {}, Then) => {
  const { t: TgId } = Rqst.query || {},
        PckdIds = [ TgId ]; // picked ids.

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

export default BlogsPage;
