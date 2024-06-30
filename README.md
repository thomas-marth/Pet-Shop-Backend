# Pet Shop Backend

## Описание

Это backend часть проекта интернет-магазина товаров для домашних животных. Он реализует REST API для работы с категориями, продуктами и заказами.

## Структура проекта

- `/database`
  - `/models`
    - `category.js`: Модель категории
    - `product.js`: Модель продукта
  - `database.js`: Настройка подключения к базе данных SQLite
- `/public`
  - `/category_img`: Изображения категорий
  - `/product_img`: Изображения продуктов
- `/routes`
  - `categories.js`: Маршруты для работы с категориями
  - `order.js`: Маршруты для работы с заказами
  - `products.js`: Маршруты для работы с продуктами
  - `sale.js`: Маршруты для работы с продажами
- `index.js`: Главный файл сервера
- `database.sqlite`: Файл базы данных SQLite
- `package.json` и `package-lock.json`: Файлы зависимостей проекта
- `README.md`: Описание проекта

## Установка и запуск

1. Клонируйте репозиторий:

```bash
git clone <URL репозитория>
```

2. Перейдите в папку проекта:

```bash
cd <имя папки проекта>
```

3. Установите зависимости:

```bash
npm install
```

4. Запустите сервер:

```bash
npm start
```

Сервер будет запущен и будет слушать запросы на порту 3333.

## Проверка работы API

Вы можете проверить работу API через Postman или браузер.

### Примеры API маршрутов

- Получение всех категорий: `GET /categories/all`
- Получение продуктов по категории: `GET /categories/:id`
- Получение всех продуктов: `GET /products/all`
- Получение продукта по ID: `GET /products/:id`
- Оформление заказа: `POST /order/send`

### Пример запроса

#### Получение всех категорий

```bash
curl -X GET http://localhost:3333/categories/all
```

#### Оформление заказа

```bash
curl -X POST http://localhost:3333/order/send -H "Content-Type: application/json" -d '{
  "name": "John Doe",
  "phone": "1234567890",
  "email": "johndoe@example.com",
  "products": [
    {
      "id": 1,
      "quantity": 2
    },
    {
      "id": 2,
      "quantity": 1
    }
  ]
}'
```

## Используемые технологии

- Node.js
- Express
- Sequelize
- SQLite
- Cors
- Axios