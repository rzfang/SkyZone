<?
  if (empty($VwData) || !is_array($VwData))
  { return; }
  else
  {
    if (empty($VwData['URL']) || !is_string($VwData['URL']))
    { return; }
  }
?>
<ul id='ShrBx'>
  <?
    $EcdURL = urlencode($VwData['URL']);
  ?>
  <li>
    <i class='icon icon-share' title='分享'></i>
  </li>
  <li>
    <a href='<?= "http://www.facebook.com/share.php?u=$EcdURL"; ?>'><i class='icon icon-facebook'></i></a>
  </li>
  <li>
    <a href='<?= "http://twitter.com/intent/tweet?url=$EcdURL"; ?>'><i class='icon icon-twitter'></i></a>
  </li>
  <li>
    <a href='<?= "http://www.tumblr.com/share/link?url=$EcdURL"; ?>'><i class='icon icon-tumblr'></i></a>
  </li>
  <li>
    <a href='<?= "https://plus.google.com/share?url=$EcdURL"; ?>'><i class='icon icon-google-plus'></i></a>
  </li>
  <!-- plurk 'http://www.plurk.com/?qualifier=shares&status=' . $EcdURL . ' (' . $Blog['Ttl'] . ')' -->
</ul>