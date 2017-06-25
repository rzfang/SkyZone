<?
/* Need: global.php */

class System
{
  public static $AdminPswd = ADMIN_PSWD;
  public static $AdminPswdSsnNm = SSN_ADMIN_PSWD;

  public static $BlogTpA = array('text', 'html', 'image', 'images'); // Blog Type Array.

  /* check if user is login.
    '$SvrPswd' = Server Password.
    '$SsnNm' = Session Name which store client password.
    Return: true. | false. */
  public static function SessionIsLogin ($SvrPswd, $SsnNm)
  {
    if (!is_string($SvrPswd) || empty($SsnNm) || !is_string($SsnNm))
      return false;

    if (session_id() === '')
      session_start();

    if (empty($_SESSION[$SsnNm]) ||  !is_string($_SESSION[$SsnNm]))
      return false;

    if ($_SESSION[$SsnNm] != $SvrPswd)
    {
      unset($_SESSION[$SsnNm]);
      return false;
    }

    return true;
  }

  /* administrator Logout.
    '$IA' = Info Array, often as '$_POST'.
      '$IA['Lgt']' = Logout.
    '$SsnNm' = Session Name which store client password.
    Return: JSON string. | 0 as OK, < 0 as error. */
  public static function SessionLogout ($IA, $SsnNm)
  {
    global $Kw;

    if (session_id() === '')
      session_start();

    if (!isset($IA['Lgt']))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], -1);

    if (!isset($_SESSION[$SsnNm]))
      return ReturnPack(1, '無須登出，直接重整頁面即可。', 1);

    unset($_SESSION[$SsnNm]);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  /*  administrator Login.
    '$IA' = Info Array, often as '$_POST'.
      '$IA['Pswd']' = Password from client.
    '$SvrPswd' = Server Password.
    '$SsnNm' = Session Name which store client password.
    Return: JSON string. | 0 as OK, < 0 as error. */
  public static function SessionLogin ($IA, $SvrPswd, $SsnNm)
  {
    global $Kw;

    if (session_id() === '')
      session_start();

    if (!isset($IA['Pswd']) || !is_string($IA['Pswd']))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], -1);

    if ($IA['Pswd'] !== $SvrPswd)
      return ReturnPack(-2, '密碼錯誤。', -2);

    $_SESSION[$SsnNm] = $IA['Pswd'];

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  /* Cache Images from tar file.
    '$TarFlPth' = Tar File Path.
    '$TarObj' = Archive_Tar Object out of function, give to avoid new another if one is exist.
    Return: the number of image cached, < 0 as error.
    Need: GD library. pear/archive_tar. */
  public static function ImagesCacheFromTar ($TarFlPth, $TarObj = null)
  {
    if (empty($TarFlPth) || !is_string($TarFlPth) || !is_file($TarFlPth))
      return -1;

    $Tar = (empty($TarObj) || !is_object($TarObj)) ? new Archive_Tar($TarFlPth) : $TarObj;
    $TA = $Tar->listContent();

    if (empty($TA))
      return -2;

    $TFN = substr(basename($TarFlPth), 0, -4); // '$TFN' = Tar File Name without file extension.
    $EA = array('.jpg', '.png', '.gif'); // '$EA' = Extend Array.
    $C = 0;

    foreach($TA as $V)
    {
      if (!in_array(substr($V['filename'], -4), $EA))
        continue;

      $CFN = "$TFN-" . $V['filename']; // '$CFN' = Cache File Name.
      $CFP = CCH_PTH . $CFN;

      if (is_file($CFP))
        continue;

      $Str = $Tar->extractInString($V['filename']);

      if (empty($Str))
        continue;

      if (file_put_contents($CFP, $Str) === false)
        continue;

      if (!chmod($CFP, 0744))
        continue;

      $C++;

      $II = getimagesize($CFP); // '$II' = Image Info.
      $TW = 400;
      $TH = 300;

      if ($II[0] > $II[1])
        $TH = floor($II[1] / $II[0] * $TW);
      else if ($II[0] < $II[1])
        $TW = floor($II[0] / $II[1] * $TH);

      $Img = imagecreatefromstring($Str);

      if (empty($Img))
        continue;

      $Tbn = imagecreatetruecolor($TW, $TH);

      if (!imagecopyresized($Tbn, $Img, 0, 0, 0, 0, $TW, $TH, $II[0], $II[1]))
        continue;

      imagedestroy($Img);

      $Ext = substr($CFP, -3);
      $CFP = substr($CFP, 0, -4) . '_T.' . $Ext;

      switch ($Ext)
      {
        case 'png':
          imagepng($Tbn, $CFP);
          break;

        case 'gif':
          imagegif ($Tbn, $CFP);
          break;

        case 'jpg':
        default:
          imagejpeg($Tbn, $CFP);
      }
    }

    return $C;
  }

  /* print Tar Image File stream to standard Out. the process will be end immediately after this called.
    '$TarFlPth' = Tar File Path.
    '$ImgFlNm' = Image File Name.
    Return: 0 as OK, < 0 as error.
    Need: GD library. pear/archive_tar. */
  public static function TarImageOut ($TarFlPth, $ImgFlNm)
  {
    $TFP = WEB_PTH . 'www/image/null.png'; // '$TFP' = Temp File Path.

    if (empty($TarFlPth) || !is_string($TarFlPth) || !is_file($TarFlPth) || empty($ImgFlNm) || !is_string($ImgFlNm))
    {
      ImageFileOut($TFP);

      exit;
    }

    $Tar = new Archive_Tar($TarFlPth);
    $Str = $Tar->extractInString($ImgFlNm); // '$Str' = String of file data stream.

    if (empty($Str))
    {
      ImageFileOut($TFP);

      exit;
    }

    $MT = ImageMimeTypeFromStream($Str);
    $I = imagecreatefromstring($Str);

    unset($Tar, $Str);

    if (empty($I))
    {
      ImageFileOut($TFP);

      exit;
    }

    header("Content-Type: $MT");

    switch ($MT)
    {
      case 'image/png':
        header('Content-Disposition: Attachment; filename=image.png');
        imagepng($I);
        break;

      case 'image/gif':
        header('Content-Disposition: Attachment; filename=image.gif');
        imagegif ($I);
        break;

      case 'image/jpeg':
      default:
        header('Content-Disposition: Attachment; filename=image.jpg');
        imagejpeg($I);
    }

    imagedestroy($I);

    exit;
  }

  /* list tutorial articles.
    '$IA' = Info Array. often as '$_POST'.
    Return: JSON string | array of Tag info. */
  public static function TutorialList ($IA)
  {
    global $Kw;

    // $Lmt = (isset($IA['Lmt']) && is_numeric($IA['Lmt']) && $IA['Lmt'] > 0) ? (int)$IA['Lmt'] : 1;
    // $Ofst = (isset($IA['Ofst']) && is_numeric($IA['Ofst']) && $IA['Ofst'] > 0) ? (int)$IA['Ofst'] : 0;
    $Cnt = !empty($IA['Cnt']) ? true : false;

    $DirPth = DAT_PTH . 'tutorial/';
    $FlLst = array_values(array_diff(scandir($DirPth), array('.', '..', 'setting.json')));

    if ($Cnt)
      return ReturnPack(0, $Kw['RM']['Done'], count($FlLst));

    return ReturnPack(0, $Kw['RM']['Done'], $FlLst);
  }
}

