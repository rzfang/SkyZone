<nav>
  <? if (basename($_SERVER['PHP_SELF']) !== 'about.php') { ?><a href='about.php'>關於</a><? } else { ?><span>關於</span><? } ?>
  <? if (basename($_SERVER['PHP_SELF']) !== 'blogs.php') { ?><a href='blogs.php'>網誌</a><? } else { ?><span>網誌</span><? } ?>
  <? if (basename($_SERVER['PHP_SELF']) !== 'messages.php') { ?><a href='messages.php'>留言</a><? } else { ?><span>留言</span><? } ?>
  <a href='feed.php'>訂閱</a>
  <a href='index.php'>回入口</a>
</nav>