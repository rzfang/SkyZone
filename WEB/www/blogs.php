<?php
header('Content-Type: text/html; charset=utf-8');

require('../global.php');
require(WEB_PTH . 'pdo_db.php');
require(WEB_PTH . 'api.php');

$PckTg = ''; // 'PckTg' = Picked Tag.
$Tgs = array(); // '$Tgs' = Tags.
$Cnt = 0; // '$Cnt' = Count.
$Blogs = array();

if (!empty($_GET['t']) && is_string($_GET['t']))
{ $PckTg = $_GET['t']; }

if (Db::Db0Connect() === 0)
{
  $Tgs = Tag::TagList();
  $Cnt = Blog::BlogList(array('Cnt', 'TgIDA' => array($PckTg)));
  $Blogs = Blog::BlogList(array('Lmt' => 10, 'TgIDA' => array($PckTg)));
}
?>
<!DOCTYPE HTML>
<html>
  <head>
    <? require(WEB_PTH . 'meta.php'); ?>
  </head>
  <body id='BlogsPage'>
    <div id='Template'>
      <?
        $Blog = <<<Blog
  <div class='Blog'>
    <div>
      <i class='icon ?1?'></i>
      <a href='blog.php?b=?2?'>?3?</a>
    </div>
    <div>?4?</div>
    <div>?5?</div>
    <div>?6?</div>
  </div>
Blog;

        echo $Blog;
      ?>
    </div>
    <div id='Base'>
      <header id='Head'>
        <? require(WEB_PTH . 'header.php'); ?>
      </header>
      <main id='Main'>
        <div id='FctnBx'>
          <div id='TgBx'>
            分類標籤：
            <?
              foreach ($Tgs as $V)
              {
                if ($V['ID'] === $PckTg)
                  echo "<span>{$V['Nm']}</span>\n";
                else
                  echo "<a href='blogs.php?t={$V['ID']}'>{$V['Nm']}</a>\n";
              }

              if (!empty($PckTg))
                echo "<a href='blogs.php'>取消</a>\n";
            ?>
          </div>
        </div>

        <div id='BlogBx'>
          <?
            $TpClsMp = array('image' => 'icon-image', 'images' => 'icon-images', 'text' => 'icon-text', 'book' => 'icon-book');

            foreach ($Blogs as $V)
            {
              $Tgs = '';
              $TA = array(); // '$TA' = Temp Array.

              foreach ($V['Tg'] as $V1)
              { $Tgs .= "<span>{$V1['Nm']}</span>"; }
              
              $TA = array($TpClsMp[$V['Tp']], $V['ID'], $V['Ttl'], $V['Smry'], $Tgs, $V['Dt']);

              echo SymbolString($Blog, $TA);
            }
          ?>
        </div>
      </main>
      <footer id='Tail'>
        <? require(WEB_PTH . 'footer.php'); ?>
        <script type='text/javascript'>
        <!--
          $(function ()
            {
            });
        -->
        </script>
      </footer>
    </div>
  </body>
</html>