class Tag
{
  /* list tags.
    Return: JSON string | array of Tag info. */
  public static function TagList ($IA = array())
  {
    global $Kw;

    if (empty($IA))
    { $IA = array(); }

    $Cnt = !empty($IA['Cnt']) ? true : false;

    if ($Cnt)
    {
      $SQL = 'SELECT COUNT(id) FROM Tag;';
      $Rsc = Db::Query($SQL);

      if (empty($Rsc))
        return ReturnPack(-1, $Kw['RM']['DbCrash'], array());

      $R = $Rsc->fetch(PDO::FETCH_NUM);

      return ReturnPack(0, $Kw['RM']['Done'], $R[0]);
    }

    $Lmt = (isset($IA['Lmt']) && is_numeric($IA['Lmt']) && $IA['Lmt'] > 0) ? (int)$IA['Lmt'] : -1;
    $Ofst = (isset($IA['Ofst']) && is_numeric($IA['Ofst']) && $IA['Ofst'] > 0) ? (int)$IA['Ofst'] : 0;
    $SQL = "SELECT id AS ID, name AS Nm FROM Tag ORDER BY Nm LIMIT $Lmt OFFSET $Ofst";
    $Rsc = Db::Query($SQL);

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

    $Rst = array();

    while ($R = $Rsc->fetch())
      $Rst[] = $R;

    return ReturnPack(0, $Kw['RM']['Done'], $Rst);
  }

  /* create a tag.
    '$IA' = Info Array. often as '$_POST'.
    Return: JSON string | result code. */
  public static function Create ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA['Nm']) || !is_string($IA['Nm']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    $ID = UUID(true);
    $SQL = 'INSERT INTO Tag (id, name) VALUES (?, ?);';
    $Rsc = Db::QryPrm($SQL, array($ID, $IA['Nm']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], -3);

    return ReturnPack(0, $Kw['RM']['Done'], $ID);
  }

  /* delete a tag.
    '$IA' = Info Array. often as '$_POST'.
    Return: JSOn string | result code. */
  public static function Delete ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA['ID']) || !is_string($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    $SQL = 'DELETE FROM TagLink WHERE tag_id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], -3);

    $SQL = 'DELETE FROM Tag WHERE id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-4, $Kw['RM']['DbCrash'], -4);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  /* create a tag.
    '$IA' = Info Array. often as '$_POST'.
      '$IA['ID']' = tag ID.
      '$IA['Nm']' = tag new Name.
    Return: JSON string | result code. */
  public static function Rename ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA['ID']) || !is_string($IA['ID']) || !IsUUID($IA['ID']) ||
       empty($IA['Nm']) || !is_string($IA['Nm']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    $SQL = 'UPDATE Tag SET name = ? WHERE id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['Nm'], $IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], -3);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  /* set target link with tag, include create & update (delete & re-create).
    '$IA' = Info Array. often as '$_POST'.
      '$IA['ID']' = target blog ID.
      '$IA['TgIDA']' = Tag ID Array, each of array must be UUID in Tag'table.
      '$IA['RtnMd']' = Return Mode. see this means this function is also called in server somewhere.
    Return: JSON string | result code. */
  public static function LinkSet ($IA)
  {
    global $Kw;

    $RtnMd = isset($IA['RtnMd']) ? $IA['RtnMd'] : 0;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1, $RtnMd);

    if (empty($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2, $RtnMd);

    $SQL = 'DELETE FROM TagLink WHERE link_id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], -3, $RtnMd);

    if (empty($IA['TgIDA']) || !is_array($IA['TgIDA']))
      return ReturnPack(1, $Kw['RM']['Done'], 1, $RtnMd);

    $SQL = 'INSERT INTO TagLink (id, tag_id, link_id) VALUES ';
    $VA = array();

    foreach($IA['TgIDA'] as $V)
    {
      if (!IsUUID($V))
        continue;

      $SQL .= '(?, ?, ?), ';
      $VA[] = UUID(true);
      $VA[] = $V;
      $VA[] = $IA['ID'];
    }

    $SQL = substr($SQL, 0, -2) . ';';

    if (empty($VA))
      return ReturnPack(2, $Kw['RM']['Done'], 2, $RtnMd);

    $Rsc = Db::QryPrm($SQL, $VA);

    if (empty($Rsc))
      return ReturnPack(-4, $Kw['RM']['DbCrash'], -4, $RtnMd);

    return ReturnPack(0, $Kw['RM']['Done'], 0, $RtnMd);
  }
}

