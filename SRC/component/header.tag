<header>
  <nav>
    <a href='/about'>關於</a>
    <a href='/blogs'>網誌</a>
    <a href='/messages.php'>留言</a>
    <a href='/feed.xml'>訂閱</a>
    <a href='/index.php'>回入口</a>
  </nav>
  <style scoped>
    :scope { line-height: 2rem; background-color: #f0f0f0; }
    :scope a.Crnt { font-size: 1.2rem; color: #202020; };
    :scope a.Crnt:hover { text-decoration: none; cursor: default; }
  </style>
  <script>
    this.on(
      'mount',
      () => {
        let Anchr = this.root.querySelector(`a[href='${window.location.pathname}']`);

        if (Anchr) { Anchr.className = 'Crnt'; }
      });
  </script>
</header>
