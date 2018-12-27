<images-page>
  <h1>{Ttl}</h1>
  <div>
    <tags tgs={Tgs}/>
    <icon title='發佈時間' nm='calendar'/> {Dt}
  </div>
  <ul>
    <li each={Info.Fst}>
      <img src={ImgUrl} alt={Fl}/>
      <div if={Cmt}>
        <pre>{Cmt}</pre>
      </div>
    </li>
    <li each={Info.Mr}>
      <late-img src={ImgUrl} alt={Fl}/>
      <div if={Cmt}>
        <pre>{Cmt}</pre>
      </div>
    </li>
  </ul>
  <style scoped>
    :scope>div { margin: 20px 0; }
    :scope>ul { margin: 0; padding: 0; list-style: none; }
    :scope>ul>li { margin-bottom: 30px; text-align: center; }
    :scope>ul>li img { max-width: 100%; }
    :scope>ul>li>div>pre { display: inline-block; margin-top: 10px; text-align: left; }
  </style>
  <script>
    this.Ttl = '';
    this.Tgs = [];
    this.Dt = '';
    this.Str = '';
    this.Url = '';
    this.Info = [];

    this.mixin('Z.RM');

    this.StoreListen(
      'BLOG',
      (Sto, Prms) => {
        this.update({
          Ttl: Sto.Ttl,
          Tgs: Sto.Tgs,
          Dt: Sto.Dt,
          Url: encodeURI(Sto.Url),
          // Info: Sto.Info
          Info: {
            Fst: Sto.Info.slice(0, 2),
            Mr: Sto.Info.slice(2)
          }
        });
      });

    this.on(
      'mount',
      () => {
        if (!this.OnBrowser()) { return; }

        const Id = window.location.search.replace('?b=', '');

        if (!Id) {
          window.location = '/404';

          return;
        }

        this.ServiceCall(
          '/service/blog',
          { Id },
          'BLOG',
          (Sto, Rst) => {
            if (!Rst) { return alert(window.Z.Kwd.RM.SystemError); }

            if (Rst.Index < 0) { return alert(Rst.Message); }

            return Rst.Extend;
          });
      });
  </script>
</images-page>