class Blog
{
  /* List Blog.
    '$IA' = Info Array.
      '$IA['Lmt']' = Limit of list.
      '$IA['Ofst']' = Offset of list.
      '$IA['Cnt']' = Count of list. pass this to get the count number.
      '$IA['TgIDA']' = Tag ID Array.
    Return: JSON string | array. */
  public static function BlogList ($IA)
  {
    global $Kw;

    if (empty($IA))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], array());

    $Cnt = !empty($IA['Cnt']) ? true : false;
    $TgIDA = array();
    $SQL0 = '';

    if (!empty($IA['TgIDA']) && is_array($IA['TgIDA']))
    {
      foreach($IA['TgIDA'] as $V)
      {
        if (IsUUID($V))
        {
          $TgIDA[] = $V;
          $SQL0 .= '?, ';
        }
      }
    }

    $Rsc = null;

    if ($Cnt)
    {
      if (empty($TgIDA))
      {
        $SQL = 'SELECT COUNT(id) FROM Blog;';
        $Rsc = Db::Query($SQL);
      }
      else
      {
        $SQL0 = substr($SQL0, 0, -2);
        $SQL = 'SELECT COUNT(Blog.id) FROM Blog, TagLink ' .
               "WHERE Blog.id = TagLink.link_id AND TagLink.tag_id IN ($SQL0);";
        $Rsc = Db::QryPrm($SQL, $TgIDA);
      }

      if (empty($Rsc))
        return ReturnPack(-1, $Kw['RM']['DbCrash'], array());

      $R = $Rsc->fetch(PDO::FETCH_NUM);

      return ReturnPack(0, $Kw['RM']['Done'], $R[0]);
    }

    $Lmt = (isset($IA['Lmt']) && is_numeric($IA['Lmt']) && $IA['Lmt'] > 0) ? (int)$IA['Lmt'] : -1;
    $Ofst = (isset($IA['Ofst']) && is_numeric($IA['Ofst']) && $IA['Ofst'] > 0) ? (int)$IA['Ofst'] : 0;

    if (empty($TgIDA)) // list without tag condition.
    {
      $SQL = 'SELECT id AS ID, title AS Ttl, summary as Smry, type AS Tp, datetime AS Dt, ' .
             'password AS Pswd FROM Blog ' .
             "ORDER BY datetime DESC LIMIT $Lmt OFFSET $Ofst;";
      $Rsc = Db::Query($SQL);
    }
    else // list with tag condition.
    {
      $SQL0 = substr($SQL0, 0, -2);
      $SQL = 'SELECT Blog.id AS ID, Blog.title AS Ttl, Blog.summary as Smry, Blog.type AS Tp, ' .
             'Blog.datetime AS Dt, Blog.password AS Pswd ' .
             "FROM Blog, TagLink WHERE Blog.id = TagLink.link_id AND TagLink.tag_id IN ($SQL0) " .
             "ORDER BY Blog.datetime DESC LIMIT $Lmt OFFSET $Ofst;";
      $Rsc = Db::QryPrm($SQL, $TgIDA);
    }

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

    $Rst = array();
    $VA = array(); // '$VA' = Value Array.
    $KS = ''; // '$KS' = Key String.

    while ($R = $Rsc->fetch())
    {
      if (empty($R['Smry']))
        $R['Smry'] = '';

      $R['Tg'] = array();

      if ($R['Pswd'] != '')
        $R['Pswd'] = '???';

      $VA[] = $R['ID'];
      $KS .= '?, ';
      $Rst[] = $R;
    }
    $KS = substr($KS, 0, -2);

    if (strlen($KS) > 0)
    {
      $SQL = 'SELECT Tag.id AS TgID, Tag.name AS TgNm, TagLink.link_id AS TgtID FROM Tag, TagLink ' .
             "WHERe Tag.id = TagLink.tag_id AND TagLink.link_id IN ($KS) ORDER BY TgtID;";
      $Rsc = Db::QryPrm($SQL, $VA);

      while ($R = $Rsc->fetch())
      {
        foreach($Rst as $K => $V)
        {
          if ($V['ID'] === $R['TgtID'])
          {
            $Rst[$K]['Tg'][] = array('ID' => $R['TgID'], 'Nm' => $R['TgNm']);
            break;
          }
        }
      }
    }

    return ReturnPack(0, $Kw['RM']['Done'], $Rst);
  }

  /* List blogs info by admin.
    '$IA' = Info Array, often as '$_POST'.
    Return: JSON string. | list array, or empty array as error. | number. */
  public static function AdminList ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], array());

    $Lmt = (isset($IA['Lmt']) && is_numeric($IA['Lmt']) && $IA['Lmt'] > 0) ? (int)$IA['Lmt'] : 0;
    $Ofst = (isset($IA['Ofst']) && is_numeric($IA['Ofst']) && $IA['Ofst'] > 0) ? (int)$IA['Ofst'] : 0;
    $Cnt = !empty($IA['Cnt']) ? true : false;
    $FlA = scandir(DAT_PTH . 'blog', 0);

    array_shift($FlA);
    array_shift($FlA);

    if ($Cnt)
      return ReturnPack(0, $Kw['RM']['Done'], count($FlA));

    $SQL0 = 'SELECT BlogComment.blog_id, COUNT(BlogComment.id) AS CmtCnt FROM BlogComment GROUP BY BlogComment.blog_id';
    $SQL = 'SELECT Blog.id AS ID, Blog.title AS Ttl, Blog.file AS Fl, Blog.type AS Tp, Blog.datetime AS Dt, ' .
           'Blog.password AS Pswd, Blog.summary AS Smry, BlogCmt.CmtCnt ' .
           "FROM Blog LEFT JOIN ($SQL0) AS BlogCmt ON Blog.id = BlogCmt.blog_id ORDER BY Dt DESC;";
    $Rsc = Db::Query($SQL);

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

    $LstID = '';
    $DbRst = array();

    while ($R = $Rsc->fetch())
    {
      if (empty($R['CmtCnt']))
        $R['CmtCnt'] = 0;

      $R['Tg'] = array();
      $DbRst[] = $R;
    }

    $Rst = array();

    foreach($FlA as $V0)
    {
      $R = array('ID' => '', 'Ttl' => '', 'Fl' => $V0, 'Tp' => '', 'Dt' => '', 'Pswd' => '', 'Smry' => '',
                 'CmtCnt' => 0,
                 'Tg' => array());

      foreach($DbRst as $V1)
      {
        if ($V0 == $V1['Fl'])
        {
          $R = $V1;
          break;
        }
      }

      $Rst[] = $R;
    }
    unset($FlA, $DbRst);

    function BlogSort($A, $B)
    {
      if (empty($A['ID']))
        return -1;

      if (empty($B['ID']))
        return 1;

      if ($A['Dt'] > $B['Dt'])
        return -1;
      else if ($A['Dt'] < $B['Dt'])
        return 1;

      return 0;
    }
    usort($Rst, 'BlogSort');

    if ($Lmt > 0)
      $Rst = array_slice($Rst, $Ofst, $Lmt);

    $SQL0 = '';
    $IDA = array();

    foreach($Rst as $V0)
    {
      $SQL0 .= '?, ';
      $IDA[] = $V0['ID'];
    }
    $SQL0 = substr($SQL0, 0, -2);

    if (!empty($IDA))
    {
      $SQL = 'SELECT Tag.id AS ID, Tag.name AS Nm, TagLink.link_id AS BlogID FROM TagLink, Tag ' .
             "WHERE TagLink.tag_id = Tag.id AND TagLink.link_id IN ($SQL0);";
      $Rsc = Db::QryPrm($SQL, $IDA);

      if (empty($Rsc))
        return ReturnPack(-3, $Kw['RM']['DbCrash'], array());

      while ($R = $Rsc->fetch())
      {
        foreach($Rst as $K0 => $V0)
        {
          if ($V0['ID'] == $R['BlogID'])
          {
            $Rst[$K0]['Tg'][] = array('ID' => $R['ID'], 'Nm' => $R['Nm']);
            break;
          }
        }
      }
    }

    return ReturnPack(0, $Kw['RM']['StepTest'], $Rst);
  }

  /* Collect a blog basic Info.
    '$IA' = Info Array, often as '$_POST'.
      '$IA['ID']' = blog ID.
    Return: JSON | 0 as OK, < 0 as error, > 0 as password problem. */
  public static function InfoCollect ($IA)
  {
    global $Kw;

    if (empty($IA) || empty($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], array());

    $SQL = 'SELECT id AS ID, title AS Ttl, summary as Smry, file AS Fl, type AS Tp, password AS Pswd ' .
           'FROM Blog WHERE id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

    $Rst = $Rsc->fetch();

    if (empty($Rst))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], array());

    $Rst['Smry'] = str_replace("\n", '', $Rst['Smry']);
    $Rst['TbnURL'] = 'https://' . WEBSITE_URL . 'image/logo.jpg';

    if (!empty($Rst['Pswd'])) // check password.
      return ReturnPack(0, $Kw['RM']['PasswordNeed'], $Rst);

    $FP = DAT_PTH . 'blog/' . $Rst['Fl']; // '$FP' = blog File Path.
    $Tar = new Archive_Tar($FP);
    $TFA = $Tar->listContent(); // '$FFA' = Temp File Array.
    $FA = array();

    if (empty($TFA))
      return ReturnPack(0, $Kw['RM']['PasswordNeed'], $Rst);

    foreach($TFA as $V)
      $FA[] = $V['filename'];
    unset($TFA);

    $FA = array_values(preg_grep('/\.png$|\.jpg$|\.gif$/', $FA));

    if (empty($FA))
      return ReturnPack(0, $Kw['RM']['PasswordNeed'], $Rst);

    $TFS = StringEnDeCode($Rst['Fl']); // '$TFS' = Tar File name String.
    $IFS = StringEnDeCode($FA[0]); // '$IFS' = Image File name String.
    $Rst['TbnURL'] = "img.php?B=$TFS&FN=$IFS&Tbn";

    System::ImagesCacheFromTar($FP, $Tar);

    return ReturnPack(0, $Kw['RM']['Done'], $Rst);
  }

  /*
    '$IA' = Info Array, often as '$_POST'.
      '$IA['ID']' = blog ID.
      '$IA['Rdm']' = Random flag.
      '$IA['Pswd']' = Password of blog.
    Return: JSON | 0 as OK, < 0 as error, > 0 as password problem. */
  public static function OneRead ($IA)
  {
    global $Kw;

    if (empty($IA) || empty($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], array());

    $ID = '';
    $Rsc = null;

    // handle with random.
    if (empty($IA['Rdm']) || !is_numeric($IA['Rdm']) || $IA['Rdm'] != 1)
      $ID = $IA['ID'];
    else
    {
      $Rst = Db::RandomGet('Blog');

      if (empty($Rst) || empty($Rst[0]) || empty($Rst[0]['id']))
        return ReturnPack(1, $Kw['RM']['NoSuchData'], array());

      $ID =  $Rst[0]['id'];
    }

    $SQL = 'SELECT Blog.id AS ID, Blog.title AS Ttl, Blog.file AS Fl, Blog.summary AS Smry, Blog.type AS Tp, ' .
           'Blog.datetime AS Dt, Blog.password AS Pswd, COUNT(BlogComment.id) AS CmtCnt ' .
           'FROM Blog LEFT JOIN BlogComment ON Blog.id = BlogComment.blog_id WHERE Blog.id = ? ' .
           'GROUP BY Ttl, Fl, Tp, Dt, Pswd;';
    $Rsc = Db::QryPrm($SQL, array($ID));

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

    $Rst = $Rsc->fetch();
    $Rst['TgA'] = array();

    if (empty($Rst))
      return ReturnPack(-3, $Kw['RM']['NoSuchData'], array());

    if (!empty($Rst['Pswd'])) // check password.
    {
      if (empty($IA['Pswd']) || !is_string($IA['Pswd']))
        return ReturnPack(1, $Kw['RM']['PasswordNeed'], array());

      if ($Rst['Pswd'] != $IA['Pswd'])
        return ReturnPack(2, $Kw['RM']['WrongPassword'], array());
    }

    $FP = DAT_PTH . 'blog/' . $Rst['Fl'];

    if (!is_file($FP))
      return ReturnPack(-4, $Kw['RM']['NoSuchData'], array());

    $SQL = 'SELECT Tag.id AS ID, Tag.name AS Nm FROM Tag, TagLink ' .
           'WHERE Tag.id = TagLink.tag_id AND TagLink.link_id = ?;';
    $Rsc = Db::QryPrm($SQL, array($Rst['ID']));

    if (empty($Rsc))
      return ReturnPack(-5, $Kw['RM']['DbCrash'], array());

    while ($R = $Rsc->fetch())
      $Rst['TgA'][] = $R;

    $RstCd = 0;

    switch ($Rst['Tp'])
    {
      case 'image':
        $RstCd = self::OneImageGet($Rst, $FP);
        $Rst['URL'] = WEBSITE_URL . 'image.php?b=' . $Rst['ID'];
        break;

      case 'images':
        $RstCd = self::OneImagesGet($Rst, $FP);
        $Rst['URL'] = WEBSITE_URL . 'images.php?b=' . $Rst['ID'];
        break;

      case 'html':
        // $Rst['URL'] = 'html.php?T=' . StringEnDeCode($IA['ID']);
        // $Rst['URL'] = WEBSITE_URL . 'html.php?b=' . $Rst['ID'];
        break;

      case 'text':
      default:
        $RstCd = self::OneTextGet($Rst, $FP);
        $Rst['URL'] = WEBSITE_URL . 'text.php?b=' . $Rst['ID'];
    }

    if ($RstCd < 0)
      ReturnPack(-5, $Kw['RM']['LoadDataFail'], array($RstCd));

    return ReturnPack(0, $Kw['RM']['Done'], $Rst);
  }

  /* Get One Text blog.
    '&$Rtn' = a reference of Return info array passing in.
    '$FP' = File Path.
    Return: >= 0 as OK, < 0 as error. */
  private static function OneTextGet (&$Rtn, $FlPth)
  {
    if (empty($Rtn) || !is_array($Rtn) || empty($FlPth) || !is_string($FlPth))
      return -1;

    $Str = file_get_contents($FlPth);

    if ($Str == false || strlen($Str) == 0)
      return -2;

    $Rtn['Info'] = array('Str' => $Str);
  }

  /* Get One Image blog.
    '&$RtnA' = a reference of Return info array passing in.
    '$FlPth' = File Path.
    Return: >= 0 as OK, < 0 as error. */
  private static function OneImageGet (&$RtnA, $FlPth)
  {
    if (empty($RtnA) || !is_array($RtnA) || empty($FlPth) || !is_string($FlPth))
      return -1;

    $Tar = new Archive_Tar($FlPth);
    $FA = $Tar->listContent();

    if (empty($FA))
      return -2;

    $IE = substr($FA[0]['filename'], strrpos($FA[0]['filename'], '.')); // '$IE' = Image Extend file name.
    $ECA = array('.jpg', '.png', '.gif'); // '$ECA' = Extend Class Array.

    if (count($FA) == 1 && !in_array($IE, $ECA))
      return -3;
    unset($IE, $ECA);

    $TFN = StringEnDeCode(basename($FlPth)); // '$TFN' = Tar File Name.
    $IFN = ''; // '$IFN' = Image File Name.

    foreach($FA as $V)
    {
      if (($V['filename']) != 'comment.txt')
      {
        $IFN = StringEnDeCode($V['filename']);
        break;
      }
    }

    $RtnA['Info'] = array('ImgURL' => "img.php?B=$TFN&FN=$IFN", 'Str' => $Tar->extractInString('comment.txt'));

    return 0;
  }

  /*
    '&$RtnA' = referenced Return Array.
    '$FlPth' = tar File Path.
    Return: 0 as OK, < 0 as error.
    Need: pear/archive_tar. */
  private static function OneImagesGet (&$RtnA, $FlPth)
  {
    if (empty($RtnA) || !is_array($RtnA) || empty($FlPth) || !is_string($FlPth) || !is_file($FlPth))
      return -1;

    $Tar = new Archive_Tar($FlPth);
    $FlA = $Tar->listContent(); // '$FlA' = File Array.

    //==== filter files. ====

    $TgtFlA = array(); // '$TgtFlA' = Target File Array.
    $ExtFltA = array('.jpg', '.png', '.gif'); // '$ExtFltA' = file Extend Filter Array.

    foreach($FlA as $V0)
    {
      if (in_array(substr($V0['filename'], strrpos($V0['filename'], '.')), $ExtFltA))
        $TgtFlA[] = $V0['filename'];
    }

    $TmpStr = $Tar->extractInString('comment.json'); // '$TmpStr' = Temp String.
    $InfoA = empty($TmpStr) ?
            self::OneImagesV1Get($TgtFlA, $Tar->extractInString('comment.txt')) :
            self::OneImagesV2Get($TgtFlA, $TmpStr); // [{Fl, Cmt}, ...].

    if (empty($InfoA))
      return -2;

    $TarFlNm = StringEnDeCode(basename($FlPth)); // '$TarFlNm' = Tar File Name.

    foreach($InfoA as $K0 => $V0)
    {
      $ImgFlNm = StringEnDeCode($V0['Fl']);
      $RtnA['Lst'][] = array('ImgURL' => "img.php?B=$TarFlNm&FN=$ImgFlNm",
                             'TbnURL' => "img.php?B=$TarFlNm&FN=$ImgFlNm&Tbn",
                             'Str' => $V0['Cmt']);
    }

    System::ImagesCacheFromTar($FlPth, $Tar);

    return 0;
  }

  /* one images info get version 1 with text comment file.
    '$FlA' = File name Array.
    '$CmtStr' = Comment String.
    Return: info array, or array() as error. */
  private static function OneImagesV1Get ($FlA, $CmtStr)
  {
    if (empty($FlA) || empty($CmtStr) || !is_array($FlA) || !is_string($CmtStr))
      return array();

    //==== comments get. ====

    $CmtA = preg_split("/={4,}\r?\n/", $CmtStr); // '$CmtA' = Comment string Array.

    //==== file names get. ====

    function FileSerialSort($A, $B)
    {
      if (empty($A))
        return -1;

      if (empty($B))
        return 1;

      if ($A < $B)
        return -1;
      else if ($A > $B)
        return 1;

      return 0;
    }

    usort($FlA, 'FileSerialSort');

    //==== file names & comment merge. ====

    $ImgFlA = array(); // '$ImgFlA' = Image File Array.
    $C = min(count($CmtA), count($FlA));

    for ($i = 0; $i < $C; $i++)
      $ImgFlA[] = array('Fl' => $FlA[$i], 'Cmt' => trim($CmtA[$i]));

    return $ImgFlA;
  }

  /* one images info get version 2 with JSON comment file.
    '$FlA' = File name Array.
    '$CmtStr' = Comment String.
    Return: info array, or array() as error. */
  private static function OneImagesV2Get ($FlA, $CmtStr)
  {
    if (empty($FlA) || empty($CmtStr) || !is_array($FlA) || !is_string($CmtStr))
      return array();

    $Info = json_decode($CmtStr, true);

    if (empty($Info) || !is_array($Info))
      return array();

    return $Info;
  }

  /* create blog with existing file.
    '$IA' = Info Array, often as '$_POST'.
    Return: JSON string. | created blog ID, or empty string as error. */
  public static function Create ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], '');

    if (empty($IA) || !is_array($IA) || empty($IA['Fl']) || !is_string($IA['Fl']) ||
       empty($IA['Ttl']) || !is_string($IA['Ttl']) || empty($IA['Dt']) || !IsTimeStamp($IA['Dt']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], '');

    if (empty($IA['Smry']) || !is_string($IA['Smry']))
      $IA['Smry'] = '';

    //==== add new row into Db. ====

    $ID = UUID();
    $Tp = empty($IA['Tp']) ? 'text' : $IA['Tp'];
    $Pswd = (empty($IA['Pswd']) || !is_string($IA['Pswd'])) ? '' : $IA['Pswd'];

    $SQL = 'INSERT INTO Blog (id, title, file, type, datetime, password, summary) VALUES (?, ?, ?, ?, ?, ?, ?);';
    $Rsc = Db::QryPrm($SQL, array($ID, $IA['Ttl'], $IA['Fl'], $IA['Tp'], $IA['Dt'], $Pswd, $IA['Smry']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], '');

    //==== tag link set. ====

    $IA['ID'] = $ID;
    $IA['RtnMd'] = 3;

    $Rst = Tag::LinkSet($IA);

    if ($Rst['Idx'] < 0)
      return ReturnPack(-4, $Rst['Msg'], (-4 + ($Rst['Idx'] * 10)));

    return ReturnPack(0, $Kw['RM']['Done'], $ID);
  }

  /* update Blog with existing file.
    '$IA' = Info Array, often as '$_POST'.
    Return: JSON string. | 0 as OK, or < 0 error. */
  public static function Update ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA) || !is_array($IA) || empty($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    //==== base info update. ====

    $VA = array();

    $SQL = 'UPDATE Blog SET ';

    if (!empty($IA['Ttl']) && is_string($IA['Ttl']))
    {
      $SQL .= 'title = ?, ';
      $VA[] = trim($IA['Ttl']);
    }

    if (!empty($IA['Tp']) && is_string($IA['Tp']) && in_array($IA['Tp'], System::$BlogTpA))
    {
      $SQL .= 'type = ?, ';
      $VA[] = $IA['Tp'];
    }

    if (!empty($IA['Dt']) && IsTimeStamp($IA['Dt']))
    {
      $SQL .= 'datetime = ?, ';
      $VA[] = $IA['Dt'];
    }

    if (isset($IA['Pswd']) && is_string($IA['Pswd']))
    {
      $SQL .= 'password = ?, ';
      $VA[] = $IA['Pswd'];
    }

    if (isset($IA['Smry']) && is_string($IA['Smry']))
    {
      $SQL .= 'summary = ?, ';
      $VA[] = trim($IA['Smry']);
    }

    $SQL = substr($SQL, 0, -2) . ' WHERE id = ?';
    $VA[] = $IA['ID'];

    $Rsc = Db::QryPrm($SQL, $VA);

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], -3);

    //==== tag link update. ====

    $IA['RtnMd'] = 3;

    $Rst = Tag::LinkSet($IA);

    if ($Rst['Idx'] < 0)
      return ReturnPack(-4, $Rst['Msg'], (-4 + ($Rst['Idx'] * 10)));

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  /* Delete Blog from Db, but keep file live.
    '$IA' = Info Array, often as '$_POST'.
      '$IA['ID']' = blog ID.
    Return: JSON string. | 0 as OK, < 0 as error. */
  public static function Delete ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], '');

    if (empty($IA) || !is_array($IA) || empty($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], -1);

    //==== delete tag link of this blog. ====

    $IA['RtnMd'] = 3;
    $Rst = Tag::LinkSet($IA);

    if ($Rst['Idx'] < 0)
      return ReturnPack(-2, $Rst['Msg'], (-2 + ($Rst['Idx'] * 10)));

    //==== delete comment of this blig. ====

    $SQL = 'DELETE FROM BlogComment WHERE blog_id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], -3);

    //==== delete this blog. ====

    $SQL = 'DELETE FROM Blog WHERE id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-4, $Kw['RM']['DbCrash'], -4);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  /*
    '$IA' = Info Array. often as '$_POST'.
    '$FA' = File info Array. must be'$_FILES'.
    Return: JSON string. | 0 as OK, or < 0 error. */
  public static function FileUpload ($IA, $FA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($FA) || empty($FA['Fl']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    if (!isset($FA['Fl']['error']) || $FA['Fl']['error'] != 0)
      return ReturnPack(-3, $Kw['RM']['UploadFail'], -3);

    if ($FA['Fl']['type'] !== 'application/x-tar' && $FA['Fl']['type'] !== 'text/plain')
      return ReturnPack(-4, $Kw['RM']['WrongFileFormat'], -4);

    $FlPth = DAT_PTH . 'blog/' . $FA['Fl']['name'];

    if (is_file($FlPth) && !is_writable($FlPth))
      return ReturnPack(-5, $Kw['RM']['SystemError'], -5);

    $Rst = move_uploaded_file($FA['Fl']['tmp_name'], $FlPth);

    if ($Rst !== true)
      return ReturnPack(-6, $Kw['RM']['UploadFail'], -6);

    if (!chmod($FlPth, FILE_MOD))
      return ReturnPack(-7, $Kw['RM']['SystemError'], -7);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  /* list messages.
    '$IA' = Info Array, some case as '$_POST'.
      '$IA['ID']' = blog ID.
    Return: JSON string | message array. */
  public static function CommentList ($IA)
  {
    global $Kw;

    if (empty($IA) || !is_array($IA) || empty($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], array(0));

    $Cnt = !empty($IA['Cnt']) ? true : false;

    if ($Cnt)
    {
      $SQL = 'SELECT COUNT(id) FROM BlogComment WHERE blog_id = ?;';
      $Rsc = Db::QryPrm($SQL, array($IA['ID']));

      if (empty($Rsc))
        return ReturnPack(-2, $Kw['RM']['DbCrash'], 0);

      $R = $Rsc->fetch(PDO::FETCH_NUM);

      return ReturnPack(0, $Kw['RM']['Done'], $R[0]);
    }

    $Lmt = (isset($IA['Lmt']) && is_numeric($IA['Lmt']) && $IA['Lmt'] > 0) ? (int)$IA['Lmt'] : -1;
    $Ofst = (isset($IA['Ofst']) && is_numeric($IA['Ofst']) && $IA['Ofst'] > 0) ? (int)$IA['Ofst'] : 0;
    $SQL = 'SELECT id AS ID, name AS Nm, datetime AS Dt, comment AS Cmt FROM BlogComment ' .
           "WHERE blog_id = ? ORDER BY Dt LIMIT $Lmt OFFSET $Ofst";
    $Rsc = Db::QryPrm($SQL, array($IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

    $CmtA = array(); // '$CmtA' =  Comment Array.

    while ($R = $Rsc->fetch())
      $CmtA[] = $R;

    return ReturnPack(0, $Kw['RM']['Done'], $CmtA);
  }

  /* leave a comment for a blog.
    '$IA' = Info Array, some case as '$_POST'.
      '$IA['Nm']' = Name.
      '$IA['Ml']' = E-Mail.
      '$IA['Cmt']' = Comment.
      '$IA['TgtID']' = Target blogl ID.
    Return: JSON string | result code. */
  public static function CommentLeave ($IA)
  {
    global $Kw;

    if (empty($IA) || !is_array($IA) || empty($IA['Nm']) || !is_string($IA['Nm']) ||
       empty($IA['Ml']) || !IsEMail($IA['Ml']) || empty($IA['Cmt']) || !is_string($IA['Cmt']) ||
       empty($IA['TgtID']) || !IsUUID($IA['TgtID']))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], -1);

    $ID = UUID(true);
    $IP = GetIP();
    $Cmt = trim($IA['Cmt']);

    $SQL = $SQL = 'INSERT INTO BlogComment (id, name, mail, ip, datetime, comment, blog_id) VALUES (?, ?, ?, ?, ?, ?, ?);';
    $Rsc = Db::QryPrm($SQL, array($ID, $IA['Nm'], $IA['Ml'], $IP, date('Y-m-d H:i:s'), $Cmt, $IA['TgtID']));

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], -2);

    $Lnk = WEBSITE_URL . 'zone.php?Blog=' . $IA['TgtID'];
    $Ctn = $IA['Nm'] . '(' . $IA['Ml'] . ") 在網誌留言：\n$Cmt\n\n網誌網址：\n$Lnk";

    $Rst = MailSend(ADMIN_ML, ADMIN_ML, '[網誌]有人留言囉~', $Ctn, '空域-系統管理員');
    $Rst = $Rst < 0 ? 1 : 0; // check if mail send OK.

    return ReturnPack($Rst, $Kw['RM']['Done'], $Rst);
  }

  /* delete some bad comment.
    '$IA' - Info Array, some case as '$_POST'.
      '$IA['ID']' = blog comment ID.
    Return: JSON string | 0 as OK < 0 as error. */
  public static function CommentDelete ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    $SQL = 'DELETE FROM BlogComment WHERE id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], -3);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }
}

