# GraphQL Microservices Shop

Учебный проект по микросервисной архитектуре с GraphQL Federation.

Три микросервиса (Users, Products, Orders) объединены через Apollo Gateway.
Фронтенд на React подключается к одной точке входа и умеет делать CRUD по всем сущностям.

## Архитектура

```
React (порт 3000)
    |
    v
Apollo Gateway (порт 4000)  <- единая точка входа для GraphQL
    |
    +-- Users Service (порт 4001) -> PostgreSQL (порт 5432)
    +-- Products Service (порт 4002) -> PostgreSQL (порт 5433)
    +-- Orders Service (порт 4003) -> MongoDB (порт 27017)
```

## Стек технологий

- Apollo Server 4 + Apollo Federation 2 - GraphQL сервер и объединение схем
- Apollo Gateway - маршрутизация запросов между микросервисами
- Apollo Client - GraphQL клиент для React
- Sequelize + PostgreSQL - хранение пользователей и товаров
- Mongoose + MongoDB - хранение заказов
- Docker Compose - оркестрация всех сервисов

## Что умеет приложение

Пользователи:
- создать пользователя (имя, email, роль)
- посмотреть всех пользователей
- обновить данные
- удалить

Товары:
- создать товар (название, цена, остаток, категория, описание)
- посмотреть все товары
- обновить данные
- удалить

Заказы:
- создать заказ (ID пользователя, ID товаров, сумма, адрес)
- посмотреть все заказы
- изменить статус (pending, confirmed, shipped, delivered, cancelled)
- удалить

## Быстрый старт

Нужно установить Docker Desktop.

### 1. Клонируем репозиторий

```bash
git clone https://github.com/ВАШ_ЛОГИН/graphql-microservices.git
cd graphql-microservices
```

### 2. Запускаем все сервисы

```bash
docker-compose up --build
```

Первый запуск займет 3-5 минут - скачиваются образы и устанавливаются зависимости.

### 3. Открываем приложение

Фронтенд: http://localhost:3000

GraphQL Gateway (Playground): http://localhost:4000/graphql

Отдельные сервисы:
- http://localhost:4001/graphql - Users
- http://localhost:4002/graphql - Products
- http://localhost:4003/graphql - Orders

### 4. Останавливаем

```bash
docker-compose down
```

Удалить вместе с базами данных:

```bash
docker-compose down -v
```

## Запуск без Docker (для разработки)

Нужно установить Node.js 18+, PostgreSQL и MongoDB локально.

### Устанавливаем зависимости

```bash
# Gateway
cd gateway && npm install

# Сервисы
cd services/users && npm install
cd services/products && npm install
cd services/orders && npm install

# Фронтенд
cd frontend && npm install
```

### Создаем базы данных в PostgreSQL

```sql
CREATE DATABASE users_db;
CREATE DATABASE products_db;
```

### Запускаем каждый сервис в отдельном терминале

```bash
# Терминал 1 - Users
cd services/users
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/users_db npm start

# Терминал 2 - Products
cd services/products
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/products_db npm start

# Терминал 3 - Orders
cd services/orders
MONGODB_URI=mongodb://localhost:27017/orders_db npm start

# Терминал 4 - Gateway
cd gateway npm start

# Терминал 5 - Frontend
cd frontend npm start
```

## Примеры GraphQL запросов

Эти запросы можно выполнить в Apollo Sandbox по адресу http://localhost:4000/graphql

### Получить всех пользователей

```graphql
query {
  users {
    id
    name
    email
    role
    createdAt
  }
}
```

### Создать пользователя

```graphql
mutation {
  createUser(name: "Иван Иванов", email: "ivan@example.com", role: "customer") {
    id
    name
    email
  }
}
```

### Обновить пользователя

```graphql
mutation {
  updateUser(id: "1", name: "Иван Петров") {
    id
    name
  }
}
```

### Удалить пользователя

```graphql
mutation {
  deleteUser(id: "1")
}
```

### Получить все товары

```graphql
query {
  products {
    id
    name
    price
    stock
    category
  }
}
```

### Создать товар

```graphql
mutation {
  createProduct(
    name: "Ноутбук"
    price: 59999
    stock: 10
    category: "Электроника"
    description: "Мощный ноутбук для работы"
  ) {
    id
    name
    price
  }
}
```

### Создать заказ

```graphql
mutation {
  createOrder(
    userId: "1"
    productIds: ["1", "2"]
    totalPrice: 64999
    address: "Москва, ул. Примерная, д. 1"
  ) {
    id
    status
    totalPrice
  }
}
```

### Изменить статус заказа

```graphql
mutation {
  updateOrderStatus(id: "ORDER_ID", status: "confirmed") {
    id
    status
  }
}
```

### Получить заказы пользователя

```graphql
query {
  ordersByUser(userId: "1") {
    id
    status
    totalPrice
    createdAt
  }
}
```

## Структура проекта

```
graphql-microservices/
|-- docker-compose.yml
|-- gateway/
|   |-- index.js          # Apollo Gateway - объединяет все сервисы
|   |-- package.json
|   |-- Dockerfile
|-- services/
|   |-- users/
|   |   |-- index.js      # GraphQL subgraph + Sequelize + PostgreSQL
|   |   |-- package.json
|   |   |-- Dockerfile
|   |-- products/
|   |   |-- index.js      # GraphQL subgraph + Sequelize + PostgreSQL
|   |   |-- package.json
|   |   |-- Dockerfile
|   |-- orders/
|       |-- index.js      # GraphQL subgraph + Mongoose + MongoDB
|       |-- package.json
|       |-- Dockerfile
|-- frontend/
    |-- src/
    |   |-- App.js        # React компоненты с Apollo Client
    |   |-- index.js      # Подключение Apollo Client
    |   |-- index.css     # Стили
    |-- public/
    |   |-- index.html
    |-- package.json
    |-- Dockerfile
```

## Как это работает

GraphQL Federation позволяет разделить одну большую GraphQL схему на несколько маленьких.
Каждый микросервис владеет своей частью схемы и своей базой данных.
Gateway собирает все схемы вместе и предоставляет единый API наружу.

Когда фронтенд отправляет запрос на Gateway:
1. Gateway разбирает запрос и определяет какие сервисы нужны
2. Отправляет подзапросы в нужные микросервисы
3. Собирает ответы вместе
4. Возвращает единый результат фронтенду

Такой подход позволяет каждой команде независимо разрабатывать и деплоить свой сервис.

## Возможные проблемы

Gateway не запускается - сервисы ещё не готовы

Gateway ждёт пока все три сервиса поднимутся. Если он упал раньше - перезапусти только его:

```bash
docker-compose restart gateway
```

Ошибка подключения к базе данных

Проверь что контейнеры с базами данных запущены:

```bash
docker-compose ps
```

Порт уже занят

Если порт 4000 или 3000 уже используется - измени его в docker-compose.yml
