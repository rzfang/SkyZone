<blogs>
  <div data-is='tags' tgs={Tgs} pckids={PckIds}/>
  <div data-is='bloglist' tgids={PckIds} />
  <style scoped>
    :scope { display: block; }
  </style>
  <script>
    this.Tgs = [];
    this.PckIds = [];

    this.mixin('Z.RM');

    this.StoreListen(
      'TAGS',
      (Sto) => {
        if (!Sto) { return; }

        let UpdtDt = { Tgs: Sto }; // updating data.

        if (this.OnBrowser()) {
          const PckId = window.location.search.replace('?t=', ''); // picked id.

          if (PckId) { UpdtDt.PckIds = [ PckId ]; }
        }

        this.update(UpdtDt);
      });

    this.on(
      'before-mount',
      () => {
        this.ServiceCall(
        '/service/tag/list',
        {},
        'TAGS',
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

          return Rst.Extend;
        });
      });
  </script>
</blogs>

<bloglist>
  <ul>
    <li data-is="blog" each={Blgs} info={this}/>
  </ul>
  <div>
    <a href='javascript:void(0);' onclick={BlogsLoad}>載入更多</a>
    <a id='ToTop' href='javascript:void(0);' onclick={ScrollToTop}>回到頂端</a>
  </div>
  <style scoped>
    :scope>ul { list-style-type: none; padding: 0; }
    :scope>div:last-child { text-align: center; }
    :scope>div:last-child>a:last-child { display: inline-block; position: absolute; right: 0; }
  </style>
  <script>
    const Lmt = 5; // limit.
    let Ofst = 0, // offset.
        TgIds = [], // tag ids.
        IsAll = false; // is all blogs loaded.

    this.Blgs = [];

    this.mixin('Z.RM');

    this.StoreListen(
      'BLOGS',
      (Sto, Prms) => {
        Ofst += Lmt;
        TgIds = Prms.TgIds;

        if (Sto.length < Lmt) { IsAll = true; }

        this.update({ Blgs: this.Blgs.concat(Sto) });
      });

    this.on(
      'update',
      () => {
        const IsSmCdtn = Z.Is.ArrayEqual(this.opts.tgids, TgIds); // is the same condition.

        if (IsSmCdtn) {
          if (this.Blgs.length) { return; }
        }
        else { IsAll = false; }

        this.BlogsLoad();
      });

    BlogsLoad () {
      if (IsAll) { return; }

      this.ServiceCall(
        '/service/blog/list',
        { Lmt, Ofst, TgIDA: this.opts.tgids },
        'BLOGS',
        (Sto, Rst) => {
          if (Rst.Index < 0) {
            alert(Rst.Message);

            return null;
          }

          return Rst.Extend;
        },
        { TgIds: this.opts.tgids, Ofst });
    }

    ScrollToTop () {
      window.scrollTo(0, 0);
    }
  </script>
</bloglist>

<blog>
  <div>
    <icon nm={opts.info.Tp}/>
    <a href='{opts.info.Tp}?b={opts.info.ID}'>{opts.info.Ttl}</a>
  </div>
  <pre>{opts.info.Smry}</pre>
  <div>
    <span each={opts.info.Tg}>{Nm}</span>
  </div>
  <div>{opts.info.Dt}</div>
  <style scoped>
    :scope { margin: 20px 0; line-height: 1.5; }
    :scope>div:first-child>a { font-size: 1.3rem; vertical-align: middle; }
    :scope>pre { white-space: pre-line; }
    :scope>pre~div { color: #808080; }
  </style>
</blog>
