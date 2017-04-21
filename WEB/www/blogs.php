<?
header('Content-Type: text/html; charset=utf-8');

require '../global.php';
require WEB_PTH . 'pdo_db.php';
require WEB_PTH . 'api.php';

$PckTgs = array(); // 'PckTgs' = Picked Tag IDs.

if (Db::Db0Connect() < 0)
{ return header('Location: 500.php'); }

if (!empty($_GET['t']) && is_string($_GET['t']))
{ $PckTgs[] = $_GET['t']; }
?>
<!DOCTYPE HTML>
<html>
  <head>
    <? PartView('meta', array('Ttl' => '網誌')); ?>
  </head>
  <body id='BlgsPg'>
    <div id='Base'>
      <header id='Head'>
        <? PartView('navigation'); ?>
      </header>
      <main id='Main'>
        <tags></tags>
        <bloglist></bloglist>
      </main>
      <footer id='Tail'>
        <? PartView('footer'); ?>
        <script type='riot/tag' src='resource/tags.tag'></script>
        <script type='riot/tag' src='resource/bloglist.tag'></script>
        <script>
          riot.mixin('Z.RM', Z.RM);
          riot.mount('icon');
          riot.mount('tags', <?= json_encode(array('tgs' => Tag::TagList(), 'pckids' => $PckTgs)) ?>);
          riot.mount('bloglist', { TgIDA: <?= json_encode($PckTgs); ?> });
        </script>
      </footer>
    </div>
  </body>
</html>