class Message
{
  /* list messages.
    '$IA' = Info Array, some case as '$_POST'.
    Return: JSON string | message array. */
  public static function MessageList ($IA)
  {
    global $Kw;

    $Cnt = !empty($IA['Cnt']) ? true : false;

    if ($Cnt)
    {
      $SQL = "SELECT COUNT(id) FROM Message WHERE target IS NULL;";
      $Rsc = Db::Query($SQL);

      if (empty($Rsc))
        return ReturnPack(-1, $Kw['RM']['DbCrash'], array());

      $R = $Rsc->fetch(PDO::FETCH_NUM);

      return ReturnPack(0, $Kw['RM']['Done'], $R[0]);
    }

    $Lmt = (isset($IA['Lmt']) && is_numeric($IA['Lmt']) && $IA['Lmt'] > 0) ? (int)$IA['Lmt'] : -1;
    $Ofst = (isset($IA['Ofst']) && is_numeric($IA['Ofst']) && $IA['Ofst'] > 0) ? (int)$IA['Ofst'] : 0;
    $PsV0 = 'CASE WHEN ChnDt IS NULL THEN datetime ELSE ChnDt END AS ChnDt'; // '$PsV0' = Parse Value 0.
    $PsV1 = 'CASE WHEN ChnCnt IS NULL THEN 0 ELSE  ChnCnt END AS ChnCnt';
    $SbSQL = 'SELECT COUNT(id) AS ChnCnt, MAX(datetime) AS ChnDt, target AS ChnTgt FROM Message GROUP BY ChnTgt'; // 'SbSQL' = Sub SQL.
    $SQL = "SELECT id AS ID, name AS Nm, mail AS Ml, ip AS IP, datetime AS Dt, $PsV0, $PsV1, message AS Msg " .
           "FROM Message LEFT JOIN ($SbSQL) AS Chn ON Chn.ChnTgt = ID WHERE target IS NULL " .
           "ORDER BY ChnDt DESC LIMIT $Lmt OFFSET $Ofst;";
    $Rsc = Db::Query($SQL);

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

    $MsgA = array(); // '$MsgA' =  Message Array.

    while ($R = $Rsc->fetch())
      $MsgA[] = $R;

    return ReturnPack(0, $Kw['RM']['Done'], $MsgA);
  }

