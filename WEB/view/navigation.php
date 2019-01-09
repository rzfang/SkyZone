<nav>
  <? if (basename($_SERVER['PHP_SELF']) !== 'about') { ?><a href='/about'>關於</a><? } else { ?><span>關於</span><? } ?>
  <? if (basename($_SERVER['PHP_SELF']) !== 'blogs') { ?><a href='/blogs'>網誌</a><? } else { ?><span>網誌</span><? } ?>
  <? if (basename($_SERVER['PHP_SELF']) !== 'messages') { ?><a href='/messages'>留言</a><? } else { ?><span>留言</span><? } ?>
  <a href='/feed.xml'>訂閱</a>
  <a href='index.php'>回入口</a>
</nav>