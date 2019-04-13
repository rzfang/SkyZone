<admin>
  <login if={!opts.IsLgd}/>
  <tabbox if={opts.IsLgd} tbs={Tbs}/>
  <script>
    const Dt2BlgMngr = { FdLstDt: this.opts.FdLstDt || '' }; // data to blog manager, feed last date.

    this.Tbs = [
      { Nm: '網誌管理', Cmpnt: 'blogs-manager', Dt: Dt2BlgMngr },
      { Nm: '留言管理', Cmpnt: 'messages' },
      { Nm: '佳言錄', Cmpnt: 'good-words' },
      { Nm: '角落藝廊管理', Cmpnt: '' },
      { Nm: '系統管理', Cmpnt: 'system' }
    ];
  </script>
</admin>

<login>
  <div>
    管理員工具<br/>
    密碼： <input ref='Pswd' type='password' id='Pswd' maxlength='16' placeholder='請輸入密碼。' onkeypress={Login}/>
    <input type='button' id='LgnBtn' value='登入' onclick={Login}/>
  </div>
  <style scoped>
    :scope>div { text-align: center; }
  </style>
  <script>
    this.mixin('Z.RM');

    Login (Evt) {
      if (!Is.Undefined(Evt.keyCode) && Evt.keyCode != 13) { return 0; }

      const Pswd = this.refs.Pswd.value;

      if (!Pswd) { return alert(this.Keyword('PasswordNeed')); }

      this.AJAX({
        URL: '/service/session/login',
        Mthd: 'POST',
        Data: { Pswd },
        Err: (Sts) => { alert('BG'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt);

          alert(Rst.Message);

          if (Rst.Index > -1) { window.location.reload(true); }
        }});
    }
  </script>
</login>

<!-- shared data to be a tag as a store. -->
<store-tags>
  <script>
    this.mixin('Z.RM');

    this.on('mount', () => {
      if (this.StoreGet('TAGS')) { return; }

      this.ServiceCall(
        '/service/tag/list',
        null,
        'TAGS',
        (Sto, Rst) => {
          if (Rst.Index < 0) {
            alert(Rst.Message);

            return Sto;
          }

          return Rst.Extend;
        });
    });
  </script>
</store-tags>

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
      // Evt && Evt.preventDefault();

      let TgtPg = parseInt(Evt.target.value, 10);

      if (TgtPg === this.opts.pg) { return -1; }

      this.opts.pageturn(Evt, TgtPg);
    }
  </script>
</list-index>

<blogs-manager>
  <tabbox tbs={Tbs}/>
  <script>
    const Dt2Fd = { FdLstDt: this.opts.FdLstDt || '' }; // data to feed.

    this.Tbs = [
      { Nm: '網誌上傳', Cmpnt: 'blog-uploader' },
      { Nm: '訂閱消息', Cmpnt: 'feed', Dt: Dt2Fd },
      { Nm: '網誌列表', Cmpnt: 'blogs', Dt: { IsPblshd: true }}, // IsPblshd = is published.
      { Nm: '未建立網誌', Cmpnt: 'blogs'},
      { Nm: '標籤管理', Cmpnt: 'tags' },
      { Nm: '相簿型網誌內容編輯器', Cmpnt: 'blog-album-editor' }
    ];
  </script>
</blogs-manager>

