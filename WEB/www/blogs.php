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
    <div id='Template'>
      <div id='Blg' class='Blg'>
        <div>
          <i class='icon'></i>
          <a href=''></a>
        </div>
        <pre></pre>
        <div></div>
        <div class='Dt'></div>
      </div>
    </div>
    <div id='Base'>
      <header id='Head'>
        <? PartView('navigation'); ?>
      </header>
      <main id='Main'>
        <? PartView('tags', array('Tgs' => Tag::TagList(), 'PckIDs' => $PckTgs)); ?>
        <bloglist></bloglist>
      </main>
      <footer id='Tail'>
        <? PartView('footer'); ?>
        <script type='riot/tag' src='resource/bloglist.tag'></script>
        <script>
          riot.mixin('Z.RM', Z.RM);
          riot.mount('icon-tags');
          riot.mount('bloglist', { TgIDA: <?= json_encode($PckTgs); ?> });
        </script>
      </footer>
    </div>
  </body>
</html>