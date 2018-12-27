const Kwd = require('./keyword.json'),
      Svc = require('./service');

const AdminPage = require('./page/admin'),
      Img = require('./image');

const DftPgRt = { // here should handle 404.
  title: '空域',
  description: '我的天空，我在其中，在我這裡，自由放空。RZ 的個人網站。',
  keywords: '天空, 空域, RZ, 個人網站',
  author: 'RZ Fang',
  favicon: 'favicon.ico',
  css: [ 'base.css', 'style2.css' ],
  js: [
    'https://cdn.jsdelivr.net/npm/riot@3.12/riot+compiler.min.js',
    'api2.min.js'
  ],
  body: []
};

module.exports = {
  port: 9004,
  keyword: Kwd.RM,
  page: {
    '/admin': {
      title: '空域 - 管理員',
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.12/riot+compiler.min.js',
        'api2.min.js',
        'tabbox.tag'
      ],
      body: [
        { type: 'riot', component: '../WEB/www/resource/admin.tag', initialize: AdminPage }]},
    '/about': {
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.12/riot+compiler.min.js',
        'api2.min.js',
        'tabbox.tag'
      ],
      body: [
        'header.tag',
        'about.tag',
        'footer.tag'
      ]
    },
    '/blogs': {
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.12/riot+compiler.min.js',
        'api2.min.js',
        'icon.tag',
        'tags.tag'
      ],
      body: [
        'header.tag',
        'blogs.tag',
        'footer.tag'
      ]
    },
    '/text': {
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.12/riot+compiler.min.js',
        'api2.min.js',
        'icon.tag',
        'sharebox.tag',
        'tags.tag'
      ],
      body: [
        'header.tag',
        'text.tag',
        'footer.tag'
      ]
    },
    '/image': {
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.12/riot+compiler.min.js',
        'api2.min.js',
        'icon.tag',
        'sharebox.tag',
        'tags.tag'
      ],
      body: [
        'header.tag',
        'image-page.tag',
        'footer.tag'
      ]
    },
    '/images': {
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.12/riot+compiler.min.js',
        'api2.min.js',
        'icon.tag',
        'late-img.tag',
        'sharebox.tag',
        'tags.tag'
      ],
      body: [
        'header.tag',
        'images-page.tag',
        'footer.tag'
      ]
    },
    default: { // here should handle 404.
      title: '空域',
      description: '我的天空，我在其中，在我這裡，自由放空。RZ 的個人網站。',
      keywords: '天空, 空域, RZ, 個人網站',
      author: 'RZ Fang',
      favicon: 'favicon.ico',
      css: [ 'base.css', 'style2.css' ],
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.12/riot+compiler.min.js',
        'api2.min.js'
      ],
      body: []
    }
  },
  route: [
    // ==== resource ====

    { // Riot component tag.
      path: /(login|about|header|footer|late-img)\.tag$/,
      type: 'resource',
      mimeType: 'text/plain',
      location: './component'
    },
    { // Riot page tag.
      path: /(blogs|text|image-page|images-page)\.tag$/,
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

    // ==== dynamic resource. ====

    {
      path: /^\/resource\/image\/.+/,
      type: 'process',
      process: Img.CachedFileRespond
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
    }

    // ==== page ====

  ]
}
