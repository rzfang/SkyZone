<?php
header('Content-Type: text/html; charset=utf-8');

require('../global.php');
require(WEB_PTH . 'pdo_db.php');
require(WEB_PTH . 'api.php');
require(WEB_PTH . 'resource/Tar.php');

$BlogID = '';
$Blog = array();

if (isset($_GET['Blog']) && IsUUID($_GET['Blog'], true))
{
  Db::Db0Connect();

  $Blog = Blog::InfoCollect(array('ID' => $_GET['Blog']));
  $BlogID = $Blog['ID'];
}
?>
<!DOCTYPE HTML>
<html>
  <head>
    <title><?= WEBSITE; ?></title>
    <meta http-equiv='content-type' content='text/html; charset=utf-8'/>
    <meta name='description' content='RZ 的個人網站。我的天空，我在其中，在我這裡，自由放空。'/>
    <meta name='keywords' content='空域, RZ, 個人網站'/>
    <meta name='author' content='RZ Fang'/>
<?php if (empty($Blog)) { ?>
    <meta property='og:title' content='<?= WEBSITE; ?>'/>
    <meta property='og:description' content='RZ 的個人網站。我的天空，我在其中，在我這裡，自由放空。'/>
    <meta property='og:url' content='<?= WEBSITE_URL; ?>'/>
    <meta property='og:type' content='website'/>
    <meta property='og:image' content='<?= WEBSITE_URL; ?>image/logo.jpg'/>
    <meta name='twitter:title' content='<?= WEBSITE; ?>'/>
    <meta name='twitter:description' content='RZ 的個人網站。我的天空，我在其中，在我這裡，自由放空。'/>
    <meta name='twitter:url' content='<?= WEBSITE_URL; ?>'/>
    <meta name='twitter:card' content='summary'/>
    <meta name='twitter:image' content='<?= WEBSITE_URL; ?>image/logo.jpg'/>
<?php } else { ?>
    <meta property='og:title' content='<?= $Blog['Ttl']; ?>'/>
    <meta property='og:description' content='<?= $Blog['Smry']; ?>'/>
    <meta property='og:url' content='<?= WEBSITE_URL; ?>zone.php?Blog=<?= $Blog['ID']; ?>'/>
    <meta property='og:type' content='article'/>
    <meta property='og:image' content='<?= WEBSITE_URL . $Blog['TbnURL']; ?>'/>
    <meta name='twitter:title' content='<?= $Blog['Ttl']; ?>'/>
    <meta name='twitter:description' content='<?= $Blog['Smry']; ?>'/>
    <meta name='twitter:url' content='<?= WEBSITE_URL; ?>zone.php?Blog=<?= $Blog['ID']; ?>'/>
    <meta name='twitter:card' content='summary'/>
    <meta name='twitter:image' content='<?= WEBSITE_URL . $Blog['TbnURL']; ?>'/>
<?php } ?>
    <link rel='icon' href='/favicon.ico' type='image/ico'/>
    <link rel='alternate' type='application/atom+xml' title='atom' href='feed.php'/>
    <link rel='stylesheet' type='text/css' href='resource/base.css'/>
    <link rel='stylesheet' type='text/css' href='resource/style1.css'/>
    <style type='text/css'>
    <!--
      div.AbtPg { padding: 5px; word-wrap:break-word; white-space: pre-line; }

      #Head > a { text-decoration: none; }

      #GdWdsChk, #AtCnrChk { position: absolute; bottom: 0px; padding: 5px; border-radius: 5px 0px 0px 0px;
                             color: rgba(0, 0, 0, 0.5); background: rgba(255, 255, 255, 0.5);}

      #GdWdsChk { left: 0px; }
      #GdWds { z-index: -1; position: absolute; left: 0px; bottom: 0px; width: 640px; height: 480px; }

      #AtCnrChk { right: 0px; }
      #AtCnr { z-index: -1; position: absolute; right: 0px; bottom: 0px; width: 800px; height: 600px;
               background-position: bottom right; background-repeat: no-repeat; }
      #AtCnr > pre.Block { display: none; position: absolute; right: 30px; bottom: 30px; max-width: 200px;
                           padding: 5px; border-radius: 5px; font-size: 14px; background: rgba(255, 255, 255, 0.7); }
    -->
    </style>
    <script type='text/javascript' src='resource/jquery.min.js'></script>
    <script type='text/javascript' src='resource/include.min.js'></script>
    <script type='text/javascript' src='resource/api.min.js'></script>
    <script type='text/javascript'>
    <!--
      EmbedDeny();

      var CO = null; // 'CO' = Cookie Object.

      $(function()
        {
          Button0('.Btn0');
          GoodWordsSet();
          ArtCornerSet();

          $('#Main').height($(document).height() - $('#Head').height() - $('#Tail').height());

          $(window).resize(function(Evt)
            {
              $('#Main').height($(Evt.currentTarget).height() - $('#Head').height() - $('#Tail').height());
            });

          CO = CookieParam();
          CO.LfTm = <?= COOKIE_LIFE; ?>;

<?php if (strlen($BlogID) > 0){ ?>
          BlogOneFrame('<?= $BlogID; ?>');
<?php } ?>
        });
    -->
    </script>
  </head>
  <body>
    <div id='Template'> <!-- Template -->
      <div id='LvBx' class='LvBx' style='text-align: center;'>
        <span class='TextTitle'>暱稱</span>
        <input type='text' class='Nm' placeholder='請輸入大名。' style='width: 250px;'/><br/>
        <span class='TextTitle'>E-Mail</span>
        <input type='text' class='Ml' placeholder='請輸入 E-Mail。(不會公開)' style='width: 250px;'/><br/>
        <span class='TextTitle'>留言</span>
        <textarea class='Msg' placeholder='請輸入訊息。' style='width: 250px; height: 70px; vertical-align: middle;'></textarea><br/>
        <label style='vertical-align: middle;' title='記住我的暱稱'>記住我<input type='checkbox' class='RmbMe' tabindex='-1'/></label>
        <input type='button' class='Btn0' style='margin-left: 20px; vertical-align: middle;' value='新留言'/>
      </div>
      <div>
      	<div style='text-align: right;'>
          一頁 <input type='text' id='MxLmt' maxlength='2' value='5' autocomplete='off' placeholder='數字' style='width: 30px; text-align: center;'/> 筆
          <input type='button' id='RldMsgLstBtn' class='Btn0' value='更新列表'/>
          <input type='button' id='NewMsgBtn' class='Btn0' value='新留言'/>
        </div>
      	<div id='MsgLstBx'></div>
      </div>
      <div>
      	<div style='text-align: right;'>
          <input type='button' class='Btn0' value='標籤過濾'/>
          <input type='button' class='Btn0' value='隨機一篇'/>
        </div>
      	<div id='BlogLstBx'></div>
      </div>
      <div id='OneMsg' class='OneMsg OneItm'>
        <div></div>
        <pre>...</pre>
        <div></div>
        <input type='button' class='Btn0' value='0' title='接著說'/>
      </div>
      <div id='OneBlog' class='OneBlog OneItm ClickItem'>
        <div></div>
        <div></div>
        <div></div>
        <div><span></span></div>
      </div>
      <div id='OneMsgCmt' class='OneMsgCmt OneItm'>
      	<div></div>
      	<pre></pre>
      	<div></div>
      	<span></span>
      </div>
      <div id='MsgChnBx' class='MsgChnBx'>
        <div></div>
        <div style='padding-left: 20px; overflow-y: auto;'></div>
        <div style='padding: 5px 0px; text-align: center;'>
          <input type='button' class='Btn0' value='新留言'/>
        </div>
      </div>
      <div id='BlogCmtLstBx'>
        <div></div>
        <div style='margin: 20px 0px 5px 0px; text-align: center;'>
          <input type='button' class='Btn0' value='新留言'/>
        </div>
      </div>
      <div id='PswdBx' style='text-align: center;'>
        <div style='margin: 5px 0px; text-align: center;'>
          <span class='Block' style='text-align: left;'></span>
        </div>
        <input type='password' placeholder='請輸入密碼' style='margin: 5px 0px;'/><br/>
        <input type='button' class='Btn0' value='確定'/>
      </div>
      <div id='AbtBx' class='TbBx'>
        <div class='AbtPg' name='網站導覽'>
          <b>關於</b>
          一些跟 空域有關的說明會盡量集中在這裡。

          <b>網誌</b>
          RZ 不定期分享的自言自語、碎碎唸等沒營養垃圾文章。

          <b>留言板</b>
          開放給客倌隨意留言，沒什麼限制，就是請大家多注意網路禮儀哦。

          <b>內嵌網頁</b>
          如果覺得 空域一格一格的瀏覽方式深得你心，
          想用這種方式去瀏覽其它空域以外的網頁，可以用這個方式把別人的網頁拉進來。

          <b>訂閱</b>
          想要隨時知道 RZ 是不是又在網誌上的發佈了垃圾文章，
          就用這個 RSS/Atom 訂閱 空域的最新消息吧。

          <b>回入口</b>
          回到 空域的大門口。RZ 除了網誌以外，還有其它比較主題性的資訊會擺在門口。
        </div>
        <div class='AbtPg' name='關於空域'>
          空域 是 RZ(小弟本人) 一腳踏進程式與資訊圈以來，不斷學習、探索，
          終於下定決心所成立的網站。

          開始構思發想階段的時間點已不可考；
          網站的成立時間則大約是在 2011 年 6 月前後。

          一開始發想很單純，
          RZ 不太滿意各 Blog 經營業者所提供的維護方式，即模版式的介面配置。
          可能是因為 RZ 自己喜歡凡是自己動手做，又剛好懂點網頁程式，
          因此萌生了一個吃力不討好的想法：
          「既然我可以自己做，幹嘛要屈就於人家 Blog 式的管理方式。」
          於是…可以算是價值觀扭曲、過度偏執的想法，成就了 空域 的開站。

          RZ 把 空域 當成個人生活的紀錄，基本上就是 Blog，
          但希望能跳脫制式 Blog 的版面框架；
          同時 RZ 也把 空域 當作在網頁程式精進的管道，
          在這裡，客倌無須拘慬，無論您是偶然經過，或是在此流連，
          若 空域 帶給您一些想法、一些啟發，不妨在 空域 留下您的心得。

          網海茫茫，人與人的際會如此奇妙…

          我的天空，我在其中，在我這裡，自由放空。 RZ 的個人網站。

          20120401 by RZ
        </div>
        <div class='AbtPg' name='關於我'>
          小弟本名 方元利，在成長的不同時期有不同的暱稱，基本上都跟名字發音有關，
          阿利、Lee、小方、RZ (目前較常使用) 等，
          RZ 不在乎客倌如何稱呼 RZ，名字不重要，重要的是所代表的人。

          有一陣子 RZ 用「天空」作為自己在網路上的代稱，
          因為喜歡天空的開闊，天空的湛藍。
          而本站名為 空域 ，也是由此而來。

          RZ 喜歡寫寫東西、畫畫東西，發發夢想，在 空域 裡客倌會發現這些習性，
          當然 RZ 也還喜歡很多事情，但嘮嘮不休不是 RZ 的習慣，
          客倌就隨意參觀吧。

          那麼…
          客倌，您好，
          我是 RZ ，
          初次見面的，請多指教；
          朋友，又見面了，歡迎回來。

          20120401 by RZ
        </div>
      </div>
      <div id='TgLstBx'>
      	<div></div>
      	<div style='margin-top: 10px;'>
          <input type='button' class='Btn0' value='不過濾'/>
          <input type='button' class='Btn0' value='確定'/>
        </div>
      </div>
    </div>
    <div id='Base'> <!-- Base -->
      <header id='Head'> <!-- Head -->
        <div>
        	<button class='Btn0' title='關於' onclick='AboutFrame("關於");'>關於</button>
        	<button class='Btn0' title='網誌' onclick='BlogListFrame("網誌列表");'>網誌</button>
        	<button class='Btn0' title='留言板' onclick='MessageListFrame("留言列表");'>留言板</button>
        	<button class='Btn0' title='技術筆記' onclick='TutorialListFrame("技術筆記列表");'>技術筆記</button>
        	<button class='Btn0' title='內嵌網頁' onclick='CustomFrame("輸入網址");'>內嵌網頁</button>
        	<a href='feed.php'><button class='Btn0' title='訂閱'>訂閱</button></a>
        	<a href='index.php'><button class='Btn0' title='回入口'>回入口</button></a>
        </div>
      </header>
      <div id='Main'> <!-- Main -->
        <div id='AtCnr'>
          <pre class='Block'></pre>
        </div>
        <canvas id='GdWds'></canvas>
        <span id='AtCnrChk' class='Block'>角落藝廊</span>
        <span id='GdWdsChk'>佳言錄</span>
      </div>
      <footer id='Tail'> <!-- Tail -->
        <?= $Kw['Hnt']['TailHint'] . ' ' . $Kw['Hnt']['Copyright']; ?>
      </footer>
    </div>
  </body>
</html>
