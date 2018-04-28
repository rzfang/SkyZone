#!/bin/bash

BscPth=`dirname $0`; # basic path.
BscPth=`realpath $BscPth`;

if [ "$1" == 'php' ]; then
  PgPth=$BscPth'/../WEB/www/'; # page root path.
  RtPth=$BscPth'/../SRC/route.php';

  php -S localhost:9000 -t $PgPth $RtPth;
elif [ "$1" == 'node' ]; then
  cd $BscPth'/..';
  npm run dev;
elif [ "$1" == 'nginx' ]; then
  sudo service nginx start;
else
  echo -e '\nhow to use: '$0' [php|node|nginx]\n';
fi;
