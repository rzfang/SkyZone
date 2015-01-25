<?php
header('Content-Type: text/html; charset=utf-8');

require('../../global.php');

$Cd = (!empty($_GET) && !empty($_GET['Cd']) && is_string($_GET['Cd'])) ? $_GET['Cd'] : '';
?>
<!DOCTYPE HTML>
<html>
  <head>
    <title>Upload File</title>
    <style type='text/css'>
    <!--
      table td:first-child { text-align: center; }
      input[type='file'],
      input[type='text'],
      progress
        { width: 300px; }
      .Block { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #c0c0c0; border-radius: 5px; }
    -->
    </style>
    <script type='text/javascript' src='../resource/jquery.min.js'></script>
    <script type='text/javascript'>
    <!--
      $(function()
        {
          $('#UpBtn').on('click', FileUpload);
        });

      function FileUpload(Evt)
      {
        var Fl = $('#Fl'),
            Cd = $('#Cd').val(),
            Pgs = $('#Pgs'),
            Btn = $('#UpBtn');

        if (Fl.val().length === 0)
        {
          alert('尚未選擇檔案。');

          return -1;
        }

        if (Cd.length === 0)
        {
          alert('尚未填寫驗證碼。');

          return -2;
        }

        var FmData = new FormData(),
            XHR = new XMLHttpRequest();

        FmData.append('MAX_FILE_SIZE', 52428800);
        FmData.append('Fl', Fl.get(0).files[0]);
        FmData.append('Cd', Cd);

        XHR.onreadystatechange = Then;
        XHR.upload.onprogress = function(Evt){ Pgs.val(Evt.loaded / Evt.total * 100); };
        XHR.open('POST', 'recieve.php');
        XHR.setRequestHeader('X-Requested-With', 'XMLHttpRequest'); // to use AJAX way.
        XHR.send(FmData);

        Btn.add(Fl).prop('disabled', true);

        return 0;

        function Then()
        {
          if (this.readyState !== 4)
          { return 0; }

          Btn.add(Fl).prop('disabled', false);

          if (this.status !== 200)
          {
            alert('上載發生錯誤。');

            return 0;
          }

          var Data = $.parseJSON(this.responseText);

          alert(Data.Message);

          if (Data.Index == 0)
          { Fl.val(''); }

          Pgs.val(0);
        }
      }
    -->
    </script>
  </head>
  <body style='margin: 10px auto; text-align: center;'>
    <div class='Block'>
      注意事項
      <ul style='text-align: left;'>
        <li style='color: #ff0000;'>不遵守以下規範也許還是可以上傳，<br/>不過會在辛苦上傳完成仍以失敗收場，請務必注意。</li>
        <li>本頁面不支援 IE8 以下瀏覽器。</li>
        <li>每個檔案不能超過 <?= ini_get('upload_max_filesize'); ?>。</li>
        <li>務必填寫正確的驗證碼。</li>
        <li>按下上傳按鈕後，請不要再繼續操作頁面，上傳完成時會有通知顯示。</li>
        <li>如果真的等太久，不想等了，直接關閉頁面即可，上傳中的檔案就會自動放棄掉了。</li>
      </ul>
      <div style='display: inline-block; text-align: left;'>
        <table>
        	<tbody>
        		<tr>
        			<td>檔案</td>
        			<td><input type='file' id='Fl'/></td>
        		</tr>
        		<tr>
        			<td>驗證碼</td>
        			<td><input type='text' id='Cd' value='<?= $Cd; ?>'/></td>
        		</tr>
        		<tr>
        			<td>上傳進度</td>
        			<td><progress id='Pgs' max='100' value='0'></progress></td>
        		</tr>
        	</tbody>
        </table>
        <div style='text-align: center;'>
          <input type='button' id='UpBtn' value='開始上傳'/>
        </div>
      </div>
    </div>
  </body>
</html>