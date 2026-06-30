# Nginx for gislifeindex.ru

Готовые файлы для VPS Timeweb Cloud.

## Основной конфиг

Скопировать на сервер:

```bash
sudo cp gislifeindex.ru.conf /etc/nginx/sites-available/gislifeindex.ru
sudo ln -sf /etc/nginx/sites-available/gislifeindex.ru /etc/nginx/sites-enabled/gislifeindex.ru
sudo nginx -t
sudo systemctl reload nginx
```

Что делает конфиг:

- включает gzip для текстовых файлов, JS, CSS, JSON и SVG;
- включает `gzip_static`, чтобы Nginx мог отдавать заранее сжатые `.gz`, если они появятся;
- HTML и manifest-файлы всегда перепроверяются браузером;
- обычные JSON-данные кэшируются на 1 час;
- тяжёлые бинарные 3D-тайлы (`b3dm`, `i3dm`, `glb`, `bin`) кэшируются на 1 день;
- `src`, `public`, `vendor` кэшируются надолго, потому что версии скриптов меняются через query/version.

## Отдельная сборка Димитровграда

Основной сайт и сайт только для Димитровграда собираются в разные папки и могут лежать на одном сервере одновременно:

```bash
npm --prefix site run build:dist
npm --prefix site run build:dimitrovgrad
```

Результат:

- `site_dist` — основной сайт со всеми городами;
- `site_dimitrovgrad` — отдельный сайт, где `data/manifest.json` содержит только Димитровград, а стартовый экран сразу открывает карту города.

На сервере это можно отдать отдельным поддоменом с собственным `root`, например:

```nginx
server {
    listen 80;
    server_name dimitrovgrad.gislifeindex.ru;
    root /var/www/gislifeindex-dimitrovgrad;
    index index.html;
    charset utf-8;

    location / {
        add_header Cache-Control "public, max-age=0, must-revalidate" always;
        try_files $uri $uri/ /index.html;
    }
}
```

Альтернатива — подкаталог на основном домене: скопировать `site_dimitrovgrad` в `/var/www/gislifeindex.ru/dimitrovgrad` и добавить `location /dimitrovgrad/` с `try_files $uri $uri/ /dimitrovgrad/index.html;`.

## Brotli

Brotli нельзя включать вслепую: если модуль не установлен, `nginx -t` упадёт.

Порядок:

```bash
sudo apt update
sudo apt install -y libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static
sudo cp brotli-optional.conf /etc/nginx/snippets/gislifeindex-brotli.conf
```

После этого добавить внутри `server { ... }` в `gislifeindex.ru.conf`:

```nginx
include /etc/nginx/snippets/gislifeindex-brotli.conf;
```

Проверить и применить:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Проверка сжатия:

```bash
curl -I -H "Accept-Encoding: gzip" http://gislifeindex.ru/src/map3d.bundle.js
curl -I -H "Accept-Encoding: br" http://gislifeindex.ru/src/map3d.bundle.js
```

В ответе должно быть `Content-Encoding: gzip` или `Content-Encoding: br`.
