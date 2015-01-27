#!/bin/bash
set -e -o pipefail
npm install
coffee=node_modules/coffee-script/bin/coffee
sass=node_modules/node-sass/bin/node-sass

mkdir -p build/{static,tmp}

cp -uv node_modules/codemirror/lib/codemirror.css build/static/
i=style/style.sass o=build/static/style.css
if [ $i -nt $o ]; then
  echo 'preprocessing css'
  # node-sass generates a bad source map now, but let's be ready for the time it's fixed
  $sass -i --source-map -o `dirname $o` $i # for compression, add: --output-style=compressed
fi

cp -uv index.html build/static/

js_files='
  node_modules/socket.io/node_modules/socket.io-client/socket.io.js
  node_modules/jquery/dist/cdn/jquery-2.1.3.min.js
  node_modules/codemirror/lib/codemirror.js
  node_modules/codemirror/mode/apl/apl.js
  node_modules/codemirror/addon/hint/show-hint.js
  node_modules/codemirror/addon/edit/matchbrackets.js
  node_modules/codemirror/addon/edit/closebrackets.js
  node_modules/jquery-ui/core.js
  node_modules/jquery-ui/widget.js
  node_modules/jquery-ui/mouse.js
  node_modules/jquery-ui/position.js
  node_modules/jquery-ui/draggable.js
  node_modules/jquery-ui/droppable.js
  node_modules/jquery-ui/resizable.js
  node_modules/jquery-ui/sortable.js
  node_modules/jquery-ui/button.js
  node_modules/jquery-ui/dialog.js
  node_modules/jquery-ui/tabs.js
  jquery.hotkeys.js
  jquery.layout.js
  lbar/lbar.js
  client/jquery-dyalog.coffee
  client/keymap.coffee
  client/help-urls.coffee
  client/about.coffee
  client/prefs.coffee
  client/editor.coffee
  client/session.coffee
  client/ide.coffee
  client/connect.coffee
  client/init.coffee
'
us='' # names of compiled files
changed=0
for f in $js_files; do
  u=build/tmp/${f//\//_} # replace / with _
  us="$us $u"
  if [ $f -nt $u ]; then
    changed=1
    if [ $f != ${f%%.coffee} ]; then echo "compiling $f"; $coffee -bcp $f >$u
    elif [ $f != ${f%%.min.js} ]; then echo "copying $f"; cp $f $u
    else echo "cleaning up $f"; <$f sed '/^\(var \w\+ = \)\?require(/d' >$u; fi
  fi
done
version_file=build/tmp/version.js
>$version_file cat <<.
  var D=D||{};
  D.versionInfo={
    version:'0.1.$(git rev-list --count HEAD)',
    date:'$(git show -s HEAD --pretty=format:%ci)',
    rev:'$(git rev-parse HEAD)'
  };
.
if [ $changed -ne 0 ]; then echo 'concatenating js files'; cat $version_file $us >build/static/D.js; fi

cp -ur style/apl385.* style/*.png favicon.ico package.json build/static/
