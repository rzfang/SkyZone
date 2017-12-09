<?php
  if (preg_match('/\.(js|css)$/', $_SERVER['REQUEST_URI'])) {
    header('Location: http://localhost:9004' . $_SERVER['REQUEST_URI']);
    die();
  }

  return false;
?>
