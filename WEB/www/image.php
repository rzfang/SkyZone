<?
header('Content-Type: text/html; charset=utf-8');

require '../global.php';
require RSC_PTH . 'vendor/autoload.php';
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
    <?
      PartView(
        'meta',
        array(
          'Ttl' => $Blog['Ttl'], 'Smry' => $Blog['Smry'], 'URL' => $Blog['URL'],
          'ImgURL' => WEBSITE_URL . $Blog['Info']['ImgURL']));
    ?>
  </head>
  <body id='ImgPg'>
    <div id='Template'></div>
    <div id='Base'>
      <header id='Head'>
        <? PartView('navigation'); ?>
      </header>
      <main id='Main'>
        <h1><?= $Blog['Ttl']; ?></h1>
        <div id='InfoBx'>
          <tags></tags>
          <div>
            <icon title='發佈時間' nm='calendar'></icon>
            <?= $Blog['Dt']; ?>
          </div>
        </div>
        <div id='ImgBx'>
          <img src='<?= $Blog['Info']['ImgURL']; ?>' />
          <div>
            <pre><?= $Blog['Info']['Str']; ?></pre>
          </div>
        </div>
        <share-box ecdurl='<?= urlencode($Blog['URL']); ?>'></share-box>
        <div id='ExtBx'>
          <a id='ToTop' href='javascript:void(0);'>回到頂端</a>
        </div>
      </main>
      <footer id='Tail'>
        <? PartView('footer'); ?>
        <script type='riot/tag' src='resource/tags.tag'></script>
        <script type='riot/tag' src='resource/sharebox.tag'></script>
        <script type='text/javascript'>
          riot.mount('icon');
          riot.mount('tags', { tgs: <?= json_encode($Blog['TgA']); ?> });
          riot.mount('share-box');

          $(function ()
            {
              $('#ToTop').on('click', function (Evt) { window.scrollTo(0, 0); });
              $('#ImgBx').on('click', function (Evt) { $(this).children('pre').fadeToggle(300); });
            });
        </script>
      </footer>
    </div>
  </body>
</html>