<!-- not finish. -->
<blog-uploader>
  <div>
    <div style='border-width: 1px;'>
      檔案格式說明
      <table>
        <tbody>
          <tr><th>類型</th><th>檔案格式</th><th>說明</th></tr>
          <tr>
            <td>Text<br/>ZFT</td>
            <td>文字檔</td>
            <td>任意檔名的純文字檔, *.txt</td>
          </tr>
          <tr>
            <td>Image</td>
            <td>Tar 打包檔<br/>├ 圖片檔<br/>└ comment.txt</td>
            <td>
              打包檔名稱不限。<br/>
              圖片檔名稱不限。<br/>
              comment.txt 內容為對圖片檔的說明。
            </td>
          </tr>
          <tr>
            <td>Images</td>
            <td>
              Tar 打包檔<br/>
              ├ 001.*<br/>
              ...<br/>
              ├ 999.*<br/>
              └ comment.txt<br/>
              ---- or ----<br/>
              Tar 打包檔<br/>
              ├ [圖檔名].*<br/>
              ...<br/>
              ├ [圖檔名].*<br/>
              └ comment.json<br/>
            </td>
            <td>
              打包檔名稱不限。<br/>
              001.* ~ 999.* 為圖片檔，呈現時將依檔名排序。<br/>comment.txt 內容為對圖片檔的說明。<br/>其中以 \n====\n 做為每張圖片說明的分隔。<br/>
              或是<br/>
              透過「相簿型網誌內容編輯器」產生說明文，<br/>存入名為 comment.json 的文字檔。<br/>然後將圖檔與文字檔一同打包。
            </td>
          </tr>
          <tr>
            <td>HTML</td>
            <td>(還在規畫)</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style='text-align: left;'>
      注意事項：
      <ul>
        <li>檔案最大限制 <?= ini_get('upload_max_filesize'); ?></li>
        <li>若檔名一樣，會直接覆蓋。</li>
        <li>上傳過程，請不要進行其它操作或是離開本頁。</li>
      </ul>
      <span class='TextTitle'>檔案</span>
      <input type='file' id='BlogFl'/><br/>
      <input type='button' id='BlogUpldBtn' value='上傳'/>
      <progress value='0' max='100'></progress><br/>
    </div>
  </div>
  <style scoped>
    :scope { text-align: center; }
    :scope>div { display: flex; }
    :scope>div>div { display: inline-block; flex-grow: 1; }
    th,td { border: 1px solid; padding: 5px; text-align: left; }
  </style>
</blog-uploader>

<feed>
  最後一次發佈消是在： <span>{FdLstDt}</span><br/>
  <button onclick={Publish}>更新網誌消息</button>
  <style scope>
    :scope { text-align: center; }
  </style>
  <script>
    this.mixin('Z.RM');

    this.FdLstDt = this.StoreGet('FEED_LAST_DATE') || this.opts.FdLstDt || '';

    this.StoreListen(
      'FEED_LAST_DATE',
      (Sto, Rst) => { if (Sto) { this.update({ FdLstDt: Sto }); }});

    Publish (Evt) {
      this.ServiceCall(
        '/service/feed/publish',
        null,
        'FEED_LAST_DATE',
        (Sto, Rst) => {
          if (Rst.Index < 0) {
            alert(Rst.Message);

            return null;
          }

          return Rst.Extend.replace('T', ' ').replace('Z', '');
        });
    }
  </script>
