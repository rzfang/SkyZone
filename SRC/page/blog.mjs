import { Log } from 'rzjs';

import { Blog } from '../library.mjs';

export const BlogPage = (Rqst, Optn, Then) => {
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

      Rqst.R4FMI.StoreSet('BLOG', () => Blg);

      if (Blg.Ttl) {
        Rqst.R4FMI.StoreSet(
          'PAGE',
          () => { return { title: '空域 - 網誌 - ' + Blg.Ttl }; });
      }

      Then(0);
    });
};

export default BlogPage;