  public static function AdminList ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], array());

    $Cnt = !empty($IA['Cnt']) ? true : false;

    if ($Cnt)
    {
      $SQL = 'SELECT COUNT(id) FROM Message;';
      $Rsc = Db::Query($SQL);

      if (empty($Rsc))
        return ReturnPack(-1, $Kw['RM']['DbCrash'], array());

      $R = $Rsc->fetch(PDO::FETCH_NUM);

      return ReturnPack(0, $Kw['RM']['Done'], $R[0]);
    }

    $Lmt = (isset($IA['Lmt']) && is_numeric($IA['Lmt']) && $IA['Lmt'] > 0) ? (int)$IA['Lmt'] : -1;
    $Ofst = (isset($IA['Ofst']) && is_numeric($IA['Ofst']) && $IA['Ofst'] > 0) ? (int)$IA['Ofst'] : 0;
    $SQL = 'SELECT id AS ID, name AS Nm, mail AS Ml, ip AS IP, datetime AS Dt, message AS Msg, target AS Tgt ' .
           "FROM Message ORDER BY Dt DESC LIMIT $Lmt OFFSET $Ofst;";
    $Rsc = Db::Query($SQL);

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

    $Rst = array();

    while ($R = $Rsc->fetch())
      $Rst[] = $R;

    return ReturnPack(0, $Kw['RM']['Done'], $Rst);
  }

  /* leave a message.
    '$IA' = Info Array, some case as '$_POST'.
    Return: JSON string | result code. */
  public static function Leave ($IA)
  {
    global $Kw;

    if (empty($IA) || empty($IA['Nm']) || !is_string($IA['Nm']) || empty($IA['Ml']) || !IsEMail($IA['Ml']) ||
       empty($IA['Msg']) || !is_string($IA['Msg']) || (isset($IA['Tgt']) && !IsUUID($IA['Tgt'])))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], -1);

    $ID = UUID(true);
    $Nm = $IA['Nm'];
    $Ml = $IA['Ml'];
    $IP = GetIP();
    $Msg = trim($IA['Msg']);
    $Rsc = null;

    if (isset($IA['Tgt']))
    {
      $SQL = $SQL = 'INSERT INTO Message (id, name, mail, ip, datetime, message, target) VALUES (?, ?, ?, ?, ?, ?, ?);';
      $Rsc = Db::QryPrm($SQL, array($ID, $Nm, $Ml, $IP, date('Y-m-d H:i:s'), $Msg, $IA['Tgt']));
    }
    else
    {
      $SQL = 'INSERT INTO Message (id, name, mail, ip, datetime, message) VALUES (?, ?, ?, ?, ?, ?);';
      $Rsc = Db::QryPrm($SQL, array($ID, $Nm, $Ml, $IP, date('Y-m-d H:i:s'), $Msg));
    }

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], -2);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  public static function ChainList ($IA)
  {
    global $Kw;

    if (empty($IA) || empty($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], array());

    $Cnt = !empty($IA['Cnt']) ? true : false;

    if ($Cnt)
    {
      $SQL = 'SELECT COUNT(id) FROM Message WHERE target = \'' . $IA['ID'] . '\';';
      $Rsc = Db::Query($SQL);

      if (empty($Rsc))
        return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

      $R = $Rsc->fetch(PDO::FETCH_NUM);

      return ReturnPack(0, $Kw['RM']['Done'], $R[0]);
    }

    $Lmt = (isset($IA['Lmt']) && is_numeric($IA['Lmt']) && $IA['Lmt'] > 0) ? (int)$IA['Lmt'] : -1;
    $Ofst = (isset($IA['Ofst']) && is_numeric($IA['Ofst']) && $IA['Ofst'] > 0) ? (int)$IA['Ofst'] : 0;
    $SQL = 'SELECT id AS ID, name AS Nm, datetime AS Dt, message AS Msg FROM Message WHERE target = \'' . $IA['ID'] .
           "' ORDER BY Dt LIMIT $Lmt OFFSET $Ofst;";
    $Rsc = Db::Query($SQL);

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], array());

    $Rst = array();

    while ($R = $Rsc->fetch())
      $Rst[] = $R;

    return ReturnPack(0, $Kw['RM']['Done'], $Rst);
  }

  public static function Delete ($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin']);

    if (empty($IA['ID']) || !IsUUID($IA['ID']))
     return ReturnPack(-2, $Kw['RM']['StrangeValue']);

    $SQL = 'DELETE FROM Message WHERE id = ? OR target = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['ID'], $IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash']);

    return ReturnPack(0, $Kw['RM']['Done']);
  }
}

