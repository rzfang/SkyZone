<?
  if (empty($VwData) || !is_array($VwData))
  { return; }
  else
  {
    if (empty($VwData['URL']) || !is_string($VwData['URL']))
    { return; }
  }
?>
<div id='ShrBx'>
  <? 
    $EcdURL = urlencode($VwData['URL']);
  ?>
  <i class='icon icon-share' title='分享'></i>
  <a href='<?= "http://www.facebook.com/share.php?u=$EcdURL"; ?>'><i class='icon icon-facebook'></i></a>
  <a href='<?= "http://twitter.com/intent/tweet?url=$EcdURL"; ?>'><i class='icon icon-twitter'></i></a>
  <a href='<?= "http://www.tumblr.com/share/link?url=$EcdURL"; ?>'><i class='icon icon-tumblr'></i></a>
  <a href='<?= "https://plus.google.com/share?url=$EcdURL"; ?>'><i class='icon icon-google-plus'></i></a>
  <!-- plurk 'http://www.plurk.com/?qualifier=shares&status=' . $EcdURL . ' (' . $Blog['Ttl'] . ')' -->
</div>