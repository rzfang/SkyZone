<?
  if (empty($VwData) || !is_array($VwData)) {
    $VwData =
      array(
        'Ttl'     => WEBSITE,
        'Smry'    => 'RZ 的個人網站。我的天空，我在其中，在我這裡，自由放空。',
        'URL'     => WEBSITE_URL,
        'ImgURL'  => WEBSITE_URL . 'image/logo.jpg'
      );
  }
  else {
    $VwData['Ttl'] = WEBSITE . (empty($VwData['Ttl']) || !is_string($VwData['Ttl']) ? '' : " - {$VwData['Ttl']}");
    $VwData['Smry'] =
      (empty($VwData['Smry']) || !is_string($VwData['Smry'])) ?
      'RZ 的個人網站。我的天空，我在其中，在我這裡，自由放空。' :
      str_replace("\n", '', $VwData['Smry']);
    $VwData['URL'] = (empty($VwData['URL']) || !is_string($VwData['URL'])) ? WEBSITE_URL : $VwData['URL'];
    $VwData['ImgURL'] =
      (empty($VwData['ImgURL']) || !is_string($VwData['ImgURL'])) ?
      (WEBSITE_URL . 'image/logo.jpg') :
      $VwData['ImgURL'];
  }
?>
<title><?= $VwData['Ttl']; ?></title>
<meta http-equiv='content-type' content='text/html; charset=utf-8'/>
<meta name='description' content='<?= $VwData['Smry']; ?>'/>
<meta name='keywords' content='空域, RZ, 個人網站'/>
<meta name='author' content='RZ Fang'/>
<meta name='viewport' content='initial-scale=1.0, user-scalable=0'>

<meta property='og:title' content='<?= $VwData['Ttl']; ?>'/>
<meta property='og:description' content='<?= $VwData['Smry']; ?>'/>
<meta property='og:url' content='<?= $VwData['URL']; ?>'/>
<meta property='og:type' content='website'/>
<meta property='og:image' content='<?= $VwData['ImgURL']; ?>'/>
<meta name='twitter:title' content='<?= $VwData['Ttl']; ?>'/>
<meta name='twitter:description' content='<?= $VwData['Smry']; ?>'/>
<meta name='twitter:url' content='<?= $VwData['URL']; ?>'/>
<meta name='twitter:card' content='summary'/>
<meta name='twitter:image' content='<?= $VwData['ImgURL']; ?>'/>

<link rel='icon' href='/favicon.ico' type='image/ico'/>
<link rel='alternate' type='application/atom+xml' title='atom' href='/feed.xml'/>
<link rel='stylesheet' type='text/css' href='resource/style2.css'/>