import App from 'rzjs/node/RiotHttp.js';
import path from 'path';
import { fileURLToPath } from 'url';

import Cnst from './SRC/constant.json';
import Svc from './SRC/service.mjs';

import AdminPage from './SRC/page/admin.mjs';
import BlogPage from './SRC/page/blog.mjs';
import BlogsPage from './SRC/page/blogs.mjs';
import MessagesPage from './SRC/page/messages.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JQUERY_CDN = 'https://code.jquery.com/jquery-3.4.1.min.js',
      CCH_PTH = path.resolve(__dirname, Cnst.CCH_PTH),
      STTC_PTH = path.resolve(__dirname, Cnst.STTC_PTH),
      TMP_PTH = path.resolve(__dirname, Cnst.TMP_PTH);

const DftPgRt = { // default page route. here should handle 404.
  title: '空域',
  description: '我的天空，我在其中，在我這裡，自由放空。RZ 的個人網站。',
  keywords: '天空, 空域, RZ, 個人網站',
  author: 'RZ Fang',
  favicon: 'favicon.ico',
  feed: '/feed.xml',
  css: [ '/resource/style2.css' ],
  js: [ '/resource/api2.min.js' ],
  body: {}
};

const BlgPgRt = { // blog page route.
  ...DftPgRt,
  title: '空域 - 網誌',
  body: { type: 'riot', component: './SRC/page/page-blog.riot', initialize: BlogPage },
  // js: [ '/resource/api2.min.js', '/markdown-it.min.js' ]
  js: []
};

const RHC = { // Riot HTTP config.
  port: 9004,
  uploadFilePath: TMP_PTH,
  page: {
    '/admin': {
      ...DftPgRt,
      title: '空域 - 管理員',
      js: [ '/resource/api2.min.js', '/markdown-it.min.js' ],
      body: { type: 'riot', component: './SRC/page/page-admin.riot', initialize: AdminPage }},

    '/about': {
      ...DftPgRt,
      title: '空域 - 關於',
      body: { type: 'riot', component: './SRC/page/page-about.riot' }
    },
    '/blogs': {
      ...DftPgRt,
      title: '空域 - 網誌',
      body: { type: 'riot', component: './SRC/page/page-blogs.riot', initialize: BlogsPage }
    },
    '/text': BlgPgRt,
    '/image': BlgPgRt,
    '/images': BlgPgRt,
    '/zft': BlgPgRt,
    '/blog/:id': BlgPgRt,
    '/messages': {
      ...DftPgRt,
      title: '空域 - 留言',
      body: { type: 'riot', component: './SRC/page/page-messages.riot', initialize: MessagesPage }
    },
    '/zone': {
      ...DftPgRt,
      css: [ '/resource/style1.css' ],
      js: [ JQUERY_CDN, 'resource/api1.min.js' ],
      body: { type: 'html', component: path.resolve(__dirname, './SRC/page/zone.html') }
    },
    '/': {
      ...DftPgRt,
      css: [],
      js: [ 'resource/api1.min.js' ],
      body: { type: 'html', component: path.resolve(__dirname, './SRC/page/index.html') }
    }
  },
  errorPage: {
    '404': {
      ...DftPgRt,
      title: '空域 - 404',
      body: { type: 'riot', component: './SRC/page/page-error404.riot' }
    },
    '500': {
      ...DftPgRt,
      title: '空域 - 500',
      body: { type: 'riot', component: './SRC/page/page-error500.riot' }
    }
  },
  service: {
    case: {
      '/service/artcorner': {
        get: Svc.ArtCornerRandomOneGet
      },
      '/service/blog/list/admin': {
        get: Svc.BlogAdminList
      },
      '/service/blog/list/unpublished': {
        get: Svc.BlogUnpublishedList
      },
      '/service/blog/list': {
        get: Svc.BlogList,
      },
      '/service/blog': {
        delete: Svc.BlogDelete,
        get: Svc.BlogRead,
        patch: Svc.BlogUpdate,
        post: Svc.BlogCreate,
        put: Svc.BlogUpload
      },
      '/service/comment': {
        delete: Svc.CommentDelete,
        get: Svc.CommentList,
        post: Svc.CommentLeave
      },
      '/service/feed': {
        patch: Svc.FeedPublish
      },
      '/service/message/admin': {
        get: Svc.MessageAdminList
      },
      '/service/message/chain': {
        get: Svc.MessageChainList
      },
      '/service/message': {
        delete: Svc.MessageDelete,
        get: Svc.MessageList,
        post: Svc.MessageLeave
      },
      '/service/tag': {
        delete: Svc.TagDelete,
        get: Svc.TagList,
        patch: Svc.TagRename,
        post: Svc.TagAdd
      },
      '/service/words/list': {
        get: Svc.WordsList,
      },
      '/service/words': {
        delete: Svc.WordsDelete,
        get: Svc.WordsNowOneGet,
        patch: Svc.WordsUpdate,
        post: Svc.WordsCreate
      },
      '/service/session/login': {
        post: Svc.SessionLogIn
      },
      '/service/session/logout': {
        post: Svc.SessionLogOut
      },
      '/service/cache': {
        delete: Svc.SystemCacheClean
      },
      '/service/data/size': {
        get: Svc.SystemDataSize
      }
    }
  },
  route: [
    { // google search console validate.
      path: /\/google301903d8518925d5.html$/,
      type: 'resource',
      location: './WEB/www'
    },

    // === node_modules ===

    {
      path: /markdown-it\.min\.js$/,
      type: 'resource',
      location: './node_modules/markdown-it/dist',
      nameOnly: true
    },
    {
      path: /Is\.js$/,
      type: 'resource',
      location: './node_modules/rzjs',
      nameOnly: true
    },

    // ===

    { // SEO files.
      path: /\/(favicon\.ico|robots\.txt)/,
      type: 'resource',
      location: './WEB/www',
      nameOnly: true
    },
    { // resource: Js, CSS.
      path: /\.(css|js)$/,
      type: 'resource',
      location: STTC_PTH
    },
    {
      path: /^\/feed.xml$/,
      type: 'resource',
      location: './DAT'
    },

    // ===

    { // dynamic image resource.
      path: /^\/resource\/image\/.+/,
      type: 'resource',
      location: CCH_PTH,
      nameOnly: true
    },
    { // static image resource.
      path: /^\/image\/.+/,
      type: 'resource',
      location: STTC_PTH
    }
  ]
}

App.Build(RHC, 'mjs').Initialize(RHC).Run();
