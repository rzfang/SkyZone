<tags>
  <div if={opts.tgs.length}>
    <icon title='分類標籤' nm='tags'></icon>
    <a if={opts.pckids && opts.pckids.length} href='blogs.php'>取消</a>
    <br if={opts.pckids && opts.pckids.length}/>
    <div each={opts.tgs}>
      <span if={IsPck}>{Nm}</span>
      <a if={!IsPck} href='blogs.php?t={ID}'>{Nm}</a>
    </div>
  </div>
  <style scoped>
    :scope>div>div { display: inline-block; }
    :scope>div>div>a { display: inline-block; margin-right: 5px; }
    :scope>div>div>span { display: inline-block; margin-right: 5px; padding: 0 3px; border: 1px solid; border-radius: 3px; }
  </style>
  <script>
    if (this.opts.pckids && this.opts.pckids.length) {
      for (let i = 0; i < this.opts.tgs.length; i++) {
        if (this.opts.pckids.indexOf(this.opts.tgs[i].ID) > -1) { this.opts.tgs[i].IsPck = true; }
      }
    }
  </script>
</tags>