class GoodWords
{
  /* list good words.
    '$IA' = Info Array, some case as '$_POST'.
    Return: JSON string | message array. */
  public static function WordsList($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    $Cnt = !empty($IA['Cnt']) ? true : false;

    if ($Cnt)
    {
      $SQL = "SELECT COUNT(id) FROM GoodWords;";
      $Rsc = Db::Query($SQL);

      if (empty($Rsc))
        return ReturnPack(-2, $Kw['RM']['DbCrash'], array());

      $R = $Rsc->fetch(PDO::FETCH_NUM);

      return ReturnPack(0, $Kw['RM']['Done'], $R[0]);
    }

    $Lmt = (isset($IA['Lmt']) && is_numeric($IA['Lmt']) && $IA['Lmt'] > 0) ? (int)$IA['Lmt'] : -1;
    $Ofst = (isset($IA['Ofst']) && is_numeric($IA['Ofst']) && $IA['Ofst'] > 0) ? (int)$IA['Ofst'] : 0;
    $SQL = "SELECT id AS ID, words AS Wds, datetime AS Dt FROM GoodWords ORDER BY Dt DESC LIMIT $Lmt OFFSET $Ofst;";
    $Rsc = Db::Query($SQL);

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], array());

    $WdsA = array(); // 'WdsA' = Words Array.

    while ($R = $Rsc->fetch())
      $WdsA[] = $R;

    return ReturnPack(0, $Kw['RM']['Done'], $WdsA);
  }

  /* create a new GoodWords.
    '$IA' = Info Array. often as '$_POST'.
    Return: JSON string. | 0 as OK, or < 0 error. */
  public static function Create($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA) || empty($IA['Wds']) || !is_string($IA['Wds']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    $Wds = trim($IA['Wds']);

    if (empty($Wds))
      return ReturnPack(-3, $Kw['RM']['StrangeValue'], -3);

    $SHA1 = sha1($Wds);

    if (Db::IsARowExist('GoodWords', 'sha1', $SHA1))
      return ReturnPack(-4, $Kw['RM']['DuplicateData'], -4);

    $SQL = 'INSERT INTO GoodWords (id, words, sha1, datetime) VALUES (?, ?, ?, ?);';
    $ID = UUID(true);
    $Rsc = Db::QryPrm($SQL, array($ID, $Wds, $SHA1, date('Y-m-d H:i:s')));

    if (empty($Rsc))
      return ReturnPack(-5, $Kw['RM']['DbCrash'], -5);

    return ReturnPack(0, $Kw['RM']['Done'], $ID);
  }

  /* update a GoodWords.
    '$IA' = Info Array. often as '$_POST'.
      '$IA['ID']' = ID of good words.
      '$IA['Wds']' = updated string of good words.
    Return: JSON string. | 0 as OK, or < 0 error. */
  public static function Update($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA) || empty($IA['ID']) || !IsUUID($IA['ID']) || empty($IA['Wds']) || !is_string($IA['Wds']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    $SHA1 = sha1($IA['Wds']);
    $SQL = 'UPDATE GoodWords SET words = ?, sha1 = ? WHERE id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['Wds'], $SHA1, $IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], -3);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  /* delete a GoodWords.
    '$IA' = Info Array. often as '$_POST'.
      '$IA['ID']' = ID of good words.
    Return: JSON string. | 0 as OK, or < 0 error. */
  public static function Delete($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA) || empty($IA['ID']) || !IsUUID($IA['ID']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    $SQL = 'DELETE FROM GoodWords WHERE id = ?;';
    $Rsc = Db::QryPrm($SQL, array($IA['ID']));

    if (empty($Rsc))
      return ReturnPack(-3, $Kw['RM']['DbCrash'], -3);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }

  /* get the now GoodWords.
    Return: JSON string. | 0 as OK, or < 0 error. */
  public static function NowOneGet()
  {
    global $Kw;

    $Ttl = Db::TableRows('GoodWords');

    if ($Ttl < 0)
      return ReturnPack(-1, $Kw['RM']['NoSuchData'], $Ttl);

    $Idx = (time() / 3600) % $Ttl;
    $SQL = "SELECT id AS ID, words AS Wds FROM GoodWords LIMIT $Idx, 1;";
    $Rsc = Db::Query($SQL);

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], -2);

    $R = $Rsc->fetch();

    return ReturnPack(0, $Kw['RM']['Done'], $R);
  }
}

