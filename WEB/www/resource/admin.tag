<tags>
  <div>
    <input type='text' placeholder='在此輸入新的標籤名稱。' maxlength='16'>
    <button onclick={TagAdd}>增加新的標籤</button>
  </div>
  <ul>
    <li>
      <span>ID</span>
      <span>名稱</span>
    </li>
    <li each={Tgs}>
      <span>{ID}</span>
      <input placeholder='請輸入標籤名稱。' type='text' value={Nm}/>
      <button onclick={TagRename}>更名</button>
      <button onclick={TagDelete}>刪除</button>
    </li>
  </ul>
  <style scoped>
    :scope>ul { list-style-type: none; padding: 0; line-height: 1.5; }
    :scope li:hover { background-color: #c0e0ff; }
    :scope li>span { display: inline-block; min-width: 330px; padding: 3px; }
  </style>
  <script>
    this.Tgs = [];

    this.mixin('Z.RM');

    this.on('mount', () => {
      this.AJAX({
        URL: 'service.php',
        Mthd: 'POST',
        Data: { Cmd: 7 },
        Err: (Sts) => { alert('BG'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt);

          if (Rst.Index < 0) { return alert(Rst.Message); }

          this.update({ Tgs: Rst.Extend });
        }
      });
    });

    Trim (Str) {
      if (typeof Str !== 'string') { return ''; }

      return Str.replace(/^\s+|\s+$/g, '');
    }

    TagAdd (Evt) {
      let Nm = this.Trim(Evt.target.parentElement.querySelector('input').value);

      if (!Nm) {
        alert('尚未填寫標籤名字。');

        return -1;
      }

      for (let i = 0; i < this.Tgs.length; i++) {
        if (this.Tgs[i].Nm === Nm) {
          alert('這個標籤名稱已經在使用了。');

          return -2;
        }
      }

      this.AJAX({
        URL: 'service.php',
        Mthd: 'POST',
        Data: { Cmd: 113, Nm },
        Err: (Sts) => { alert('BG'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt);

          alert(Rst.Message);

          if (Rst.Index > -1) {
            this.Tgs.push({ ID: Rst.Extend, Nm });
            this.update();
            this.BlogListFresh();
          }
        }
      });
    }

    TagRename (Evt) {
      let ID = Evt.item.ID,
          Nm = this.Trim(Evt.target.parentElement.querySelector('input').value);

      if (!Nm) {
        alert('名稱不能為空白。');

        return -1;
      }

      this.AJAX({
        URL: 'service.php',
        Mthd: 'POST',
        Data: { Cmd: 118, ID, Nm },
        Err: (Sts) => { alert('BG'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt);

          alert(Rst.Message);

          this.BlogListFresh();
        }
      });
    }

    TagDelete (Evt) {
      this.AJAX({
        URL: 'service.php',
        Mthd: 'POST',
        Data: { Cmd: 114, ID: Evt.item.ID },
        Err: (Sts) => { alert('BG'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt);

          alert(Rst.Message);

          this.Tgs.splice(this.Tgs.indexOf(Evt.item), 1);
          this.update();
          this.BlogListFresh();
        }
      });
    }

    BlogListFresh () {
      var BlogLstBx = $('#BlogLstBx');

      if (BlogLstBx.children('.OneBlog').length > 0)
      { BlogLstBx.get(0).PageGet(); }
    }
  </script>
</tags>
