const Kwd = require('./keyword.json'),
      Svc = require('./service');

const AdminPage = require('./page/admin'),
      Img = require('./image');

const JQUERY_CDN = 'https://code.jquery.com/jquery-3.4.1.min.js';

const DftPgRt = { // here should handle 404.
  title: '空域',
  description: '我的天空，我在其中，在我這裡，自由放空。RZ 的個人網站。',
  keywords: '天空, 空域, RZ, 個人網站',
  author: 'RZ Fang',
  favicon: 'favicon.ico',
  feed: '/feed.xml',
  css: [ 'base.css', 'style2.css' ],
  js: [ 'api2.min.js' ],
  body: [ 'header.tag', 'p404.tag', 'footer.tag' ]
};

module.exports = {
  port: 9004,
  keyword: Kwd.RM,
  cdn: {
    riot: 'https://cdn.jsdelivr.net/npm/riot@3.13/riot+compiler.min.js'
  },
  page: {
    '/admin': {
      ...DftPgRt,
      title: '空域 - 管理員',
      js: [ 'api2.min.js', 'tabbox.tag' ],
      body: [
        { type: 'riot', component: './component/admin.tag', initialize: AdminPage }
      ]},
    '/about': {
      ...DftPgRt,
      js: [ 'api2.min.js', 'tabbox.tag' ],
      body: [ 'header.tag', 'about.tag', 'footer.tag' ]
    },
    '/blogs': {
      ...DftPgRt,
      js: [ 'api2.min.js', 'icon.tag', 'tags.tag' ],
      body: [ 'header.tag', 'blogs.tag', 'footer.tag' ]
    },
    '/text': {
      ...DftPgRt,
      js: [ 'api2.min.js', 'icon.tag', 'sharebox.tag', 'tags.tag' ],
      body: [
        'header.tag',
        'text.tag',
        'footer.tag'
      ]
    },
    '/image': {
      ...DftPgRt,
      js: [ 'api2.min.js', 'icon.tag', 'sharebox.tag', 'tags.tag' ],
      body: [ 'header.tag', 'image-page.tag', 'footer.tag' ]
    },
    '/images': {
      ...DftPgRt,
      js: [ 'api2.min.js', 'icon.tag', 'late-img.tag', 'sharebox.tag', 'tags.tag' ],
      body: [ 'header.tag', 'images-page.tag', 'footer.tag' ]
    },
    '/zft': {
      ...DftPgRt,
      js: [ 'api2.min.js', 'icon.tag', 'sharebox.tag', 'tags.tag' ],
      body: [ 'header.tag', 'zft-page.tag', 'footer.tag' ]
    },
    '/messages': {
      ...DftPgRt,
      js: [ 'api2.min.js' ],
      body: [ 'header.tag', 'messages.tag', 'footer.tag' ]
    },
    '/zone': {
      ...DftPgRt,
      css: [ 'base.css', 'style1.css' ],
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
      mimeType: 'image/x-icon',
      location: '../WEB/www'
    },
    { // Riot component tag.
      path: /(login|about|header|footer|late-img|messages|admin)\.tag$/,
      type: 'resource',
      mimeType: 'text/plain',
      location: './component'
    },
    { // Riot page tag.
      path: /(blogs|text|image-page|images-page|zft-page|p500|p404)\.tag$/,
      type: 'resource',
      mimeType: 'text/plain',
      location: './page'
    },
    { // CSS resource.
      path: /\.css$/,
      type: 'resource',
      mimeType: 'text/css',
      location: '../WEB/www/resource'
    },
    { // Js resource.
      path: /\.js$/,
      type: 'resource',
      mimeType: 'application/javascript',
      location: '../WEB/www/resource'
    },
    { // old Riot tag.
      path: /\.tag$/,
      type: 'resource',
      mimeType: 'text/plain',
      location: '../WEB/www/resource'
    },
    {
      path: /^\/feed.xml$/,
      type: 'resource',
      mimeType: 'application/xml',
      location: '../DAT'
    },

    // ==== dynamic image resource. ====

    {
      path: /^\/resource\/image\/.+/,
      type: 'process',
      process: Img.CachedFileRespond
    },

    // ==== static image resource. ====

    {
      path: /^\/image\/.+/,
      type: 'process',
      process: Img.StaticFileRespond
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