class ArtCorner
{
  public static function ArtCornerList()
  {
  }

  /* Get One Random ArtCorner info.
    Return: JSON | info array of an ArtCorner, or empty array as error.
    Need: pear/archive_tar. */
  public static function RandomOneGet()
  {
    global $Kw;

    $DP = DAT_PTH . 'artcorner/';
    $FA = array_values(preg_grep('/\.tar$/', scandir($DP)));
    $FN = $FA[array_rand($FA)];
    $Tar = new Archive_Tar($DP . $FN);
    $FA = $Tar->listContent();

    if (empty($FA) || count($FA) < 2 || ($FA[0]['filename'] !== 'info.xml' && $FA[1]['filename'] !== 'info.xml'))
      return ReturnPack(-1, $Kw['RM']['SystemError'], array());
    unset($FA);

    $SX = simplexml_load_string($Tar->extractInString('info.xml'));

    if ($SX === false)
     return ReturnPack(-2, $Kw['RM']['SystemError'], array());

    $Info = array('Ttl' => $SX->Title . '', 'Atr' => $SX->Author . '',  'Dt' => $SX->Datetime . '',
                  'Cmt' => $SX->Comment . '',
                  'ImgURL' => "img.php?A=" . StringEnDeCode($FN) . "&FN=" . StringEnDeCode($SX->File . ''));

    System::ImagesCacheFromTar($DP . $FN, $Tar);

    return ReturnPack(0, $Kw['RM']['Done'], $Info);
  }

  /* create a new ArtCorner.
    '$IA' = Info Array. often as '$_POST'.
    '$FA' = File info Array. must be'$_FILES'.
    Return: JSON string. | 0 as OK, or < 0 error.
    Need: pear/archive_tar. */
  public static function Create($IA, $FA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA) || empty($IA['Atr']) || !is_string($IA['Atr']) || empty($IA['Ml']) || !IsEMail($IA['Ml']) ||
       empty($IA['Dt']) || !IsTimeStamp($IA['Dt']) || empty($FA) || empty($FA['Img']))
      return ReturnPack(-2, $Kw['RM']['StrangeValue'], -2);

    if (empty($FA['Img']['name']) || $FA['Img']['error'] != 0 || $FA['Img']['size'] > 1048576 ||
       ($FA['Img']['type'] != 'image/png' && $FA['Img']['type'] != 'image/jpeg'))
      return ReturnPack(-3, $Kw['RM']['StrangeValue'], -3);

    $TTA = explode(' ', microtime()); // '$TTA' = Temp Time Array.
    $DtStr = date('YmdHis', $TTA[1]); // '$DdStr' = Datetime String.
    $DirPth = DAT_PTH . 'artcorner/' . $DtStr . substr($TTA[0], 2, 3) . '/';
    $ImgPth = $DirPth . $FA['Img']['name'];
    $InfoPth = $DirPth . 'info.xml';

    unset($TTA);

    if (!is_dir($DirPth))
    {
      if (!mkdir($DirPth, 0755))
        return ReturnPack(-4, $Kw['RM']['SystemError'], -4);

      usleep(100000);
    }

    if (!move_uploaded_file($FA['Img']['tmp_name'], $ImgPth))
      return ReturnPack(-5, $Kw['RM']['SystemError'], -5);

    // '$XTS' = XML Template String.
    $XTS = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<ArtCorner>
  <Title/>
  <File/>
  <Author/>
  <EMail/>
  <IP/>
  <Datetime/>
  <Comment/>
