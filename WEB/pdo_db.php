<?php
class Db
{
  /* class info.
    this class work with PDO.
    use this like use a namespace function.
    Author: RZ Fang.
    Last Version Date: 20130404. */

//==== Class Property ==================================================================================================

  // default database object.
  private static $Db0 = null; // '$Db0' = default MySQL Database object with PDO format.

//==== Class Method ====================================================================================================

  /* Connect to Database.
    '$Host' = Host name, maybe IP, or domain.
    '$DbNm' = Database Name.
    '$Usr' = User name to login to database.
    '$Pswd' = user Password to login to database.
    Return: PDO DB object, or null as error. */
  public static function Connect_MySQL ($Host, $DbNm, $Usr, $Pswd)
  {
    $CntInfo = "mysql:host=$Host;dbname=$DbNm;"; // '$CntInfo' = Connect Info string.
    $Db = null;

    try
    {
      $Db = new PDO($CntInfo, $Usr, $Pswd, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8';"));

      $Db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // set default fetch mode to be assoc.
    }
    catch (PDOException $Ex)
    {
      echo 'Connection failed: ' . $Ex->getMessage();
      return null;
    }

    return $Db;
  }

  /* Connect to SQLite database.
    '$FlPth' = sqlite Db File Path.
    Return: PDO Db object, or null as error. */
  public static function Connect_SQLite ($FlPth)
  {
    if (empty($FlPth) || !is_string($FlPth) || !is_file($FlPth))
      return null;

    $Db = null;

    try
    {
      $Db = new PDO("sqlite:$FlPth");

      $Db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // set default fetch mode to be assoc.
    }
    catch (PDOException $Ex)
    {
      echo 'Connect failed. ' . $Ex->getMessage();
      return null;
    }

    return $Db;
  }

  /* Execute SQL. this is useful for SQL are 'INSERT', 'UPDATE', 'DELETE'.
    '$SQL' = SQL command string.
    '$Db' = PDO Database object. give nothing to use default object.
    Return: number of affected rows. < 0 as error. */
  public static function Exec ($SQL, $Db = null)
  {
    if ($Db == null)
    {
      if (empty(self::$Db0) || !is_object(self::$Db0))
        return -1;

      $Db = self::$Db0;
    }

    if (empty($SQL) || !is_string($SQL) || empty($Db) || !is_object($Db))
      return -2;

    $Cnt = 0;

    try
    {
      $Cnt = $Db->exec($SQL);
    }
    catch (PDOException $Ex)
    {
      echo 'Connection failed: ' . $Ex->getMessage();
      return -3;
    }

    return $Cnt;
  }

  /* Query SQL.
    '$SQL' = SQL command string.
    '$Db' = PDO Database object. give nothing to use default object.
    Return: PDOStatement object, or null as error, */
  public static function Query ($SQL, $Db = null)
  {
    if ($Db == null)
    {
      if (empty(self::$Db0) || !is_object(self::$Db0))
        return null;

      $Db = self::$Db0;
    }

    if (empty($SQL) || !is_string($SQL) || empty($Db) || !is_object($Db))
      return null;

    $Rsc = null;

    try
    {
      $Rsc = $Db->query($SQL);
    }
    catch (PDOException $Ex)
    {
      echo 'Connection failed: ' . $Ex->getMessage();
      return null;
    }

    return $Rsc;
  }

  /* Query SQL with parsing Paramaters.
    '$SQL' = SQL command string.
    '$Prm' = Paramaters array.
    '$Db' = PDO Database object. give nothing to use default object.
    Return: PDOStatement object, or null as error, */
  public static function QryPrm ($SQL, $Prm, $Db = null)
  {
    if ($Db == null)
    {
      if (empty(self::$Db0) || !is_object(self::$Db0))
        return null;

      $Db = self::$Db0;
    }

    if (empty($SQL) || !is_string($SQL) || !is_array($Prm) || empty($Db) || !is_object($Db))
      return null;

    $Rsc = null;

    try
    {
      $Rsc = $Db->prepare($SQL);

      if (!$Rsc->execute($Prm))
        return null;
    }
    catch (PDOException $Ex)
    {
      echo 'Connection failed: ' . $Ex->getMessage();
      return null;
    }

    return $Rsc;
  }

  /* set Database to be transation mode.
    '$Cmd' = Command, should be 'BEGIN', 'COMMIT', 'ROLLBACK'.
    '$Db' = PDO Database object. give nothing to use default object.
    Return: 0 as OK, < 0 as error. */
  public static function Transaction ($Cmd, $Db = null)
  {
    if ($Db == null)
    {
      if (empty(self::$Db0) || !is_object(self::$Db0))
        return -1;

      $Db = self::$Db0;
    }

    if (empty($Db) || !is_object($Db) || empty($Cmd) || !is_string($Cmd))
      return -2;

    $TS = substr($Cmd, -1);

    if ($TS == ';')
      $Cmd = substr($Cmd, 0, -1);

    $Cmd = strtolower($Cmd);

    $Rst = -4;

    switch ($Cmd)
    {
      case 'begin':
        $Rst = $Db->beginTransaction() ? 0 : -3;
        break;

      case 'rollback':
        $Rst = $Db->rollBack() ? 0 : -3;
        break;

      case 'commit':
        $Rst = $Db->commit() ? 0 : -3;
        break;
    }

    return $Rst;
  }

  /* check if a row is exist in a table.
    '$Tbl' =  Table name.
    '$Fld' = Field name.
    '$V' = Value.
    '$Db' = PDO Database object. give nothing to use default object.
    Return: true | false, or false as error. */
  public static function IsARowExist($Tbl, $Fld, $V, $Db = null)
  {
    if (empty($Tbl) || !is_string($Tbl) || preg_match('/^[a-zA-Z0-9_-]+$/', $Tbl) === 0 ||
        empty($Fld) || !is_string($Fld) || preg_match('/^[a-zA-Z0-9_-]+$/', $Fld) === 0 ||
        !is_string($V) || strlen($V) == 0)
       return false;

    if ($Db == null)
    {
      if (empty(self::$Db0) || !is_object(self::$Db0))
        return false;

      $Db = self::$Db0;
    }

    $Rsc = null;

    try
    {
      $Rsc = $Db->prepare("SELECT COUNT($Fld) FROM $Tbl WHERE $Fld = ? LIMIT 1;");

      if (!$Rsc->execute(array($V)))
        return false;
    }
    catch (PDOException $Ex)
    {
      echo 'Connection failed: ' . $Ex->getMessage();
      return false;
    }

    $R = $Rsc->fetch(PDO::FETCH_NUM);

    return ($R[0] > 0);
  }

  /* check if a row is exist in a table.
    '$Tbl' =  Table name.
    '$Fld' = Field name. optional, default ''.
    '$VA' = Value Array. optional, default null.
    '$Db' = PDO Database object. give nothing to use default object.
    Return: nuumber of table rows, or < 0 as error. */
  public static function TableRows ($Tbl, $Fld = '', $VA = null, $Db = null)
  {
    if (empty($Tbl) || !is_string($Tbl) || preg_match('/^[a-zA-Z0-9_-]+$/', $Tbl) === 0)
       return -1;

    if ($Db == null)
    {
      if (empty(self::$Db0) || !is_object(self::$Db0))
        return -2;

      $Db = self::$Db0;
    }

    $CdnS = ''; // '$CdnS' = Condition String.

    if (!empty($Fld) && is_string($Fld))
    {
      if (empty($VA) || !is_array($VA))
        return -3;

      $TS = '';

      foreach($VA as $V0)
        $TS .= '?, ';

      $TS = substr($TS, 0, -2);
      $CdnS = "WHERE $Fld IN ($TS)";
    }

    $Rsc = null;

    try
    {
      if (empty($CdnS))
        $Rsc = $Db->query("SELECT COUNT(*) FROM $Tbl;");
      else
      {
        $Rsc = $Db->prepare("SELECT COUNT($Fld) FROM $Tbl $CdnS;");

        if (!$Rsc->execute($VA))
          return -4;
      }
    }
    catch (PDOException $Ex)
    {
      echo 'Connection failed: ' . $Ex->getMessage();
      return -5;
    }

    $R = $Rsc->fetch(PDO::FETCH_NUM);

    return $R[0];
  }

  /* Get some row data of a table by Random.
    '$Tbl' = Table,
    '$Nbr' = Number of data which is got. optional, default 1.
    '$Db' = PDO Database object. give nothing to use default object.
    Return: array data rows, or array() as error. */
  public static function RandomGet ($Tbl, $Nbr = 1, $Db = null)
  {
    if (empty($Tbl) || !is_string($Tbl) || preg_match('/^[a-zA-Z0-9_-]+$/', $Tbl) === 0 || !is_int($Nbr) || $Nbr < 1)
       return -1;

    if ($Db == null)
    {
      if (empty(self::$Db0) || !is_object(self::$Db0))
        return -2;

      $Db = self::$Db0;
    }

    $Rsc = null;

    try
    {
      $Rsc = $Db->query("SELECT * FROM $Tbl ORDER BY RANDOM() LIMIT $Nbr;");
    }
    catch (PDOException $Ex)
    {
      echo 'Connection failed: ' . $Ex->getMessage();
      return -3;
    }

    $RstA = array(); // '$RstA' = Result Array.

    while ($R = $Rsc->fetch())
      $RstA[] = $R;

    return $RstA;
  }

//==== Project Case Function ===========================================================================================

  /* Connect to default Db which infos defined in config file.
    Return: 0 as OK, < 0 as error.
    Need: defined DB_HOST, DB_NM, DB_USR, DB_PSWD in config file. */
  public static function Db0Connect ()
  {
    if (!defined('DB_PTH'))
      return -1;

    self::$Db0 = self::Connect_SQLite(DB_PTH);

    if (empty(self::$Db0))
      return -2;

    return 0;
  }
}
//======================================================================================================================
?>
