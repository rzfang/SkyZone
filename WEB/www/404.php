<?
header('Content-Type: text/html; charset=utf-8');

require '../global.php';
?>
<!DOCTYPE HTML>
<html>
  <head>
    <? PartView('meta'); ?>
  </head>
  <body id='HTTPCdPg'>
    <div id='Template'></div>
    <div id='Base'>
      <header id='Head'>
        <? PartView('navigation'); ?>
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
        <? PartView('footer'); ?>
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