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
      this.ServiceCall(
        { Cmd: 7 },
        'TAGS',
        (Sto, Rst) => {
          if (Rst.Index < 0) {
            alert(Rst.Message);

            return Sto;
          }

          return Rst.Extend;
        });
    });

    this.ServiceListen('TAGS', (Sto) => {
      this.update({ Tgs: Sto });
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

      this.ServiceCall(
        { Cmd: 113, Nm },
        'TAGS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index > -1) { Sto.push({ ID: Rst.Extend, Nm }); }

          return Sto;
        });
    }

    TagRename (Evt) {
      let ID = Evt.item.ID,
          Nm = this.Trim(Evt.target.parentElement.querySelector('input').value);

      if (!Nm) {
        alert('名稱不能為空白。');

        return -1;
      }

      this.ServiceCall(
        { Cmd: 118, ID, Nm },
        'TAGS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index > -1) {
            for (let i = 0; i < Sto.length; i++) {
              if (Sto[i].ID === ID) {
                Sto[i].Nm = Nm;

                break;
              }
            }
          }

          return Sto;
        });
    }

    TagDelete (Evt) {
      this.ServiceCall(
        { Cmd: 114, ID: Evt.item.ID },
        'TAGS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index > -1) {
            for (let i = 0; i < Sto.length; i++) {
              if (Sto[i].ID === Evt.item.ID) {
                Sto.splice(i, 1);

                break;
              }
            }
          }

          return Sto;
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
                <input type="checkbox" value={ID} checked={TagCheck(ID, Itm.Tg)}/>
                {Nm}
              </label>
            </td>
          </tr>
        </tbody>
      </table>
      <div if={Itm.ShwCmt}>
        <blog-comments blg-id={Itm.ID} cmts={Itm.Cmts} remove={CommentRemove}/>
      </div>
    </li>
  </ul>
  <list-index cnt={Cnt} pg={Pg} lmt={Lmt} pageturn={PageTurn}/>
  <style scoped>
    :scope>ul { margin: 0; padding: 0; }
    :scope>ul>li { list-style-type: none; margin: 0; padding: 10px 0; border-bottom: 1px solid #c0c0c0; }
    :scope>ul>li:last-child { border-width: 0; }
    :scope tr:last-child label { display: inline-block; margin-right: 20px; }
    :scope td { vertical-align: top; }
    :scope td:nth-child(2) { min-width: 290px; }
    :scope td:nth-child(6)>button { display: block; }
  </style>
  <script>
    this.Blgs = [];
    this.Tgs = [];
    this.Lmt = 5;
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

    this.ServiceListen('TAGS', (Sto) => {
      this.update({ Tgs: Sto });
    });

    this.ServiceListen('BLOGS', (Sto, TskPrms) => {
      this.update({ Blgs: Sto, Pg: TskPrms && TskPrms.Pg || this.Pg });
    });

    this.ServiceListen('BLOG_COMMENTS', (Sto, TskPrms) => {
      let Blg;

      if (!TskPrms.BlgId) { return -1; }

      for (let i = 0; i < this.Blgs.length; i++) {
        if (TskPrms.BlgId && this.Blgs[i].ID === TskPrms.BlgId) {
          Blg = this.Blgs[i];

          break;
        }
      }

      if (!Blg) { return -2; }

      if (Sto[Blg.ID]) {
        Blg.ShwCmt = true;
        Blg.Cmts = Sto[Blg.ID];
        Blg.CmtCnt = Blg.Cmts.length;
      }

      this.update();
    });

    TagCheck (ID, Tgs) {
      if (!Tgs || !Tgs.length) { return false; }

      for (var i = 0; i < Tgs.length; i++) {
        if (Tgs[i].ID === ID) { return true; }
      }

      return false;
    }

    PageTurn (Evt, Pg) {
      this.ServiceCall(
        { Cmd: 103, Lmt: this.Lmt, Ofst: this.Lmt * (Pg - 1) },
        'BLOGS',
        (Sto, Rst) => {
          if (Rst.Index > -1) { Sto = Rst.Extend; }

          return Sto;
        },
        { Pg: Pg });
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

      this.ServiceCall(
        Data,
        'BLOGS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index > -1) {
            for (let i = 0; i < Sto.length; i++) {
              if (Sto[i].ID === Data.ID) {
                Sto[i].Tp = Data.Tp;
                Sto[i].Ttl = Data.Ttl;
                Sto[i].Dt = Data.Dt;
                Sto[i].Pswd = Data.Pswd;
                Sto[i].Smry = Data.Smry;

                Sto[i].Tg = this.Tgs.filter((Tg) => {
                  for (let j = 0; j < Data.TgIDA.length; j++) {
                    if (Tg.ID === Data.TgIDA[j]) { return true; }
                  }

                  return false;
                });
              }
            }
          }

          return Sto;
        });
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

      for (let i = 0; i < ChkBxNds.length; i++) {
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

      this.ServiceCall(
        Data,
        'BLOGS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index > -1) {
            for(let i = 0; i < Sto.length; i++) {
              if (Sto[i].Fl === Data.Fl) {
                Sto[i].ID = Rst.Extend;
                Sto[i].Tp = Data.Tp;
                Sto[i].Ttl = Data.Ttl;
                Sto[i].Dt = Data.Dt;
                Sto[i].Pswd = Data.Pswd;
                Sto[i].Smry = Data.Smry;

                Sto[i].Tg = this.Tgs.filter((Tg) => {
                  for (let j = 0; j < Data.TgIDA.length; j++) {
                    if (Tg.ID === Data.TgIDA[j]) { return true; }
                  }

                  return false;
                });

                break;
              }
            }
          }

          return Sto;
        });
    }

    Delete (Evt) {
      let Blg = this.Blgs[Evt.target.value];

      if (Blg.ID.length < 13) { return alert('找不到正確的 Blog ID。'); }

      this.ServiceCall(
        { Cmd: 110, ID: Blg.ID },
        'BLOGS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index > -1) {
            for (let i = 0; i < Sto.length; i++) {
              if (Sto[i].ID === Blg.ID) {
                Sto[i].ID = '';
                Sto[i].Ttl = '';
                Sto[i].Tp = '';
                Sto[i].Dt = '';
                Sto[i].Pswd = '';
                Sto[i].Smry = '';
                Sto[i].Tg = [];
              }
            }
          }

          return Sto;
        });
    }

    CommentsToggle (Evt) {
      let Blg = this.Blgs[Evt.target.value];

      if (Blg.ShwCmt) {
        Blg.ShwCmt = false;

        return;
      }

      if (Blg.Cmts) {
        Blg.ShwCmt = true;

        this.update();

        return;
      }

      this.ServiceCall(
        { Cmd: 8, ID: Blg.ID },
        'BLOG_COMMENTS',
        (Sto, Rst) => {
          if (!Sto) { Sto = {}; }

          if (Rst.Index > -1) { Sto[Blg.ID] = Rst.Extend; }

          return Sto;
        },
        { BlgId: Blg.ID });
    }

    CommentRemove (BlgId, CmtId) {
      this.ServiceCall(
        { Cmd: 109, ID: CmtId },
        'BLOG_COMMENTS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index > -1 && Sto[BlgId] && Sto[BlgId].length) {
            let Cmts = Sto[BlgId];

            for (let i = 0; i < Cmts.length; i++) {
              if (Cmts[i].ID === CmtId) {
                Cmts.splice(i, 1);

                break;
              }
            }
          }

          return Sto;
        },
        { BlgId: BlgId });
    }
  </script>