</ArtCorner>
XML;

    $SX = simplexml_load_string($XTS);
    $SX->Title = !empty($IA['Ttl']) && is_string($IA['Ttl']) ? trim($IA['Ttl']) : '';
    $SX->File = $FA['Img']['name'];
    $SX->Author = $IA['Atr'];
    $SX->EMail = $IA['Ml'];
    $SX->IP = GetIP();
    $SX->Datetime = $IA['Dt'];
    $SX->Comment = (isset($IA['Cmt']) && is_string($IA['Cmt'])) ? substr($IA['Cmt'], 0, 256) : '';

    if (!$SX->asXML($InfoPth))
      return ReturnPack(-6, $Kw['RM']['SystemError'], -6);

    $Tar = new Archive_Tar(DAT_PTH . "artcorner/$DtStr.tar");

    if (!$Tar->createModify(array($ImgPth, $InfoPth), '', $DirPth))
      return ReturnPack(-7, $Kw['RM']['SystemError'], -7);

    unlink($ImgPth);
    unlink($InfoPth);
    rmdir($DirPth);

    return ReturnPack(0, $Kw['RM']['Done'], 0);
  }
}

class Admin
{
  public static $Pswd = ADMIN_PSWD;
  public static $PswdSsnNm = 'AdminPswd';
  public static $WbstFdFlNm = 'feed.xml';

  /* clear old files which were created in server file cache mechanism.
    '$IA' = Info Array, often link '$_POST'.
    Return: JSON string | number of file removed, < 0 as error. */
  public static function CacheClear($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(self::$Pswd, self::$PswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    if (empty($IA) || !is_array($IA) || empty($IA['Scd']) || !is_numeric($IA['Scd']) || $IA['Scd'] < 0)
      return ReturnPack(-1, $Kw['RM']['StrangeValue'], -2);

    $DP = CCH_PTH; // '$DP' = Directory Path.
    $FNA = scandir(CCH_PTH, 0); // '$FNA' = File Name Array.
    $FNA = array_slice($FNA, 2);
    $CT = time() - $IA['Scd']; // '$CT' = Check Time.
    $C = 0;

    foreach($FNA as $V)
    {
      $TP = $DP . $V;

      if (fileatime($TP) < $CT)
      {
        if (unlink($TP))
          $C++;
      }
    }

    return ReturnPack(0, $Kw['RM']['Done'], $C);
  }

  /* calculate and list each directory used size of system.
    '$IA' = Info Array, often link '$_POST'.
    Return: JSON string | info array, or empty array as error. */
  public static function SizeUsedList($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(self::$Pswd, self::$PswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], array());

    $DPA = FileList(DAT_PTH, 2);
    $InfoA = array();

    sort($DPA);

    if (empty($DPA))
      return ReturnPack(-2, $Kw['RM']['SystemError'], array());

    foreach($DPA as $V)
    {
      $DIA = array($V, 0); // '$DIA' = Directory Info Array.
      $FNA = array_slice(scandir($V, 0), 2);

      foreach($FNA as $V1)
      {
        $FP = $V . $V1;

        if (!is_file($FP))
          continue;

        $DIA[1] += filesize($FP);
      }

      $InfoA[] = $DIA;
    }

    foreach($InfoA as $V)
    {
      $DP = dirname($V[0]) . '/';

      foreach($InfoA as $K1 => $V1)
      {
        if ($DP == $V1[0])
          $InfoA[$K1][1] += $V[1];
      }
    }

    $L = strlen(WEB_PTH);

    foreach($InfoA as $K => $V)
      $InfoA[$K][0] = substr($InfoA[$K][0], $L);

    return ReturnPack(0, $Kw['RM']['Done'], $InfoA);
  }

  /* publish feed of website status.
    '$IA' = Info Array, often link '$_POST'.
    Return: JSON string | new datetime string as OK, '' as error. */
  public static function FeedPublish($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], '');

    $FlPth = DAT_PTH . self::$WbstFdFlNm;
    $SQL = 'SELECT id AS ID, title AS Ttl, summary as Smry, datetime AS Dt FROM Blog WHERE password = \'\' ORDER BY Dt DESC LIMIT 10;';
    $Rsc = Db::Query($SQL);

    if (empty($Rsc))
      return ReturnPack(-2, $Kw['RM']['DbCrash'], '');

    $BlogA = array();
    $IDA = array();

    while ($R = $Rsc->fetch())
    {
      $IDA[] = $R['ID'];
      $R['URL'] = WEBSITE_URL . 'zone.php?Blog=' . $R['ID'];
      $R['Tg'] = '';
      $BlogA[] = $R;
    }

    if (!empty($IDA))
    {
      $SQL0 = '\'' . implode('\', \'', $IDA) . '\'';
      $SQL = 'SELECT Tag.name AS Nm, TagLink.link_id AS TgtID FROM Tag, TagLink ' .
             "WHERE Tag.id = TagLink.tag_id AND TagLink.link_id IN ($SQL0);";
      $Rsc = Db::Query($SQL);

      if (empty($Rsc))
        return ReturnPack(-3, $Kw['RM']['DbCrash'], '');

      while ($R = $Rsc->fetch())
      {
        foreach($BlogA as $K => $V)
        {
          if ($V['ID'] == $R['TgtID'])
          {
            $BlogA[$K]['Tg'] .= $R['Nm'] . ' ';
            break;
          }
        }
      }
    }

     // '$BXS' = Basic XML String.
    $BXS = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>?1?</title>
<subtitle>?2?</subtitle>
<link rel="self" href="?3?"/>
<link rel="alternate" type="text/html" href="?3?"/>
<id>urn:uuid:28b28433-3f00-4a88-96ae-86bcc7fe16ae</id>
<updated>?4?</updated>
</feed>
XML;

    $DtStr = str_replace(' ', 'T', date('Y-m-d H:i:s')) . 'Z';
    $VA = array(WEBSITE, 'RZ 的發呆空間', WEBSITE_URL, $DtStr);
    $BXS = SymbolString($BXS, $VA);

    $SX = simplexml_load_string($BXS);

    unset($BXS, $VA);

    foreach($BlogA as $V)
    {
      $Ent = $SX->addChild('entry');
      $Ent->addChild('N');
      $Ent->addChild('title', $V['Ttl']);
      $Ent->addChild('N');
      $Ent->addChild('id', $V['ID']);
      $Ent->addChild('N');
      $Ent->addChild('updated', str_replace(' ', 'T', $V['Dt']) . 'Z');
      $Ent->addChild('N');

      if (empty($V['Smry']) || !is_string($V['Smry']))
        $Ent->addChild('summary', $V['Tg']);
      else
        $Ent->addChild('summary', $V['Smry']);

      $Ent->addChild('N');

      $Lnk = $Ent->addChild('link');
      $Lnk->addAttribute('href', $V['URL']);
      $Ent->addChild('N');

      $Lnk = $Ent->addChild('link');
      $Lnk->addAttribute('rel', 'alternate');
      $Lnk->addAttribute('type', 'text/html');
      $Lnk->addAttribute('href', $V['URL']);
      $Ent->addChild('N');

      $Autr = $Ent->addChild('author');
      $Autr->addChild('name', 'RZ');
      $Autr->addChild('email', ADMIN_ML);
      $Ent->addChild('N');

      $SX->addChild('N');
    }
    unset($BlogA);

    $RstStr = str_replace('<N/>', "\n", $SX->asXML());

    file_put_contents($FlPth, $RstStr, LOCK_EX);

    return ReturnPack(0, $Kw['RM']['Done'], date('Y-m-d H:i:s'));
  }

  /* switch error hint.
    '$IA' = Info Array, often link '$_POST'.
      '$IA['Flg']' = Flag to switch error hint.
    Return: JSON string | 0: now hide hint, 1: now show hint, < 0 as error. */
  public static function ErrorHintSwitch($IA)
  {
    global $Kw;

    if (!System::SessionIsLogin(System::$AdminPswd, System::$AdminPswdSsnNm))
      return ReturnPack(-1, $Kw['RM']['NotLogin'], -1);

    $Sw = (isset($IA['Flg']) && $IA['Flg'] == 0); // '$Sw' = Switch flag. if defined 'off', then make it on, make it off in other case.

    $_SESSION[SSN_ERR_HNT] = $Sw;

    return ReturnPack(0, $Kw['RM']['Done'], $_SESSION[SSN_ERR_HNT] ? 1 : 0);
  }
}

//======================================================================================================================
?>
