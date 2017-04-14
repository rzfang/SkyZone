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
    let Ofst = 0;

    this.Blgs = [];

    this.mixin('Z.RM');

    this.on('mount', () => { this.BlogsLoad(); });

    BlogsLoad () {
      this.AJAX({
        URL: 'service.php',
        Mthd: 'POST',
        Data: { Cmd: 1, Lmt: 5, Ofst: Ofst, TgIDA: this.opts.TgIDA },
        Err: (Sts) => { alert('BG.'); },
        OK: (RspnsTxt, Sts) => {
          let Rst = JSON.parse(RspnsTxt);

          if (Rst.Index < 0) { return alert(Rst.Message); }

          this.update({ Blgs: this.Blgs.concat(Rst.Extend) });

          Ofst += 5;
        }
      });
    }

    ScrollToTop () {
      window.scrollTo(0, 0);
    }
  </script>
</bloglist>

<blog>
  <div>
    <i data-is='icon-{opts.info.Tp}'/>
    <a href='{opts.info.Tp}.php?b={opts.info.ID}'>{opts.info.Ttl}</a>
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