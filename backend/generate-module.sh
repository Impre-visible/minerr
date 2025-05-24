#!/bin/bash

name=$1

if [ -z "$name" ]; then
  echo "Please provide a module name."
  exit 1
fi

kebab_name=$(echo "$name" | sed -E 's/([a-z])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]')

nest generate module modules/$kebab_name 2> /dev/null
nest generate service modules/$kebab_name/service/$kebab_name --flat 2> /dev/null
nest generate controller modules/$kebab_name/controller/$kebab_name --flat 2> /dev/null