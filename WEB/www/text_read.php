<?php
header('Content-Type: text/html; charset=utf-8');

require '../global.php';

if (empty($_GET['Fl']))
{
  echo '指定的文字檔不存在。';
  return -1;
}

$DirPth = DAT_PTH . 'tutorial/';
$FlLst = array_diff(scandir($DirPth), array('.', '..', 'setting.json'));
$FlPth = $DirPth . $_GET['Fl'];

if (!in_array($_GET['Fl'], $FlLst))
{
  echo '指定的文字檔不存在。';
  return -2;
}

$StN = SettingMatch($_GET['Fl'], $DirPth . 'setting.json');
$FlStr = htmlspecialchars(file_get_contents($FlPth));

/*
  Return: JSON string of setting. or '' as error. */
function SettingMatch($FlNm, $StPth)
{
  if (empty($FlNm) || !is_string($FlNm) || empty($StPth) || !is_string($StPth) || !is_file($StPth))
    return '';

  $JSON = json_decode(file_get_contents($StPth), true);

  if (empty($JSON))
  { return ''; }

  foreach ($JSON as $V0)
  {
    if (!empty($V0['FlNm']) && $V0['FlNm'] === $FlNm)
      return json_encode($V0);
  }

  return '';
}

//======================================================================================================================
?>
<!DOCTYPE HTML>
<html>
  <head>
    <title><?= WEBSITE; ?> - 純文字檔輔助閱讀器 - <?= $_GET['Fl']; ?></title>
    <meta http-equiv='content-type' content='text/html; charset=utf-8'/>
    <meta name='description' content='RZ 的個人網站。線上純文字檔案輔助閱讀器'/>
    <meta name='keywords' content='空域, RZ, 個人網站, 純文字, 閱讀器'/>
    <meta name='author' content='RZ Fang'/>
    <link rel='icon' href='/favicon.ico' type='image/ico'/>
    <style type='text/css'>
    <!--
      body { margin: 0px; font-family: monospace; }
      a { text-decoration: none; color: #000080; }
      a:hover { text-decoration: underline; color: #008080; }
      pre { margin: 0px; }
      ul { margin-bottom: 20px; padding-left: 10px; }
      h3 { margin: 0px; }

      .TtlLn { font-size: 1em; color: #000080; }
      .Lv0 { font-size: 1em; color: #000080; }
      .Lv1 { font-size: 1em; color: #000080; }

      #Head, #OptnBx { background-color: rgba(255, 255, 255, 0.8); }

      #Base { width: 1000px; margin: 0px auto; }
      #Head { z-index: 1; position: relative; top: 0px; margin: 0px; padding: 5px 0px; border-bottom: 1px solid; }
      #Head > div:first-child { font-size: 2em; text-align: center;  }
      #OptnBx { z-index: 1; display: inline-block; position: absolute; left: 1px; width: 150px; padding: 5px; vertical-align: top; border-right: 1px solid; border-bottom: 1px solid; font-style: italic; }
      #OrgTxt { display: none; }
      #IdxBx > a { display: inline-block; margin-bottom: 10px; }
      #Ctn { display: inline-block; position: relative; width: 800px; padding: 10px; border-left: 1px solid; border-right: 1px solid; overflow-x: auto; }
    -->
    </style>
    <script type='text/javascript' src='https://code.jquery.com/jquery-3.4.1.min.js'></script>
    <script type='text/javascript'>
    <!--
      $(function()
        {
          var IdxPtnsStr = '<?= $StN; ?>',
              OrgTxt = $('#OrgTxt');

          if (IdxPtnsStr === '')
          {
            $('#Ctn').html(OrgTxt.remove().html());
            return;
          }

          var IdxPtns = JSON.parse(IdxPtnsStr).Ptns, // 'IdxPtns' = Indexs Pattern.
              PhsA = PhaseParse(OrgTxt.html(), IdxPtns.Main, 'index', 'Lv0'),
              CtnHTML = '',
              IdxsHTML = '';

          if (PhsA.length === 0)
          {
            $('#Ctn').html(OrgTxt.remove().html());
            return;
          }

          if (typeof IdxPtns.Sub !== 'undefined')
          {
            for (var i = 0; i < PhsA.length; i++)
            { PhsA[i].Subs = PhaseParse(PhsA[i].Ctn, IdxPtns.Sub, 'index_' + i.toString(), 'Lv1'); }
          }

          for (var i = 0; i < PhsA.length; i++)
          {
            if (PhsA[i].Subs === undefined || PhsA[i].Subs === null || PhsA[i].Subs.length === 0)
            {
              CtnHTML += PhsA[i].Ctn;
              IdxsHTML += '<li>' + PhsA[i].Idx + '</li>';
            }
            else
            {
              var BufCtnHTML = PhsA[i].Ctn,
                  BufIdxsHTML = '';

              for (var j = PhsA[i].Subs.length - 1; j > -1; j--)
              {
                BufCtnHTML = BufCtnHTML.substr(0, PhsA[i].Subs[j].CtnOrgBgn) +
                             PhsA[i].Subs[j].Ctn +
                             BufCtnHTML.substr(PhsA[i].Subs[j].CtnOrgBgn + PhsA[i].Subs[j].CtnOrgLth);
                BufIdxsHTML = '<li>' + PhsA[i].Subs[j].Idx + '</li>' + BufIdxsHTML;
              }

              CtnHTML += BufCtnHTML;
              IdxsHTML += '<li>' + PhsA[i].Idx + '<ul>' + BufIdxsHTML + '</ul></li>';
            }
          }

          $('#Ctn').html(CtnHTML);
          $('#IdxBx').html( '<ul>' + IdxsHTML + '</ul>');
          OrgTxt.remove();

          CompositionSet();
          ScrollSet();
        });

      /* parse phase of content.
        'Txt' = Text.
        'IDPrfx' = ID name Prefix.
        'IdxTgCls' = Index Tag Class name.
        Return: [{IdxHTML, CtnHTML}, ...], or [] as error. */
      function PhaseParse(Txt, IdxPtn, IDPrfx, IdxTgCls)
      {
        var BgnStrA = Txt.match(new RegExp(IdxPtn.Bgn, 'g')), // 'BgnStrA' = Begin String Array.
            EndStrA = Txt.match(new RegExp(IdxPtn.End, 'g')), // 'EndA' = End String Array.
            Rst = []; // 'Rst' = Result.

        if (BgnStrA === undefined || BgnStrA === null || BgnStrA.length === 0 ||
            EndStrA === undefined || EndStrA === null || EndStrA.length === 0 ||
            typeof IDPrfx !== 'string' || IDPrfx === '' || typeof IdxTgCls !== 'string' || IdxTgCls === '')
        { return []; }

        var BgnLctA = [], // 'BgnLctA' = Begin Location Array.
            EndLctA = []; // 'EndLctA' = End Location Array.

        for (var i = 0; i < BgnStrA.length; i++)
        { BgnLctA.push(Txt.indexOf(BgnStrA[i])); }

        for (var i = 0; i < EndStrA.length; i++)
        { EndLctA.push(Txt.indexOf(EndStrA[i])); }

        for (var i = 0; i < BgnLctA.length; i++)
        {
          var Ttl = BgnStrA[i].match(IdxPtn.Ttl);

          var Info = {'Idx': '<a href="javascript:void(0);" name="' + IDPrfx + '_' + i.toString() + '">' +
                              Ttl +
                              '</a>',
                      'Ctn': '', 'CtnOrgBgn': BgnLctA[i], 'CtnOrgLth': 0};

          if (typeof BgnLctA[i + 1] === 'undefined')
          { Info.Ctn = Txt.substr(Info.CtnOrgBgn); }
          else
          { Info.Ctn = Txt.substr(Info.CtnOrgBgn, BgnLctA[i + 1] - BgnLctA[i]); }

          Info.CtnOrgLth = Info.Ctn.length;
          Info.Ctn = Info.Ctn.replace(BgnStrA[i],
                                      '<h3 id="' + IDPrfx + '_' + i.toString() + '" class="TtlLn">' + BgnStrA[i] + '</h3>');

          Rst.push(Info);
        }

        return Rst;
      }

      function CompositionSet()
      {
        var Hd = $('#Head'),
            HdH = Hd.outerHeight(true),
            Optn = $('#OptnBx'),
            OptnW = Optn.outerWidth(true),
            Ctn = $('#Ctn'),
            CtnW = Ctn.outerWidth(true);

        Hd.css({'position': 'fixed', 'minWidth': OptnW + CtnW});
        Optn.css({'top': HdH});
        Ctn.css({'left': OptnW, 'top': HdH});
      }

      function ScrollSet()
      {
        var HTML = $('html');

        $('#IdxBx').on('click', 'a', function(Evt)
          {
            var ID = $(this).attr('name'),
                Lct = $('#' + ID).offset();

            Evt.preventDefault;
            HTML.scrollTop(Math.floor(Lct.top) - 55);
          });
      }
    -->
    </script>
  </head>
  <body>
    <div id='Base'>
      <div id='Head'>
        <div><?= $_GET['Fl']; ?></div>
        <div id='OptnBx'>
          <nav id='IdxBx'>
          </nav>
        </div>
      </div>
      <div id='Main'>
        <pre id='OrgTxt'><?= $FlStr; ?></pre>
        <pre id='Ctn'>
        </pre>
      </div>
    </div>
  </body>
</html>
<!--=================================================================================================================-->
