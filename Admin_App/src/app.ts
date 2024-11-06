import express, { Request, Response } from "express";
import cors from "cors";
import { DataSource, Repository } from "typeorm";
import dotenv from "dotenv";
import { Product } from "./entity/product";
import amqplib from "amqplib";

dotenv.config();

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DATABASE_HOSTNAME,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Product],
  logging: false,
  synchronize: true,
});

AppDataSource.initialize()
  .then(async (db) => {
    const productRepository = db.getRepository(Product);

    try {
      const connection = await amqplib.connect(process.env.RABBITMQ_URI);
      const channel = await connection.createChannel();

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

      //GET Requests
      app.get(
        "/api/products",
        async (req: Request, res: Response): Promise<Response> => {
          const products = await productRepository.find();
          return res.json(products);
        }
      );

      app.get(
        `/api/products/:id`,
        async (req: Request, res: Response): Promise<Response> => {
          try {
            const id = parseInt(req.params.id);
            const product = await productRepository.findOne({
              where: { id },
            });

            if (!product) {
              return res.status(404).json({ error: "Product not found" });
            }

            return res.json(product);
          } catch (error) {
            return res.status(500).json({
              error: "An error occurred while retrieving the product",
            });
          }
        }
      );

      //POST Requests
      app.post(
        "/api/products",
        async (req: Request, res: Response): Promise<Response> => {
          try {
            const product = productRepository.create(req.body);
            const result = await productRepository.save(product);
            channel.sendToQueue(
              "product_created",
              Buffer.from(JSON.stringify(result))
            );
            return res.status(201).json(result);
          } catch (error) {
            return res.status(500).json({
              error: "An error occurred while creating the product.",
            });
          }
        }
      );

      app.post(
        "/api/products/:id/like",
        async (req: Request, res: Response): Promise<Response> => {
          try {
            const id = parseInt(req.params.id);
            const product = await productRepository.findOne({
              where: { id },
            });

            if (!product) {
              return res.status(404).json({ error: "Product not found" });
            }

            product.likes += 1;
            await productRepository.save(product);

            return res.json(product);
          } catch (error) {
            return res.status(500).json({
              error: "An error occurred while liking the product",
            });
          }
        }
      );

      //PUT Request
      app.put(
        "/api/products/:id",
        async (req: Request, res: Response): Promise<Response> => {
          try {
            const id = parseInt(req.params.id);
            const updateResult = await productRepository.update(id, req.body);

            if (!updateResult.affected) {
              return res.status(404).json({ error: "Product not found" });
            }

            const updatedProduct = await productRepository.findOne({
              where: { id },
            });
            //Sending the data to the RabbitMQ Channel
            channel.sendToQueue(
              "product_updated",
              Buffer.from(JSON.stringify(updatedProduct))
            );
            return res.json(updatedProduct);
          } catch (error) {
            return res.status(500).json({
              error: "An error occurred while updating the product",
            });
          }
        }
      );

      //DELETE Request
      app.delete(
        "/api/products/:id",
        async (req: Request, res: Response): Promise<Response> => {
          try {
            const id = parseInt(req.params.id);
            const deleteRequest = await productRepository.delete(id);

            if (!deleteRequest.affected) {
              return res.status(404).json({ error: "Product not found" });
            }

            channel.sendToQueue("product_deleted", Buffer.from(req.params.id));

            return res.status(200).json({
              message: "Product deleted successfully",
            });
          } catch (error) {
            return res.status(500).json({
              error: "An error occurred while deleting the product",
            });
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
      console.error("Error initializing RabbitMQ:", error);
    }
  })
  .catch((error) =>
    console.log("Error during Data Source initialization:", error)
  );