</blogs>

<blog-comments>
  <ul>
    <li each={opts.cmts} id={ID}>
      <div>
        {Nm}<br/>
        {Dt}
      </div>
      <pre>{Cmt}</pre>
      <div>
        <button onclick={Remove}>刪除</button>
      </div>
    </li>
  </ul>
  <style scoped>
    :scope>ul { padding-left: 20px; }
    :scope>ul>li { display: flex; margin: 5px; border-top: 1px solid #c0c0c0; padding: 5px; }
    :scope>ul>li>div:first-child { flex: 0 0 200px; }
    :scope>ul>li>pre { flex: 1 0 0; margin: 0; }
  </style>
  <script>
    Remove (Evt) {
      Evt.item.ID && this.opts.remove && this.opts.remove(this.opts.blgId, Evt.item.ID);
    }
  </script>
</blog-comments>

<messages>
  <ul>
    <li each={Itm, Idx in Msgs}>
      <div>
        ID<br/>
        建立時間<br/>
        源訊息 ID
      </div>
      <div>
        {Itm.ID}<br/>
        {Itm.Dt}<br/>
        {Itm.Tgt}
      </div>
      <div>
        <textarea cols="30" rows="3">{Itm.Msg}</textarea>
      </div>
      <div>
        <button value={Idx} onclick={Delete}>刪除</button><br/>
        <span if={!Itm.Tgt}>(刪除整個留言串)</span>
      </div>
    </li>
  </ul>
  <list-index cnt={Cnt} pg={Pg} lmt={Lmt} pageturn={PageTurn}/>
  <style scoped>
    :scope>ul>li { display: flex; margin-bottom: 10px; }
    /*:scope>ul>li>div { flex: 0; }*/
    :scope>ul>li>div:first-child { flex: 0 0 80px; }
    :scope>ul>li>div:nth-child(2) { flex: 0 0 300px; }
    :scope>ul>li>div:nth-child(3) { flex: 0 0 370px; }
    :scope>ul>li>div:last-child { flex: 1; }
  </style>
  <script>
    this.Msgs = [];
    this.Lmt = 8;
    this.Cnt = 0;
    this.Pg = 1;

    this.mixin('Z.RM');

    this.on(
      'mount',
      () => {
        this.AJAX({
          URL: 'service.php',
          Mthd: 'POST',
          Data: { Cmd: 106, Cnt: 1 },
          Err: (Sts) => { alert('BG'); },
          OK: (RspnsTxt, Sts) => {
            let Rst = JSON.parse(RspnsTxt);

            if (Rst.Index < 0) { return alert(Rst.Message); }

            this.Cnt = Rst.Extend;

            this.PageTurn(null, 1);
          }});
      });

    this.ServiceListen('MESSAGES', (Sto, TskPrms) => {
      this.update({ Msgs: Sto, Pg: TskPrms && TskPrms.Pg || this.Pg });
    });

    PageTurn (Evt, Pg) {
      this.ServiceCall(
        { Cmd: 106, Lmt: this.Lmt, Ofst: this.Lmt * (Pg - 1) },
        'MESSAGES',
        (Sto, Rst) => {
          if (Rst.Index > -1) { Sto = Rst.Extend; }

          return Sto;
        },
        { Pg: Pg });
    }

    Delete (Evt) {
      let Msg = this.Msgs[Evt.target.value];

      this.ServiceCall(
        { Cmd: 107, ID: Msg.ID },
        'MESSAGES',
        (Sto, Rst) => {
          if (Rst.Index < 0) {
            alert(Rst.Message);

            return Sto;
          }

          Sto.splice(Evt.target.value, 1);

          this.Cnt -= 1;

          return Sto;
        });
    }
  </script>
</messages>

<good-words>
  <ul ref='GdWds'>
    <li>
        <textarea rows="3"></textarea>
        <div>
          <button value={Idx} onclick={Create}>新增</button>
        </div>
    </li>
    <li each={Itm, Idx in GdWds}>
        <textarea rows="3">{Itm.Wds}</textarea>
        <div>
          {Itm.ID}<br/>
          <button value={Idx} onclick={Update}>更新</button><br/>
          <button value={Idx} onclick={Delete}>刪除</button>
        </div>
    </li>
  </ul>
  <list-index cnt={Cnt} pg={Pg} lmt={Lmt} pageturn={PageTurn}/>
  <style scoped>
    :scope>ul { margin: 0; padding: 0; }
    :scope>ul>li { display: flex; margin-bottom: 10px; }
    :scope>ul>li>textarea { flex: 0 1 0; margin-right: 10px; }
    :scope>ul>li>div { flex: 1 0 0; }
  </style>
  <script>
    this.GdWds = [];
    this.Lmt = 8;
    this.Cnt = 0;
    this.Pg = 1;

    this.mixin('Z.RM');

    this.on(
      'mount',
      () => {
        this.AJAX({
          URL: 'service.php',
          Mthd: 'POST',
          Data: { Cmd: 119, Cnt: 1 },
          Err: (Sts) => { alert('BG'); },
          OK: (RspnsTxt, Sts) => {
            let Rst = JSON.parse(RspnsTxt);

            if (Rst.Index < 0) { return alert(Rst.Message); }

            this.Cnt = Rst.Extend;

            this.PageTurn(null, 1);
          }});
      });

    this.ServiceListen(
      'GOOD_WORDS',
      (Sto, TskPrms) => {
        this.update({ GdWds: Sto, Pg: TskPrms && TskPrms.Pg || this.Pg });
      });

    Create (Evt) {
      let WdsNd = this.refs.GdWds.querySelector('li:first-child>textarea');
          Wds = this.Trim(WdsNd.value);

      if (!Wds) {
        alert('尚未填寫佳言。');

        return -1;
      }

      this.ServiceCall(
        { Cmd: 120, Wds: Wds },
        'GOOD_WORDS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index > -1) {
            Sto.push({ ID: Rst.Extend, Wds });

            WdsNd.value = '';
            this.Cnt += 1;
          }

          return Sto;
        })
    }

    PageTurn (Evt, Pg) {
      this.ServiceCall(
        { Cmd: 119, Lmt: this.Lmt, Ofst: this.Lmt * (Pg - 1) },
        'GOOD_WORDS',
        (Sto, Rst) => {
          if (Rst.Index > -1) { Sto = Rst.Extend; }

          return Sto;
        },
        { Pg: Pg });
    }

    Update (Evt) {
      let Wds = this.refs.GdWds.querySelector('li:nth-child(' + (Evt.item.Idx + 1) + ')>textarea').value;

      if (this.Trim(Wds).length === 0) {
        alert('不能為空。');

        return -1;
      }

      this.ServiceCall(
        { Cmd: 122, ID: Evt.item.Itm.ID, Wds },
        'GOOD_WORDS',
        (Sto, Rst) => {
          alert(Rst.Message);

          return Sto;
        });
    }

    Delete (Evt) {
      let GdWd = this.GdWds[Evt.item.Idx];

      this.ServiceCall(
        { Cmd: 121, ID: Evt.item.Itm.ID },
        'GOOD_WORDS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index < 0) { return Sto; }

          Sto.splice(Evt.item.Idx, 1);

          this.Cnt -= 1;

          return Sto;
        });
    }
  </script>
</good-words>
