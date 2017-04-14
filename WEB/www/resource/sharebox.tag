<share-box>
  <ul>
    <li>
      <icon-share title='分享' sz='23'/>
    </li>
    <li>
      <a href='http://www.facebook.com/share.php?u={opts.ecdurl}'>
        <icon-facebook sz='23'/>
      </a>
    </li>
    <li>
      <a href='http://twitter.com/intent/tweet?url={opts.ecdurl}'>
        <icon-twitter sz='23'/>
      </a>
    </li>
    <li>
      <a href='http://www.tumblr.com/share/link?url={opts.ecdurl}'>
        <icon-tumblr sz='23'/>
      </a>
    </li>
    <li>
      <a href='https://plus.google.com/share?url={opts.ecdurl}'>
        <icon-google-plus sz='23'/>
      </a>
    </li>
  </ul>
  <style scoped>
    ul { list-style-type: none; padding: 0; }
    li { display: inline-block; }
  </style>
  <script>
    // plurk 'http://www.plurk.com/?qualifier=shares&status=' . $ecdurl . ' (' . $Blog['Ttl'] . ')'
  </script>
</share-box>