#! /bin/sh
cd /opt/app-root || exit
echo 'starting upgrade'
flask db upgrade
