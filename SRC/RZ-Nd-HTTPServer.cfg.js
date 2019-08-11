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
    { // SSL For Free.
      path: /^\/\.well-known\/acme-challenge/,
      type: 'resource',
      location: STTC_PTH
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
    },

    // ==== service ====

    { // blog admin style list service.
      path: /^\/service\/blog\/list\/admin/,
      type: 'service',
      process: Svc.BlogAdminList
    },
    { // blog unpublished list service.
      path: /^\/service\/blog\/unpublished/,
      type: 'service',
      process: Svc.BlogUnpublishedList
    },
    { // blog list service.
      path: /^\/service\/blog\/list/,
      type: 'service',
      process: Svc.BlogList
    },
    { // blog update service.
      path: /^\/service\/blog\/update/,
      type: 'service',
      process: Svc.BlogUpdate
    },
    { // blog upload service.
      path: /^\/service\/blog\/upload/,
      type: 'service',
      process: Svc.BlogUpload
    },
    { // blog create service.
      path: /^\/service\/blog\/create/,
      type: 'service',
      process: Svc.BlogCreate
    },
    { // blog delete service.
      path: /^\/service\/blog\/delete/,
      type: 'service',
      process: Svc.BlogDelete
    },
    { // blog list service.
      path: /^\/service\/blog\/commentlist/,
      type: 'service',
      process: Svc.BlogCommentList
    },
    { // blog leave service.
      path: /^\/service\/blog\/commentleave/,
      type: 'service',
      process: Svc.BlogCommentLeave
    },
    { // blog delete service.
      path: /^\/service\/blog\/commentdelete/,
      type: 'service',
      process: Svc.BlogCommentDelete
    },
    { // blog service.
      path: /^\/service\/blog/,
      type: 'service',
      process: Svc.BlogRead
    },
    { // comment list service.
      path: /^\/service\/comment\/list/,
      type: 'service',
      process: Svc.CommentList
    },
    { // feed publish service.
      path: /^\/service\/feed\/publish/,
      type: 'service',
      process: Svc.FeedPublish
    },
    { // feed publish service.
      path: /^\/service\/feed\/publish/,
      type: 'service',
      process: Svc.FeedPublish
    },
    { // message chain list service.
      path: /^\/service\/message\/chainlist/,
      type: 'service',
      process: Svc.MessageChainList
    },
    { // message list service.
      path: /^\/service\/message\/list/,
      type: 'service',
      process: Svc.MessageList
    },
    {
      path: /^\/service\/message\/leave/,
      type: 'service',
      process: Svc.MessageLeave
    },
    { // message admin list service.
      path: /^\/service\/message\/adminlist/,
      type: 'service',
      process: Svc.MessageAdminList
    },
    { // message admin list service.
      path: /^\/service\/message\/delete/,
      type: 'service',
      process: Svc.MessageDelete
    },
    { // session login service.
      path: /^\/service\/session\/login/,
      type: 'service',
      process: Svc.SessionLogIn
    },
    { // session logout service.
      path: /^\/service\/session\/logout/,
      type: 'service',
      process: Svc.SessionLogOut
    },
    { // blog tag add service.
      path: /^\/service\/tag\/add/,
      type: 'service',
      process: Svc.TagAdd
    },
    { // blog tag list service.
      path: /^\/service\/tag\/list/,
      type: 'service',
      process: Svc.TagList
    },
    { // blog tag rename service.
      path: /^\/service\/tag\/rename/,
      type: 'service',
      process: Svc.TagRename
    },
    { // blog tag delete service.
      path: /^\/service\/tag\/delete/,
      type: 'service',
      process: Svc.TagDelete
    },
    { // words now get one service.
      path: /^\/service\/words\/nowone/,
      type: 'service',
      process: Svc.WordsNowOneGet
    },
    { // words list service.
      path: /^\/service\/words\/list/,
      type: 'service',
      process: Svc.WordsList
    },
    { // words create service.
      path: /^\/service\/words\/create/,
      type: 'service',
      process: Svc.WordsCreate
    },
    { // words update service.
      path: /^\/service\/words\/update/,
      type: 'service',
      process: Svc.WordsUpdate
    },
    { // words update service.
      path: /^\/service\/words\/delete/,
      type: 'service',
      process: Svc.WordsDelete
    },
    {
      path: /^\/service\/artcorner\/randomone/,
      type: 'service',
      process: Svc.ArtCornerRandomOneGet
    },
    { // cache clean service.
      path: /^\/service\/cache\/clean/,
      type: 'service',
      process: Svc.SystemCacheClean
    },
    { // data size service.
      path: /^\/service\/data\/size/,
      type: 'service',
      process: Svc.SystemDataSize
    }

    // ==== page ====

  ]
}
