<messages>
  <ul>
    <li each={Msg, Idx in Lst}>
      <div>{Msg.Dt} {Msg.Nm}:</div>
      <pre>{Msg.Msg}</pre>
      <a href='javascript:void(0);' data-index={Idx} onclick={RepliesToggle}>
        <span>{Msg.IsLst ? '隱藏回應' : '回應'}</span>
        <span if={Msg.ChnCnt}>({Msg.ChnCnt})</span>
      </a>
      <div data-is='replies' if={Msg.IsLst} msg-id={Msg.ID} rpls={Msg.Rpls}/>
    </li>
  </ul>
  <div>
    <a href='javascript:void(0);' onclick={MessagesLoad}>載入更多</a>
  </div>
  <style scoped>
    :scope>ul { padding: 0; list-style: none; }
    :scope>ul>li { margin-bottom: 30px; }
    :scope>ul>li>div:first-of-type { color: #808080; }
    :scope>ul>li>pre { margin: 5px 0; line-height: 1.5; }
    :scope>div { text-align: center; }
  </style>
  <script>
    this.Lst = [];

    this.mixin('Z.RM');

    this.StoreListen(
      'MESSAGES',
      Sto => {
        if (!Sto) { return; }

        this.update({ Lst: Sto });
      });

    this.StoreListen(
      'REPLIES',
      (Sto, { ID }) => {
        if (!Sto || !ID) { return; }

        let Msg = null;

        for (let i = 0; i < this.Lst.length; i++) {
          if (this.Lst[i].ID === ID) {
            Msg = this.Lst[i];

            break;
          }
        }

        if (!Msg) { return null; }

        Msg.ChnCnt = Sto[ID].length;
        Msg.IsLst = true;
        Msg.Rpls = Sto[ID];

        this.update({ Lst: this.Lst });
      });

    this.on('before-mount', () => { this.MessagesLoad(); });

    MessagesLoad (Evt) {
      this.ServiceCall(
        '/service/message/list',
        { Lmt: 5, Ofst: this.Lst.length },
        'MESSAGES',
        (Sto, Rst) => {
          if (!Rst) {
            alert(this.Keyword('LoadDataFail'));

            return null;
          }

          if (Rst.Index < 0 && Rst.Message) {
            alert(Rst.Message);

            return null;
          }

          if (!Rst.Extend) {
            alert('SystemError');

            return null;
          }

          return [ ...this.Lst, ...Rst.Extend ];
        });
    }

    RepliesToggle (Evt) {
      const Idx = parseInt(Evt.currentTarget.dataset.index, 10),
            { ID, IsLst = false } = this.Lst[Idx],
            StoReplies = this.StoreGet('REPLIES') || null,
            Rpls = StoReplies && StoReplies[ID] || null;

      if (IsLst) {
        this.Lst[Idx].IsLst = false;

        return this.update({ Lst: this.Lst });
      }

      if (Rpls) {
        this.Lst[Idx].Rpls = Rpls;
        this.Lst[Idx].IsLst = true;

        return this.update({ Lst: this.Lst });
      }

      this.ServiceCall(
        '/service/message/chainlist',
        { ID },
        'REPLIES',
        (Sto, Rst) => {
          if (!Rst) {
            alert(this.Keyword('LoadDataFail'));

            return null;
          }

          if (Rst.Index < 0 && Rst.Message) {
            alert(Rst.Message);

            return null;
          }

          if (!Rst.Extend) {
            alert('SystemError');

            return null;
          }

          if (!Sto) { Sto = {}; }

          Sto[ID] = Rst.Extend;

          return Sto;
        },
        { ID });
    }
  </script>
</messages>

<replies>
  <ul>
    <li each={opts.rpls}>
      <div>{Dt} {Nm}</div>
      <pre>{Msg}</pre>
    </li>
  </ul>
  <a if={!IsFmShw} href='javascript:void(0);' onclick={FormToggle}>回應</a>
  <form if={IsFmShw}>
    <input type='text' maxlength='10' placeholder='匿名' value={NmMl[0]} disabled={IsSndng}/><br/>
    <input type='email' required='true' placeholder='E-Mail (不會公開)' value={NmMl[1]} disabled={IsSndng}/><br/>
    <textarea rows="1" maxlength='255' required='true' disabled={IsSndng}></textarea><br/>
    <div>
      <label>記住我<input type='checkbox' checked={NmMl[0]} /></label>
      <div>
        <a href='javascript:void(0);' onclick={ReplyLeave}>送出</a>
        <a href='javascript:void(0);' onclick={FormToggle}>取消</a>
      </div>
    </div>
  </form>
  <style scoped>
    :scope { padding-left: 20px; }
    :scope>ul { padding: 0; list-style: none; }
    :scope>ul>li { margin-bottom: 20px; }
    :scope>ul>li>div { color: #808080; }
    :scope>ul>li>pre { margin: 5px 0; line-height: 1.5; }
    :scope>form>input,
    :scope>form>textarea { width: 100%; box-sizing: border-box; }
    :scope>form>div { display: flex; }
    :scope>form>div>label { flex-grow: 1; }
    :scope>form>div>label>input { vertical-align: middle; }
  </style>
  <script>
    const CkKyNm = 'NmMl'; // cookie key name, name and mail.

    this.IsFmShw = false; // is replying form showing.
    this.IsSndng = false; // is sending the reply.
    this.NmMl = [ '', '' ]; // [ name, mail].

    this.mixin('Z.RM');

    this.on(
      'before-mount',
      () => {
        let NmMl = CookieParam(CkKyNm);

        if (NmMl) { this.NmMl = NmMl.split(';'); }

        if (Is.Array(this.opts.rpls) && !this.opts.rpls.length) { this.IsFmShw = true; }
      });

    FormToggle (Evt) {
      this.update({ IsFmShw: !this.IsFmShw });
    }

    ReplyLeave (Evt) {
      if (this.IsSndng) { return alert(this.Keyword('Working')); }

      const FmDOMs = this.root.querySelectorAll('form input, form textarea'), // form DOMs.
            Nm = FmDOMs[0].value,
            Ml = FmDOMs[1].value,
            Msg = FmDOMs[2].value,
            IsRmb = FmDOMs[3].checked;

      if (!this.IsFormGood(Nm, Ml, Msg)) { return; }

      if (this.root.querySelector('input[type=checkbox]').checked) {
        CookieSet(CkKyNm, Nm + ';' + Ml, 60 * 60 * 24 * 7);
      }
      else { CookieSet(CkKyNm, '', -1); }

      this.update({ IsSndng: true });
      setTimeout(() => { this.update({ IsSndng: false }); }, 2000); // limit one reply in 2 seconds.

      this.ServiceCall(
        '/service/message/leave',
        { Nm, Ml, Msg, Tgt: this.opts.msgId },
        'REPLIES',
        (Sto, Rst) => {
          if (!Rst) {
            alert(this.Keyword('LoadDataFail'));

            return null;
          }

          if (Rst.Index < 0 && Rst.Message) {
            alert(Rst.Message);

            return null;
          }

          if (!Rst.Extend) {
            alert('SystemError');

            return null;
          }

          Sto[this.opts.msgId].push({ Nm, Msg, ID: Rst.Extend, Dt: DatetimeFormat(new Date()) });

          this.root.querySelector('textarea').value = '';

          return Sto;
        },
        { ID: this.opts.msgId });
    }

    IsFormGood (Nm, Ml, Msg) {
      let Hnt = ''; // hint.

      if (!Nm || !Is.String(Nm) || Nm.length === 0) { Hnt += '尚未填寫暱稱。\n'; }

      if (!Ml || !Is.String(Ml) || Ml.length === 0) { Hnt += '尚未填寫 E-Mail。\n'; }
      else if (!Z.Is.EMail(Ml)) { Hnt += 'E-Mail 不符合標準格式。\n'; }

      if (!Msg || !Is.String(Msg) || Msg.length === 0) { Hnt += '尚未填寫任何留言。\n'; }
      else if (Msg.length > 255) { Hnt += '留言請勿超個 255 個字。\n'; }

      if (Hnt.length > 0) {
        alert('請留意以下說明：\n' + Hnt);

        return false;
      }

      return true;
    }
  </script>
</replies>
