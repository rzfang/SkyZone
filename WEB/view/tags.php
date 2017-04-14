<?
  if (empty($VwData) || !is_array($VwData))
  {
    $VwData = array(
        'Tgs' => array(), // 'Tgs' = Tags.
        'PckIDs' => array()
      );
  }
  else
  {
    if (empty($VwData['Tgs']) || !is_array($VwData['Tgs']))
    { $VwData['Tgs'] = array(); }

    if (empty($VwData['PckIDs']) || !is_array($VwData['PckIDs']))
    { $VwData['PckIDs'] = array(); }

    if (empty($VwData['NoCcl']) || !is_bool($VwData['NoCcl']))
    { $VwData['NoCcl'] = false; }
  }

  if (empty($VwData['Tgs']))
  { return; }
?>
<div id='TgBx'>
  <icon-tags title='分類標籤'></icon-tags>
  <?
    if (empty($VwData['PckIDs']))
    {
      foreach ($VwData['Tgs'] as $V)
      { echo "<a class='Tg' href='blogs.php?t={$V['ID']}'>{$V['Nm']}</a>\n"; }
    }
    else
    {
      echo "<a href='blogs.php'>取消</a><br/>\n";

      foreach ($VwData['Tgs'] as $V)
      {
        foreach ($VwData['PckIDs'] as $V1)
        {
          echo ($V['ID'] === $V1) ?
            "<span class='Tg Pckd'>{$V['Nm']}</span>\n" :
            "<a class='Tg' href='blogs.php?t={$V['ID']}'>{$V['Nm']}</a>\n";
        }
      }
    }
  ?>
</div>