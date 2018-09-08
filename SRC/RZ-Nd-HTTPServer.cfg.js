const Kwd = require('./keyword.json'),
      Svc = require('./service');

const AdminPage = require('./page/admin');

module.exports = {
  port: 9004,
  keyword: Kwd.RM,
  resource: {
    mimeTypeMap: {
      css: 'text/css',
      html: 'text/html',
      js: 'application/javascript',
      tag: 'text/plain',
      txt: 'text/plain',
      xml: 'text/xml' },
    locationMap: [
      {
        pattern: /login.tag$/,
        location: './component'
      },
      {
        pattern: /\.(js|css|tag)$/,
        location: '../WEB/www/resource'
      }
    ]
  },
  service: {
    urlPattern: /^\/service\/(.+)/, // if regular expression can not match a case, the default case will be used.
    cases: {
      'blog/list': Svc.BlogList,
      'blog/list/admin': Svc.BlogAdminList,
      'blog/unpublished': Svc.BlogUnpublishedList,
      'comment/list': Svc.CommentList,
      'feed/publish': Svc.FeedPublish,
      'message/chainlist': Svc.MessageChainList,
      'message/list': Svc.MessageList,
      'session/login': Svc.SessionLogIn,
      'session/logout': Svc.SessionLogOut,
      'tag/add': Svc.TagAdd,
      'tag/list': Svc.TagList,
      'tag/rename': Svc.TagRename,
      'tag/delete': Svc.TagDelete,
      'words/nowone': Svc.WordsNowOneGet },
    default: Svc.DefaultCall },
  page: {
    '/admin': {
      title: '空域 - 管理員',
      keywords: '開新視窗, window.open, 網頁, 工具, 程式, 開發, Web, Tool, Program, Develop',
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.10/riot+compiler.min.js',
        'api2.min.js',
        'tabbox.tag'
      ],
      body: [
        { type: 'riot', component: '../WEB/www/resource/admin.tag', initialize: AdminPage }]},
    default: { // here should handle 404.
      title: '空域',
      description: '我的天空，我在其中，在我這裡，自由放空。RZ 的個人網站。',
      keywords: '天空, 空域, RZ, 個人網站',
      author: 'RZ Fang',
      favicon: 'favicon.ico',
      css: [ 'base.css' ],
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.10/riot+compiler.min.js',
        'api2.min.js'
      ],
      body: []}}}
