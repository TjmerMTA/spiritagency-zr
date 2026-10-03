#!/usr/bin/env bash
# Выкладка на GitHub Pages: залить site/ в ветку gh-pages.
# Тот же приём, что у основного сайта spiritagency.space, только без сборки —
# сайт уже статический, править можно прямо в site/.
set -euo pipefail
cd "$(dirname "$0")"

test -f site/index.html && test -f site/CNAME

tmp=$(mktemp -d)
cp -R site/. "$tmp/"
touch "$tmp/.nojekyll"          # иначе Pages прячет папки, начинающиеся с _

git worktree remove --force .gh-pages 2>/dev/null || true
git branch -D gh-pages 2>/dev/null || true   # ветку пересоздаём каждый раз, она всё равно force-push
git worktree add --detach .gh-pages
cd .gh-pages
git checkout --orphan gh-pages
git rm -rq --cached . 2>/dev/null || true
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$tmp/." .
git add -A
git commit -qm "Сборка $(date '+%Y-%m-%d %H:%M')"
git push -f origin gh-pages
cd ..
git worktree remove --force .gh-pages
rm -rf "$tmp"
echo "Готово: https://$(cat site/CNAME)/"
