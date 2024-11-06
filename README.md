# Event-Driven Product Management System

This project is an event-driven product management system consisting of two applications, each with its own database and server:

1. **Admin App**: This app uses a MySQL database and serves as the main event producer for RabbitMQ, managing product data and sending notifications of changes.
2. **Main App**: This app uses a MongoDB database and consumes events from RabbitMQ to keep its product data synchronized with the Admin App.

Both applications are implemented using Node.js, Express, TypeORM, and RabbitMQ. TypeScript is used for type safety and requires `tsc -w` to compile files in each folder.

## Table of Contents

- [Project Structure](#project-structure)
- [Features](#features)
- [Setup and Configuration](#setup-and-configuration)
- [Usage](#usage)
- [APIs](#apis)
- [RabbitMQ Event Consumption](#rabbitmq-event-consumption)
- [Database Schemas](#database-schemas)

## Project Structure

```
project-root/
├── admin/
│   ├── app.ts          # Main Express application for the Admin App
│   ├── entity/
│   │   └── product.ts  # TypeORM entity for MySQL database
│   └── tsconfig.json   # TypeScript configuration for Admin App
└── main/
    ├── app.ts          # Main Express application for the Main App
    ├── entity/
    │   └── product.ts  # TypeORM entity for MongoDB database
    └── tsconfig.json   # TypeScript configuration for Main App
```

## Features

### Admin App

- **MySQL Database**: Manages product information.
- **Event Producer**: Sends `product_created`, `product_updated`, and `product_deleted` events to RabbitMQ.
- **CRUD Operations**: Allows creating, updating, deleting, and retrieving product information.
- **TypeORM**: Provides object-relational mapping for MySQL database interaction.

### Main App

- **MongoDB Database**: Stores product data synchronized with Admin App.
- **Event Consumer**: Listens for `product_created`, `product_updated`, and `product_deleted` events from RabbitMQ and updates MongoDB accordingly.
- **Additional API Endpoints**: Provides a read-only view of the products and likes functionality.

## Setup and Configuration

### Prerequisites

- Node.js
- RabbitMQ
- MySQL Database
- MongoDB Database

### Environment Variables

Both applications use environment variables to connect to databases and RabbitMQ. Create `.env` files in each app directory using the `.env.example` file:

```plaintext
# Common Variables
PORT=8000                   # Port for the Express server
RABBITMQ_URI=amqp://user:password@hostname

# Admin App
DATABASE_HOSTNAME=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=password
DATABASE_NAME=productdb

# Main App
MONGODB_URI=mongodb://localhost:27017/productdb
```

### Installation

1. **Install Dependencies**: Run `npm install` in each folder (`admin` and `main`).
2. **Compile TypeScript**: Run `tsc -w` in each folder to compile TypeScript files to JavaScript.
3. **Start RabbitMQ**: Ensure RabbitMQ is running.
4. **Start Applications**:
   - Run `node dist/app.js` in each folder to start the servers.

## Usage

### Admin App

The Admin App provides the following endpoints:

- **GET /api/products** - Retrieve all products.
- **GET /api/products/:id** - Retrieve a specific product by ID.
- **POST /api/products** - Create a new product.
- **POST /api/products/:id/like** - Increment the likes of a specific product.
- **PUT /api/products/:id** - Update product details.
- **DELETE /api/products/:id** - Delete a product.

### Main App

The Main App provides the following endpoints:

- **GET /api/products** - Retrieve all products (synchronized with Admin App).
- **POST /api/products/:id/like** - Increment the likes of a product and sync with the Admin App.

## RabbitMQ Event Consumption

### Admin App

The Admin App sends events to RabbitMQ for any changes to products:

1. **Product Created**: Sent when a new product is created.
2. **Product Updated**: Sent when a product is updated.
3. **Product Deleted**: Sent when a product is deleted.

### Main App

The Main App consumes these events from RabbitMQ to keep its MongoDB database synchronized:

1. **product_created**: Adds a new product to MongoDB.
2. **product_updated**: Updates a product in MongoDB.
3. **product_deleted**: Deletes a product from MongoDB.

## APIs

### Admin App

```http
GET /api/products
```
- Retrieves a list of all products.

```http
GET /api/products/:id
```
- Retrieves details of a specific product by ID.

```http
POST /api/products
```
- Creates a new product.
- Request body should contain:
  ```json
  {
    "title": "string",
    "image": "string"
  }
  ```

```http
POST /api/products/:id/like
```
- Increments the `likes` count of a specific product.

```http
PUT /api/products/:id
```
- Updates a product's details by ID.
- Request body should contain updated fields, e.g.:
  ```json
  {
    "title": "Updated Title",
    "image": "Updated Image URL"
  }
  ```

```http
DELETE /api/products/:id
```
- Deletes a product by ID.

### Main App

```http
GET /api/products
```
- Retrieves all products (synchronized with Admin App).

```http
POST /api/products/:id/like
```
- Increments the `likes` count of a product in MongoDB and syncs with the Admin App.

## Database Schemas

### Admin App - MySQL Schema

**Product Entity** (in `admin/entity/product.ts`):

- `id`: Primary key, auto-incremented.
- `title`: String, title of the product.
- `image`: String, image URL for the product.
- `likes`: Integer, default is 0.

### Main App - MongoDB Schema

**Product Entity** (in `main/entity/product.ts`):

- `_id`: ObjectId, automatically generated.
- `admin_id`: Unique integer that matches the product ID in the Admin App.
- `title`: String, title of the product.
- `image`: String, image URL for the product.
- `likes`: Integer, default is 0. 

## License

This project is open source and available under the MIT License.
