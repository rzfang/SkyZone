import log from 'rzjs/log.mjs';

import { Blog } from '../library.mjs';

export const BlogPage = (request, option, next) => {
  const {
      query: { b: QryId = '' },
      params: { id: PrmId = '' },
    } = request || {},
    Id = QryId || PrmId; // support both /[type]?b=[id] and /blog/[id].

  if (!Id) {
    log('no blog id.', 'error');
    next(-1);

    return;
  }

  Blog.Read(
    request,
    { Id },
    (Idx, Msg, Blg) => {
      if (Idx < 0) {
        log(`${Idx} - ${Msg}`, 'error');

        return next(-1);
      }

      request.riotPlugin.StoreSet('BLOG', () => Blg);

      if (Blg.Ttl) {
        request.riotPlugin.StoreSet(
          'PAGE',
          () => { return { title: '空域 - 網誌 - ' + Blg.Ttl }; });
      }

      next(0);
    });
};

export default BlogPage;
