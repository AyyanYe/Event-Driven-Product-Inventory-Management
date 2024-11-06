import express, { Request, Response } from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import { Product } from "./entity/product";
import dotenv from "dotenv";
import amqplib, { Message } from "amqplib";
import axios from "axios";

dotenv.config();

const AppDataSource = new DataSource({
  type: "mongodb",
  url: process.env.MONGODB_URI,
  synchronize: true,
  logging: false,
  useUnifiedTopology: true,
  entities: [Product],
});

AppDataSource.initialize()
  .then(async (db) => {
    const productRepository = db.getMongoRepository(Product);

    try {
      const connection = await amqplib.connect(process.env.RABBITMQ_URI);
      const channel = await connection.createChannel();

      //RabbitMQ Queues Assertion
      channel.assertQueue("product_created", { durable: true });
      channel.assertQueue("product_updated", { durable: true });
      channel.assertQueue("product_deleted", { durable: true });

      //Express Startup, remember the type of app
      const app: express.Application = express();

      app.use(
        cors({
          origin: [
            "http://localhost:3000",
            "http://localhost:8080",
            "http://localhost:4200",
          ],
        })
      );

      app.use(express.json());

      //RabbitMQ Event Consumption
      channel.consume("product_created", async (msg: Message | null) => {
        if (!msg) return;

        try {
          const eventProduct = JSON.parse(msg.content.toString());
          const product = new Product();
          product.admin_id = parseInt(eventProduct.id);
          product.title = eventProduct.title;
          product.likes = eventProduct.likes;
          product.image = eventProduct.image;

          // Add product to the MongoDB Database
          await productRepository.save(product);

          // Acknowledge the message after adding to the queue
          channel.ack(msg);
        } catch (error) {
          console.error("Failed to process message:", error);
          channel.nack(msg, false, false); // Discard the message if there's an error
        }
      });
      channel.consume("product_updated", async (msg: Message | null) => {
        if (!msg) return;

        try {
          const eventProduct = JSON.parse(msg.content.toString());

          const product = await productRepository.findOne({
            where: { admin_id: eventProduct.id },
          });
          productRepository.merge(product, {
            title: eventProduct.title,
            likes: eventProduct.likes,
            image: eventProduct.image,
          });

          // Add product to the MongoDB Database
          await productRepository.save(product);
          console.log("Product Updated");
          // Acknowledge the message after adding to the queue
          channel.ack(msg);
        } catch (error) {
          console.error("Failed to process message:", error);
          channel.nack(msg, false, false); // Discard the message if there's an error
        }
      });
      channel.consume("product_deleted", async (msg: Message | null) => {
        if (!msg) return;

        try {
          const adminId = parseInt(msg.content.toString()); // Directly parse the content
          if (isNaN(adminId)) {
            throw new Error("Invalid admin_id format");
          }

          const result = await productRepository.deleteOne({
            admin_id: adminId,
          });
          if (result.deletedCount === 0) {
            console.warn(`No product found with admin_id: ${adminId}`);
          } else {
            console.log(
              `Product with admin_id: ${adminId} deleted successfully`
            );
          }

          channel.ack(msg);
        } catch (error) {
          console.error("Failed to process delete message:", error);
          channel.nack(msg, false, false); // Discard the message if there's an error
        }
      });

      //GET Request
      app.get(
        "/api/products",
        async (req: Request, res: Response): Promise<Response> => {
          try {
            const products = await productRepository.find();
            return res.json(products);
          } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
          }
        }
      );

      //POST Request
      app.post(
        "/api/products/:id/like",
        async (req: Request, res: Response): Promise<Response> => {
          try {
            const product = await productRepository.findOne({
              where: { admin_id: parseInt(req.params.id) },
            });

            await axios.post(
              `http://localhost:8000/api/products/${product.admin_id}/like`,
              {}
            );

            product.likes++;
            await productRepository.save(product);

            return res.json(product);
          } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
          }
        }
      );

      app.listen(parseInt(process.env.PORT), () =>
        console.log(`Listening to port ${process.env.PORT}`)
      );
      process.on("beforeExit", () => {
        console.log("Closing the RabbitMQ Channel connection...");
        connection.close();
      });
    } catch (error) {
      console.error("Error during RabbitMQ Initialization:", error);
    }
  })
  .catch((error) =>
    console.log("Error during Data Source initialization:", error)
  );
