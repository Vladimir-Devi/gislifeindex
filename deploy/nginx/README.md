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
