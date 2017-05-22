<list-index>
  <div>
    <button each={Pgs} onclick={parent.PageTurn} value={Pg} disabled={Pg === parent.opts.pg}>{Shw}</button>
  </div>
  <style scoped>
    :scope>div { text-align: center; }
    :scope>div>button { min-width: 50px; margin: 0; padding: 0; }
  </style>
  <script>
    this.Pgs = [];

    this.on(
      'update',
      () => {

        console.log('---- call twice, should improve. ----');

        let LstPg = Math.ceil(this.opts.cnt / this.opts.lmt), // last page.
            Rng = 3,
            Pgs = [],
            Lth,
            i, j;

        if ((Rng * 2) + 1 > LstPg) {
          for (i = 1; i <= LstPg; i++) { Pgs.push({ Pg: i, Shw: i.toString() }); }

          this.Pgs = Pgs;

          return;
        }

        i = this.opts.pg - Rng;
        j = this.opts.pg + Rng;

        if (i < 1) {
          j += (1 - i);
          i = 1;
        }

        if (j > LstPg) {
          i -= j - LstPg;
          j = LstPg;
        }

        while (i <= j) {
          Pgs.push({ Pg: i, Shw: i.toString() });

          i++;
        }

        this.Pgs = Pgs;
      });

    PageTurn (Evt) {
      let TgtPg = parseInt(Evt.target.value, 10);

      if (TgtPg === this.opts.pg) { return -1; }

      this.opts.pageturn(Evt, TgtPg);
    }
  </script>
</list-index>

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
          this.ServiceUpdate('TAGS', Rst.Extend);
        }
      });
    });

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
            this.ServiceUpdate('TAGS', this.Tgs);
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

          for (var i = 0; i < this.Tgs.length; i++) {
            if (this.Tgs[i].ID === ID) {
              this.Tgs[i].Nm = Nm;

              break;
            }
          }

          this.ServiceUpdate('TAGS', this.Tgs);
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
          this.ServiceUpdate('TAGS', this.Tgs);
        }
      });
    }
  </script>
</tags>

