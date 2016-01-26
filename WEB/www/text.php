<?
header('Content-Type: text/html; charset=utf-8');

require '../global.php';
require WEB_PTH . 'pdo_db.php';
require WEB_PTH . 'api.php';

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
    <? PartView('meta', $VwData = array('Ttl' => $Blog['Ttl'], 'Smry' => $Blog['Smry'], 'URL' => $Blog['URL'])); ?>
  </head>
  <body id='TxtPg'>
    <div id='Template'></div>
    <div id='Base'>
      <header id='Head'>
        <? PartView('navigation'); ?>
      </header>
      <main id='Main'>
        <h1><?= $Blog['Ttl']; ?></h1>
        <div id='InfoBx'>
          <? PartView('tags', array('Tgs' => $Blog['TgA'])); ?>
          <div>
            <i class='icon icon-calendar' title='發佈時間'></i>
            <?= $Blog['Dt']; ?>
          </div>
        </div>
        <pre><?= $Blog['Info']['Str']; ?></pre>
        <? PartView('share', array('URL' => $Blog['URL'])); ?>
        <div id='ExtBx'>
          <a id='ToTop' href='javascript:void(0);'>回到頂端</a>
        </div>
      </main>
      <footer id='Tail'>
        <? PartView('footer'); ?>
        <script type='text/javascript'>
        <!--
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