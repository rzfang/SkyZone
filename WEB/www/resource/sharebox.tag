<share-box>
  <ul>
    <li>
      <icon title='分享' nm="share" sz="23"/>
    </li>
    <li>
      <a href='https://www.facebook.com/share.php?u={opts.ecdurl}'>
        <icon nm='facebook' sz='23'/>
      </a>
    </li>
    <li>
      <a href='https://twitter.com/intent/tweet?url={opts.ecdurl}'>
        <icon nm='twitter' sz='23'/>
      </a>
    </li>
    <li>
      <a href='https://www.tumblr.com/share/link?url={opts.ecdurl}'>
        <icon nm='tumblr' sz='23'/>
      </a>
    </li>
    <li>
      <a href='https://plus.google.com/share?url={opts.ecdurl}'>
        <icon nm='google-plus' sz='23'/>
      </a>
    </li>
  </ul>
  <style scoped>
    :scope>ul { list-style-type: none; padding: 0; }
    :scope>ul>li { display: inline-block; }
  </style>
  <script>
    // plurk 'https://www.plurk.com/?qualifier=shares&status=' . $ecdurl . ' (' . $Blog['Ttl'] . ')'
  </script>
</share-box>
