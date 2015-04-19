<?php
header('Content-Type: text/html; charset=utf-8');

require('../global.php');
// require(WEB_PTH . 'pdo_db.php');
// require(WEB_PTH . 'api.php');
?>
<!DOCTYPE HTML>
<html>
  <head>
    <? require(VW_PTH . 'meta.php'); ?>
  </head>
  <body id='HTTPCdPg'>
    <div id='Template'></div>
    <div id='Base'>
      <header id='Head'>
        <? require(VW_PTH . 'navigation.php'); ?>
      </header>
      <main id='Main'>
        <pre>
          404
          網頁不存在！
          請由上方網站導引繼續瀏覽本網站。

          謝謝
        </pre>
      </main>
      <footer id='Tail'>
        <? require(VW_PTH . 'footer.php'); ?>
        <script type='text/javascript'>
        <!--
          var BxDOM;

          $(function ()
            {
              $('#ToTop').on('click', function () { window.scrollTo(0, 0); });
            });
        -->
        </script>
      </footer>
    </div>
  </body>
</html>