# Эксплуатация

## UI stack

Admin использует Angular, Tailwind CSS и Taiga UI. Таблицы построены на `@taiga-ui/addon-table`; сторонних табличных библиотек и лицензионных ключей в проекте нет.

## Backend

Admin API построен на NestJS и работает с PostgreSQL через Prisma. Redis и S3-compatible storage используются по мере подключения соответствующих функций.

## Docker

Разработка должна запускаться одной командой с hot reload для Angular/NestJS и инфраструктурой в контейнерах. Production-компоненты остаются независимо развёртываемыми; PostgreSQL рассматривается как отдельный инфраструктурный сервис/контейнер.

## Изменение Prisma schema

После изменений модели данных требуется создать/применить Prisma migration (или использовать `db:push` только в допустимом dev workflow). Перед production rollout миграции должны быть проверены на копии данных/стейджинге.

## Форматирование

В monorepo используется общий Prettier. Angular inline template допускается только до 100 нормализованных символов; более длинные шаблоны выносятся в `.component.html` через `templateUrl`.
