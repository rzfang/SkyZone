const Svc = require('./service');

module.exports = {
  port: 9004,
  riot: {
    componentPath: '../WEB/www/resource'
  },
  resources: {
    path: '../WEB/www/resource',
    fileMask: /[^/]+\.(js|css|txt|xml)$/
  },
  service: {
    urlPattern: /^\/service\/(.+)/, // if regular expression can not match a case, the default case will be used.
    cases: {
      'blog/list': Svc.BlogList,
      'comment/list': Svc.CommentList,
      'message/chainlist': Svc.MessageChainList,
      'message/list': Svc.MessageList,
      'tag/list': Svc.TagList,
      'words/nowone': Svc.WordsNowOneGet
    },
    default: Svc.DefaultCall
  },
  pages: {
    // '/read': {
    //   title: 'Feed Read - Web Tool',
    //   keywords: '閱讀器, RSS, Atom, 網頁, 工具, Web, Tool',
    //   js: [
    //     'https://cdn.jsdelivr.net/npm/riot@3.6/riot+compiler.min.js',
    //     '/include.js',
    //     '/read.tag',
    //     '/coverbox.tag' ],
    //   body: [
    //     'header.tag',
    //     require('./component/read'),
    //     'footer.part.html' ]},
    '/window': {
      title: 'Window Open Script - Web Tool',
      keywords: '開新視窗, window.open, 網頁, 工具, 程式, 開發, Web, Tool, Program, Develop',
      body: [
        'header.tag',
        'window.part.html',
        'footer.part.html' ]},
    default: { // here should handle 404.
      title: 'Web Tool',
      description: '網頁工具。tools for life easier.',
      keywords: '網頁, 工具, Web, Tool',
      author: 'RZ Fang',
      favicon: '',
      css: [ '/css.css' ],
      js: [
        'https://cdn.jsdelivr.net/npm/riot@3.6/riot+compiler.min.js',
        '/include.js' ],
      body: [
        'header.tag',
        'keycode.part.html',
        'footer.part.html' ]}}
}
