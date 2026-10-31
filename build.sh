#!/bin/bash
# Builds the playable site (index.html = 3D, pixel.html = pixel art) from src/ into the repo root.
set -e
cd "$(dirname "$0")"
JS=src/js
CORE="$JS/a_core.js $JS/b_data.js $JS/c_world.js $JS/d_gfx.js $JS/e_game.js $JS/e2_qol.js $JS/e3_progress.js $JS/f_ui.js $JS/e4_acts.js $JS/e5_polish.js $JS/e6_leisure.js"
cat $CORE $JS/s_survivor.js $JS/h_touch.js $JS/h2_menu.js $JS/i_pad.js $JS/z_boot.js > /tmp/jb_pixel.js
cat $CORE $JS/g_three.js $JS/s_survivor.js $JS/h_touch.js $JS/h2_menu.js $JS/i_pad.js $JS/z_boot.js > /tmp/jb_3d.js
node --check /tmp/jb_pixel.js && node --check /tmp/jb_3d.js
VER=$(date +%Y%m%d%H%M%S)
head_html() { # $1 alt label, $2 alt href, $3 pref, $4 extra js
cat <<H
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Jadeborn">
<meta name="theme-color" content="#0b0e15">
<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="icon" href="icon-192.png">
<script>$4window.JB_ALT={label:'$1',href:'$2',pref:'$3'};if('serviceWorker' in navigator&&location.protocol!=='file:')addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});</script>
H
}
{ head_html 'Graphics: Pixel' 'pixel.html' 'pixel' "try{if(localStorage.getItem('jadeborn_gfx')==='pixel')location.replace('pixel.html')}catch(e){}"; cat src/shell-3d.html; echo '<script>'; cat src/vendor/three-0.158.0.min.js; echo '</script><script>'; cat /tmp/jb_3d.js; echo '</script></html>'; } > index.html
{ head_html 'Graphics: 3D' './' '3d' ""; cat src/shell-pixel.html; echo '<script>'; cat /tmp/jb_pixel.js; echo '</script></html>'; } > pixel.html
sed "s/__VER__/$VER/" src/pwa/sw.js > sw.js
cp src/pwa/manifest.webmanifest src/pwa/*.png .
touch .nojekyll
echo "Built index.html ($(wc -c < index.html) bytes), pixel.html ($(wc -c < pixel.html) bytes), cache $VER"
