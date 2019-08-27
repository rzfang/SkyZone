const path = require('path');

const Cnst = require('./constant.json'),
      Kwd = require('./keyword.json'),
      Svc = require('./service');

const AdminPage = require('./page/admin');

const JQUERY_CDN = 'https://code.jquery.com/jquery-3.4.1.min.js',
      CCH_PTH = path.resolve(__dirname, '..', Cnst.CCH_PTH),
      STTC_PTH = path.resolve(__dirname, '..', Cnst.STTC_PTH),
      TMP_PTH = path.resolve(__dirname, '..', Cnst.TMP_PTH);

const DftPgRt = { // here should handle 404.
  title: '空域',
  description: '我的天空，我在其中，在我這裡，自由放空。RZ 的個人網站。',
  keywords: '天空, 空域, RZ, 個人網站',
  author: 'RZ Fang',
  favicon: 'favicon.ico',
  feed: '/feed.xml',
  css: [ '/resource/base.css', '/resource/style2.css' ],
  js: [ '/resource/api2.min.js' ],
  body: [ 'header.tag', 'p404.tag', 'footer.tag' ]
};

module.exports = {
  port: 9004,
  keyword: Kwd.RM,
  cdn: {
    riot: 'https://cdn.jsdelivr.net/npm/riot@3.13/riot+compiler.min.js'
  },
  uploadFilePath: TMP_PTH,
  page: {
    '/admin': {
      ...DftPgRt,
      title: '空域 - 管理員',
      js: [ '/resource/api2.min.js', '/resource/tabbox.tag' ],
      body: [
        { type: 'riot', component: './component/admin.tag', initialize: AdminPage }
      ]},
    '/about': {
      ...DftPgRt,
      js: [ '/resource/api2.min.js', '/resource/tabbox.tag' ],
      body: [ 'header.tag', 'about.tag', 'footer.tag' ]
    },
    '/blogs': {
      ...DftPgRt,
      js: [ '/resource/api2.min.js', '/resource/icon.tag', '/resource/tags.tag' ],
      body: [ 'header.tag', 'blogs.tag', 'footer.tag' ]
    },
    '/text': {
      ...DftPgRt,
      js: [ '/resource/api2.min.js', '/resource/icon.tag', '/resource/sharebox.tag', '/resource/tags.tag' ],
      body: [ 'header.tag', 'text.tag', 'footer.tag' ]
    },
    '/image': {
      ...DftPgRt,
      js: [ '/resource/api2.min.js', '/resource/icon.tag', '/resource/sharebox.tag', '/resource/tags.tag' ],
      body: [ 'header.tag', 'image-page.tag', 'footer.tag' ]
    },
    '/images': {
      ...DftPgRt,
      js: [
        '/resource/api2.min.js',
        '/resource/icon.tag',
        '/late-img.tag',
        '/resource/sharebox.tag',
        '/resource/tags.tag' ],
      body: [ 'header.tag', 'images-page.tag', 'footer.tag' ]
    },
    '/zft': {
      ...DftPgRt,
      js: [ '/resource/api2.min.js', '/resource/icon.tag', '/resource/sharebox.tag', '/resource/tags.tag' ],
      body: [ 'header.tag', 'zft-page.tag', 'footer.tag' ]
    },
    '/messages': {
      ...DftPgRt,
      body: [ 'header.tag', 'messages.tag', 'footer.tag' ]
    },
    '/zone': {
      ...DftPgRt,
      css: [ '/resource/base.css', '/resource/style1.css' ],
      js: [ JQUERY_CDN, 'resource/api1.min.js' ],
      body: [ 'page/zone.html' ]
    },
    '/': {
      ...DftPgRt,
      css: [],
      js: [ JQUERY_CDN, 'resource/api1.min.js' ],
      body: [ 'page/index.html' ]
    },
    '/500': {
      ...DftPgRt,
      body: [
        'header.tag',
        'p500.tag',
        'footer.tag'
      ]
    }
  },
  service: {
    pathPatterm: /^\/service\//,
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
    // ==== resource ====

    { // SEO files.
      path: /\/(favicon\.ico|robots\.txt)/,
      type: 'resource',
      location: '../WEB/www'
    },
    { // Riot component tag.
      path: /(login|about|header|footer|late-img|messages|admin)\.tag$/,
      type: 'resource',
      location: './component'
    },
    { // Riot page tag.
      path: /(blogs|text|image-page|images-page|zft-page|p500|p404)\.tag$/,
      type: 'resource',
      location: './page'
    },
    { // resource: Js, CSS, old Riot tag.
      path: /\.(css|js|tag)$/,
      type: 'resource',
      location: STTC_PTH
    },
    {
      path: /^\/feed.xml$/,
      type: 'resource',
      location: '../DAT'
    },

    // ====

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