<blogs>
  <ul>
    <li each={Itm, Idx in Blgs}>
      <table>
        <tbody ref='Blgs'>
          <tr>
            <td>檔名</td>
            <td>{Itm.Fl}</td>
            <td>標題</td>
            <td><input placeholder='尚未輸入標題。' type='text' value={Itm.Ttl}></td>
            <td rowspan='3'>
              簡述 <br>
              <textarea rows='3' placeholder='未輸入副標文字。'>{Itm.Smry}</textarea>
            </td>
            <td rowspan='3'>
              <button if={!Itm.ID} value={Idx} onclick={Create}>建立</button>
              <button if={Itm.ID} value={Idx} onclick={Update}>更新</button>
              <button if={Itm.ID} value={Idx} onclick={Delete}>刪除</button>
              <button if={Itm.ID && Itm.CmtCnt} value={Idx} onclick={CommentsToggle}>留言 ({Itm.CmtCnt})</button>
            </td>
          </tr>
          <tr>
            <td>ID</td>
            <td>{Itm.ID}</td>
            <td>日期</td>
            <td><input placeholder='請輸入日期時間。' type='date' value={Itm.Dt}></td>
          </tr>
          <tr>
            <td>類型</td>
            <td>
              <select value={Itm.Tp}>
                <option value='text'>text</option>
                <option value='image'>image</option>
                <option value='images'>images</option>
                <option value='html'>html</option>
                <option value='zft'>zft</option>
              </select>
            </td>
            <td>密碼</td>
            <td><input placeholder='未設定瀏覽密碼。' type='text' value={Itm.Pswd}></td>
          </tr>
          <tr>
            <td>標籤</td>
            <td colspan="4">
              <label each={parent.Tgs}>
                <input type="checkbox" value={ID} checked={TagCheck(ID, Itm.Tg)} />
                {Nm}
              </label>
            </td>
          </tr>
        </tbody>
      </table>
      <div if={Itm.ShwCmt}>
        <blog-comments blog-id={Itm.ID}/>
      </div>
    </li>
  </ul>
  <list-index cnt={Cnt} pg={Pg} lmt={Lmt} pageturn={PageTurn}/>
  <style scoped>
    :scope ul { margin: 0; padding: 0; }
    :scope li { list-style-type: none; margin: 0; padding: 10px 0; border-bottom: 1px solid #c0c0c0; }
    :scope li:last-child { border-width: 0; };
    :scope li:hover { background-color: #c0e0ff; }
    :scope tr:last-child label { display: inline-block; margin-right: 20px; }
    :scope td { vertical-align: top; }
    :scope td:nth-child(2) { min-width: 290px; };
    :scope td:nth-child(6)>button { display: block; };
  </style>
  <script>
    this.Blgs = [];
    this.Tgs = [];
    this.Lmt = 7;
    this.Cnt = 0;
    this.Pg = 1;

    this.mixin('Z.RM');

    this.on(
      'mount',
      () => {
        this.AJAX({
          URL: 'service.php',
          Mthd: 'POST',
          Data: { Cmd: 103, Cnt: 1 },
          Err: (Sts) => { alert('BG'); },
          OK: (RspnsTxt, Sts) => {
            let Rst = JSON.parse(RspnsTxt);

            if (Rst.Index < 0) { return alert(Rst.Message); }

            this.Cnt = Rst.Extend;

            this.PageTurn(null, 1);
          }});
      });

    this.ServiceListen('TAGS', (Rst) => {
      this.update({ Tgs: Rst });
    });

    TagCheck (ID, Tgs) {
      if (!Tgs || !Tgs.length) { return false; }

      for (var i = 0; i < Tgs.length; i++) {
        if (Tgs[i].ID === ID) { return true; }
      }

      return false;
    }

    PageTurn (Evt, Pg) {
      this.AJAX({
        URL: 'service.php',
        Mthd: 'POST',
        Data: { Cmd: 103, Lmt: this.Lmt, Ofst: this.Lmt * (Pg - 1) },
        Err: (Sts) => { alert('BG'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt);

          if (Rst.Index < 0) { return alert(Rst.Message); }

          this.update({ Blgs: Rst.Extend, Pg: Pg });
        }});
    }

    Update (Evt) {
      let RtNd = this.refs.Blgs[Evt.target.value],
          IptNds = RtNd.querySelectorAll('input[type=text],input[type=date]'),
          ChkBxNds = RtNd.querySelectorAll('input[type=checkbox]:checked'),
          Data = {
            ID: this.Trim(RtNd.querySelector('tr:nth-child(2)>td:nth-child(2)').innerHTML),
            Ttl: this.Trim(IptNds[0].value),
            Dt: this.Trim(IptNds[1].value),
            Pswd: this.Trim(IptNds[2].value),
            Tp: this.Trim(RtNd.querySelector('select').value),
            Smry: this.Trim(RtNd.querySelector('textarea').value),
            TgIDA: [] },
          ChkStr = '';

      for (var i = 0; i < ChkBxNds.length; i++) {
        Data.TgIDA.push(ChkBxNds[i].value);
      }

      if (Data.Ttl.length === 0) { ChkStr += "標題不能為空。\n"; }

      if (Data.Dt.length === 0) { ChkStr += "日期不能為空。\n"; }

      if (ChkStr.length > 0) {
        alert("請留意以下說明：\n" + ChkStr);

        return -1;
      }

      Data.Cmd = 105;

      this.AJAX({
        URL: 'service.php',
        Mthd: 'POST',
        Data: Data,
        Err: (Sts) => { alert('BG'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt);

          if (Rst.Index < 0) { return alert(Rst.Message); }
        }});
    }

    Create (Evt) {
      let RtNd = this.refs.Blgs[Evt.target.value],
          IptNds = RtNd.querySelectorAll('input[type=text],input[type=date]'),
          ChkBxNds = RtNd.querySelectorAll('input[type=checkbox]:checked'),
          Data = {
            Fl: this.Trim(RtNd.querySelector('tr:first-child>td:nth-child(2)').innerHTML),
            Ttl: this.Trim(IptNds[0].value),
            Dt: this.Trim(IptNds[1].value),
            Pswd: this.Trim(IptNds[2].value),
            Tp: this.Trim(RtNd.querySelector('select').value),
            Smry: this.Trim(RtNd.querySelector('textarea').value),
            TgIDA: [] },
          ChkStr = '';

      for (var i = 0; i < ChkBxNds.length; i++) {
        Data.TgIDA.push(ChkBxNds[i].value);
      }

      if (!Data.Ttl) { ChkStr += "標題不能為空。\n"; }

      if (!Data.Dt) { ChkStr += "日期不能為空。\n"; }

      if (!Data.Tp) { ChkStr += "未選擇類型。\n"; }

      if (ChkStr.length > 0) {
        alert("請留意以下說明：\n" + ChkStr);

        return -1;
      }

      Data.Cmd = 104;

      this.AJAX({
        URL: 'service.php',
        Mthd: 'POST',
        Data: Data,
        Err: (Sts) => { alert('BG'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt),
              Blg = this.Blgs[Evt.target.value];

          if (Rst.Index < 0) { return alert(Rst.Message); }

          Blg.ID = Rst.Extend;
          Blg.Ttl = Data.Ttl;
          Blg.Dt = Data.Dt;
          Blg.Pswd = Data.Pswd;
          Blg.Tp = Data.Tp;
          Blg.Smry = Data.Smry;

          for (var i = 0; i < Data.TgIDA.length; i++) {
            for (var j = 0; j < this.Tgs.length; j++) {
              if (Data.TgIDA[i] === this.Tgs[j].ID) {
                Blg.Tg.push(this.Tgs[j]);

                break;
              }
            }
          }

          this.update();
        }});
    }

    Delete (Evt) {
      let Blg = this.Blgs[Evt.target.value];

      if (Blg.ID.length < 13) { return alert('找不到正確的 Blog ID。'); }

      this.AJAX({
        URL: 'service.php',
        Mthd: 'POST',
        Data: { Cmd: 110, ID: Blg.ID },
        Err: (Sts) => { alert('BG'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt);

          if (Rst.Index < 0) { return alert(Rst.Message); }

          Blg.ID = '';
          Blg.Ttl = '';
          Blg.Tp = '';
          Blg.Dt = '';
          Blg.Pswd = '';
          Blg.Smry = '';
          Blg.CmtCnt = 0;
          Blg.Tg = [];

          this.update();
        }});
    }

    CommentsToggle (Evt) {
      let Blg = this.Blgs[Evt.target.value];

      Blg.ShwCmt = true;

      this.update();
    }
  </script>
</blogs>

<blog-comments>
  <div>GJ</div>
  <script>
    this.on('update', () => {
      console.log('haha');
    });
  </script>
</blog-comments>