</feed>

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
  <store-tags/>
  <script>
    this.Tgs = [];

    this.mixin('Z.RM');

    this.StoreListen('TAGS', (Sto) => { this.update({ Tgs: Sto }); });

    TagAdd (Evt) {
      let Nm = Evt.target.parentElement.querySelector('input').value.trim();

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
        '/service/tag/add',
        { Nm },
        'TAGS',
        (Sto, Rst) => {
          alert(Rst.Message);

          if (Rst.Index > -1) { Sto.push({ ID: Rst.Extend, Nm }); }

          return Sto;
        });
    }

    TagRename (Evt) {
      let ID = Evt.item.ID,
          Nm = Evt.target.parentElement.querySelector('input').value.trim();

      if (!Nm) {
        alert('名稱不能為空白。');

        return -1;
      }

      this.ServiceCall(
        '/service/tag/rename',
        { ID, Nm },
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
        '/service/tag/delete',
        { ID: Evt.item.ID },
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

<!-- not finish. -->
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
            <td>
              <input placeholder='請輸入日期。' type='text' pattern='\d\{4\}-\d\{2\}-\d\{2\} \d\{2\}:\d\{2\}:\d\{2\}' value={Itm.Dt}>
            </td>
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
  <store-tags/>
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
        if (this.opts.IsPblshd) {
          this.AJAX({
            URL: '/service/blog/list/admin',
            Mthd: 'POST',
            Data: { Cnt: 1 },
            Err: (Sts) => { alert('BG'); },
            OK: (RspnsTxt, Sts) => {
              let Rst = JSON.parse(RspnsTxt);

              if (Rst.Index < 0) { return alert(Rst.Message); }

              this.Cnt = Rst.Extend;
              this.Lmt = 5;

              this.PageTurn(null, 1);
            }});

          return;
        }

        this.ServiceCall(
          '/service/blog/unpublished',
          {},
          'NON_BLOGS',
          (Sto, Rst) => {
            if (!Rst || !Is.Number(Rst.Index) || !Is.Array(Rst.Extend)) { return alert('something wrong!'); }

            if (Rst.Index < 0) { return alert(Rst.Message); }

            this.Cnt = Rst.Extend.length;

            return Rst.Extend;
          });
      });

    this.StoreListen('TAGS', (Sto) => { this.update({ Tgs: Sto }); });

    this.StoreListen(
      'BLOGS',
      (Sto, TskPrms) => {
        this.update({ Blgs: Sto, Pg: TskPrms && TskPrms.Pg || this.Pg });
      });

    this.StoreListen(
      'NON_BLOGS',
      (Sto, TskPrms) => {
        if (!Is.Array(Sto)) { return; }

        let Blgs = [];

        for (let i = 0; i < Sto.length; i++) {
          Blgs.push({
            Fl: Sto[i]
          });
        }

        const Lnth = Sto.length;

        this.update({ Blgs, Cnt: Lnth, Lmt: Lnth });
      });

    this.StoreListen(
      'BLOG_COMMENTS',
      (Sto, TskPrms) => {
        let Blg;

        if (!TskPrms || !TskPrms.BlgId) { return -1; }

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
        '/service/blog/list/admin',
        { Lmt: this.Lmt, Ofst: this.Lmt * (Pg - 1) },
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
            ID: RtNd.querySelector('tr:nth-child(2)>td:nth-child(2)').innerHTML.trim(),
            Ttl: IptNds[0].value.trim(),
            Dt: IptNds[1].value.trim(),
            Pswd: IptNds[2].value.trim(),
            Tp: RtNd.querySelector('select').value.trim(),
            Smry: RtNd.querySelector('textarea').value.trim(),
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
        '/service.php',
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
            Fl: RtNd.querySelector('tr:first-child>td:nth-child(2)').innerHTML.trim(),
            Ttl: IptNds[0].value.trim(),
            Dt: IptNds[1].value.trim(),
            Pswd: IptNds[2].value.trim(),
            Tp: RtNd.querySelector('select').value.trim(),
            Smry: RtNd.querySelector('textarea').value.trim(),
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
        '/service.php',
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
        '/service.php',
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

        return;
      }

      this.ServiceCall(
        '/service/comment/list',
        { ID: Blg.ID },
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
        '/service.php',
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

<!-- not finish. -->
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

<blog-album-editor>
  <div>
    挑選圖檔 <input type='file' multiple='true'/>
    <input type='button' value='檢視檔案' onclick={AlbumView}/>
  </div><hr/>
  <div>
    <div>
      整體排序 (還沒實作)
      <button>時間 新 > 舊</button>
      <button>時間 舊 > 新</button>
      <button>名稱 A > Z</button>
      <button>名稱 Z > A</button>
    </div>
    <div each={AbmEdtImgs} id={Id} class='Itm'>
      <img src='#'/><br>
      <div>
        <div>{Nm}</div>
        <div>{Dt}</div>
        <textarea cols='20' rows='3' placeholder='輸入文字或保留空白。'></textarea>
      </div>
    </div>
  </div>
  <hr/>
  <div>
    <input type='button' value='輸出內容' onclick={AlbumPrint}/><br/>
    <textarea cols='30' rows='5'>{AbmPckInfo}</textarea>
  </div>
  <style scoped>
    :scope>div { text-align: center; }
    :scope .Itm { display: inline-block; margin: 10px 5px; }
    :scope .Itm>div { display: inline-block; text-align: left; }
    :scope .Itm>img { max-width: 320px; max-height: 240px; }
  </style>
  <script>
    this.mixin('Z.RM');

    this.AbmEdtImgs = []; // album editing images.
    this.AbmPckInfo = ''; // album packed information.

    AlbumView (Evt) {
      const FlsBx = this.root.querySelector('input[type=file]') || null;

      if (!FlsBx) {
        alert('尚未選擇圖檔。');

        return -1;
      }

      const Fls = FlsBx.files;

      if (Fls.length === 0) {
        alert('尚未選擇圖檔。');

        return -2;
      }

      let Itms = [], // items.
          Hnt = ''; // hint.

      for (let i = 0; i < Fls.length; i++) {
        const Fl = Fls[i];

        if (Fl.type !== 'image/jpeg' && Fl.type !== 'image/png') {
          Hnt += '檔案 ' + Fl.name + ' 不是允許的圖檔，將被忽略。\n';

          continue;
        }

        const Id = 'AbmImg_' + i,
              FR = new FileReader();

        Itms.push({ Id, Nm: Fl.name, Dt: Second2Datetime(Fl.lastModified / 1000, 2) });

        FR.targetId = Id;
        FR.onloadend = function (Evt) {
          let Img = document.querySelector('#' + this.targetId + ' > img');

          if (!Img) { return; }

          Img.src = this.result;
        };

        FR.readAsDataURL(Fl);
      }

      this.AbmEdtImgs = Itms;
    }

    AlbumPrint (Evt) {
      const Itms = Array.from(this.root.querySelectorAll('div.Itm') || []),
            Info = Itms.map(Itm => {
              const [ Fl, Cmt ] = Itm.querySelectorAll('div>div:first-child,textarea');

              return { Fl: Fl.innerText, Cmt: Cmt.value };
            });

      this.AbmPckInfo = JSON.stringify(Info).replace(/,/g, ",\n").replace(/\[/g, "[\n");
    }
  </script>
</blog-album-editor>

<!-- not finish. -->
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
    :scope>ul>li>div:nth-child(2) { flex: 0 0 330px; }
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
      'before-mount',
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
          }});
      });

    this.on('mount', () => { this.PageTurn(null, 1); });

    this.StoreListen(
      'MESSAGES',
      (Sto, TskPrms) => {
        this.update({ Msgs: Sto, Pg: TskPrms && TskPrms.Pg || this.Pg });
      });

    PageTurn (Evt, Pg) {
      this.ServiceCall(
        '/service.php',
        { Cmd: 106, Lmt: this.Lmt, Ofst: this.Lmt * (Pg - 1) },
        'MESSAGES',
        (Sto, Rst) => {
          if (Rst.Index > -1) { Sto = Rst.Extend; }

          return Sto;
        },
        { Pg: Pg });
    }

    Delete (Evt) {
      Evt && Evt.preventDefault();

      let Msg = this.Msgs[Evt.target.value];

      this.ServiceCall(
        '/service.php',
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
          URL: '/service/words/list',
          Mthd: 'POST',
          Data: { Cnt: 1 },
          Err: Sts => { alert('BG'); },
          OK: (RspnsTxt, Sts) => {
            let Rst = JSON.parse(RspnsTxt);

            if (Rst.Index < 0) { return alert(Rst.Message); }

            this.Cnt = Rst.Extend;

            this.PageTurn(null, 1);
          }});
      });

    this.StoreListen(
      'GOOD_WORDS',
      (Sto, TskPrms) => { this.update({ GdWds: Sto, Pg: TskPrms && TskPrms.Pg || this.Pg }); });

    Create (Evt) {
      let WdsNd = this.refs.GdWds.querySelector('li:first-child>textarea');
          Wds = WdsNd.value.trim();

      if (!Wds) {
        alert('尚未填寫佳言。');

        return -1;
      }

      this.ServiceCall(
        '/service/words/create',
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
        '/service/words/list',
        { Lmt: this.Lmt, Ofst: this.Lmt * (Pg - 1) },
        'GOOD_WORDS',
        (Sto, Rst) => {
          if (Rst.Index > -1) { Sto = Rst.Extend; }

          return Sto;
        },
        { Pg: Pg });
    }

    Update (Evt) {
      let Wds = this.refs.GdWds.querySelector('li:nth-child(' + (Evt.item.Idx + 2) + ')>textarea').value.trim();

      if (Wds.length === 0) {
        alert('不能為空。');

        return -1;
      }

      this.ServiceCall(
        '/service/words/update',
        { ID: Evt.item.Itm.ID, Wds },
        'GOOD_WORDS',
        (Sto, Rst) => {
          alert(Rst.Message);

          return Sto;
        });
    }

    Delete (Evt) {
      let GdWd = this.GdWds[Evt.item.Idx];

      this.ServiceCall(
        '/service/words/delete',
        { ID: Evt.item.Itm.ID },
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

<system>
  <div>
    清理圖片 cache 舊資料
    <hr/>
    <input ref='TgtNbr' type='number' value='1' style='width: 80px;' placeholder='數字' onchange={DatetimeHint} />
    <select ref='TgtScd' onchange={DatetimeHint}>
      <option value='60'>分</option>
      <option value='3600'>時</option>
      <option value='86400'>日</option>
      <option value='604800'>週</option>
      <option value='2592000' selected='true'>月(30日)</option>
    </select><br/>
    {TgtDt} 以前<br/>
    <button onclick={Clean}>清理</button>
  </div>
  <div>
    系統資料夾結構使用量
    <hr/>
    <input type='button' value='檢視' onclick={SizeUsedList} /><br/>
    <ul>
      <li each={DtSzs}>
        <div>{Fl}</div>
        <div>{Sz}</div>
      </li>
    </ul>
  </div>
  <div>
    <input type='button' value='登出' onclick='Logout();'/>
  </div>
  <style scoped>
    :scope { display: flex; }
    :scope>div { flex-grow: 0; flex-basis: 245px; margin-right: 5px; border: 1px solid; border-radius: 3px; padding: 5px; }
    :scope>div>ul { list-style-type: none; margin: 0; padding: 0; }
    :scope>div>ul>li { display: flex; }
    :scope>div>ul>li>div:first-child { flex-grow: 1; flex-basis: 150px; }
    :scope>div>ul>li>div:last-child { flex-grow: 1; text-align: right; }
  </style>
  <script>
    this.TgtDt = '???'; // target datetime.
    this.DtSzs = [];

    this.mixin('Z.RM');

    this.on('mount', () => this.DatetimeHint());

    this.StoreListen('DATA_SIZE', (Sto, Rst) => {
      for (let i = 0; i < Sto.length; i++) {
        const { Sz = 0 } = Sto[i];

        if (Sz > 1048576) { // 1MB.
          Sto[i].Sz = parseInt(Sz / 1048576, 10).toString() + 'MB';
        }
        else if (Sz > 1024) { // 1KB.
          Sto[i].Sz = parseInt(Sz / 1024, 10).toString() + 'KB';
        }
      }

      this.update({ DtSzs: Sto });
    });

    DatetimeHint (Evt) {
      const TgtNbr = parseInt(this.refs.TgtNbr.value, 10), // target number.
            TgtScd = parseInt(this.refs.TgtScd.value, 10), // target seconds.
            TgtDt = new Date((new Date()).getTime() - (TgtNbr * TgtScd * 1000)); // target date.

      this.TgtDt = DatetimeFormat(TgtDt);

      if (!Evt || !Evt.target) { this.update(); }
    }

    Clean (Evt) {
      const TgtNbr = parseInt(this.refs.TgtNbr.value, 10),
            TgtScd = parseInt(this.refs.TgtScd.value, 10) // target seconds.

      this.AJAX({
        URL: '/service/cache/clean',
        Data: { Scd: TgtNbr * TgtScd },
        Mthd: 'POST',
        OK: (RspnsTxt, Sts, XHR) => {
          const Rst = JSON.parse(RspnsTxt);

          alert(Rst.Message + "\n共 " + Rst.Extend + ' 個檔案被刪除。');
        }});
    }

    SizeUsedList (Evt) {
      this.ServiceCall(
        '/service/data/size',
        null,
        'DATA_SIZE',
        (Sto, Rst) => {
          if (Rst.Index < 0) {
            alert(Rst.Message);

            return null;
          }

          return Rst.Extend;
        });
    }
  </script>
</system>
