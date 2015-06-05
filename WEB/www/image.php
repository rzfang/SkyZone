<?php
header('Content-Type: text/html; charset=utf-8');

require('../global.php');
require(WEB_PTH . 'pdo_db.php');
require(WEB_PTH . 'api.php');
require(WEB_PTH . 'resource/Tar.php');

$ID = $_GET['b'] ? $_GET['b'] : '';

if (!$ID)
{ return header('Location: 404.php'); }

if (Db::Db0Connect() < 0)
{ return header('Location: 500.php'); }

$Blog = Blog::OneRead(array('ID' => $ID));

if (empty($Blog))
{ return header('location: 500.php'); }
?>
<!DOCTYPE HTML>
<html>
  <head>
    <?
      $VwData = array('Ttl' => $Blog['Ttl'], 'Smry' => $Blog['Smry'], 'URL' => $Blog['URL'],
                      'ImgURL' => WEBSITE_URL . $Blog['Info']['ImgURL']);

      require(VW_PTH . 'meta.php');
    ?>
  </head>
  <body id='ImgPg'>
    <div id='Template'></div>
    <div id='Base'>
      <header id='Head'>
        <? require(VW_PTH . 'navigation.php'); ?>
      </header>
      <main id='Main'>
        <h1><?= $Blog['Ttl']; ?></h1>
        <div id='InfoBx'>
          <?
            $VwData = array('Tgs' => $Blog['TgA']);

            require(VW_PTH . 'tags.php');
          ?>
          <div>
            <i class='icon icon-calendar' title='發佈時間'></i>
            <?= $Blog['Dt']; ?>
          </div>
        </div>
        <div id='ImgBx'>
          <img src='<?= $Blog['Info']['ImgURL']; ?>' />
          <div>
            <pre><?= $Blog['Info']['Str']; ?></pre>
          </div>
        </div>
        <?
          $VwData = array('URL' => $Blog['URL']);

          require(VW_PTH . 'share.php');
        ?>
        <div id='ExtBx'>
          <a id='ToTop' href='javascript:void(0);'>回到頂端</a>
        </div>
      </main>
      <footer id='Tail'>
        <? require(VW_PTH . 'footer.php'); ?>
        <script type='text/javascript'>
        <!--
          $(function ()
            {
              $('#ToTop').on('click', function (Evt) { window.scrollTo(0, 0); });
              $('#ImgBx').on('click', function (Evt) { $(this).children('pre').fadeToggle(300); });
            });
        -->
        </script>
      </footer>
    </div>
  </body>
</html>