"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var typeorm_1 = require("typeorm");
var dotenv_1 = __importDefault(require("dotenv"));
var product_1 = require("./entity/product");
var amqplib_1 = __importDefault(require("amqplib"));
dotenv_1.default.config();
var AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: process.env.DATABASE_HOSTNAME,
    port: parseInt(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [product_1.Product],
    logging: false,
    synchronize: true,
});
AppDataSource.initialize()
    .then(function (db) { return __awaiter(void 0, void 0, void 0, function () {
    var productRepository, connection_1, channel_1, app, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                productRepository = db.getRepository(product_1.Product);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, amqplib_1.default.connect(process.env.RABBITMQ_URI)];
            case 2:
                connection_1 = _a.sent();
                return [4 /*yield*/, connection_1.createChannel()];
            case 3:
                channel_1 = _a.sent();
                app = (0, express_1.default)();
                app.use((0, cors_1.default)({
                    origin: [
                        "http://localhost:3000",
                        "http://localhost:8080",
                        "http://localhost:4200",
                    ],
                }));
                app.use(express_1.default.json());
                //GET Requests
                app.get("/api/products", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var products;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, productRepository.find()];
                            case 1:
                                products = _a.sent();
                                return [2 /*return*/, res.json(products)];
                        }
                    });
                }); });
                app.get("/api/products/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var id, product, error_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                id = parseInt(req.params.id);
                                return [4 /*yield*/, productRepository.findOne({
                                        where: { id: id },
                                    })];
                            case 1:
                                product = _a.sent();
                                if (!product) {
                                    return [2 /*return*/, res.status(404).json({ error: "Product not found" })];
                                }
                                return [2 /*return*/, res.json(product)];
                            case 2:
                                error_2 = _a.sent();
                                return [2 /*return*/, res.status(500).json({
                                        error: "An error occurred while retrieving the product",
                                    })];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                //POST Requests
                app.post("/api/products", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var product, result, error_3;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                product = productRepository.create(req.body);
                                return [4 /*yield*/, productRepository.save(product)];
                            case 1:
                                result = _a.sent();
                                channel_1.sendToQueue("product_created", Buffer.from(JSON.stringify(result)));
                                return [2 /*return*/, res.status(201).json(result)];
                            case 2:
                                error_3 = _a.sent();
                                return [2 /*return*/, res.status(500).json({
                                        error: "An error occurred while creating the product.",
                                    })];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                app.post("/api/products/:id/like", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var id, product, error_4;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 3, , 4]);
                                id = parseInt(req.params.id);
                                return [4 /*yield*/, productRepository.findOne({
                                        where: { id: id },
                                    })];
                            case 1:
                                product = _a.sent();
                                if (!product) {
                                    return [2 /*return*/, res.status(404).json({ error: "Product not found" })];
                                }
                                product.likes += 1;
                                return [4 /*yield*/, productRepository.save(product)];
                            case 2:
                                _a.sent();
                                return [2 /*return*/, res.json(product)];
                            case 3:
                                error_4 = _a.sent();
                                return [2 /*return*/, res.status(500).json({
                                        error: "An error occurred while liking the product",
                                    })];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                //PUT Request
                app.put("/api/products/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var id, updateResult, updatedProduct, error_5;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 3, , 4]);
                                id = parseInt(req.params.id);
                                return [4 /*yield*/, productRepository.update(id, req.body)];
                            case 1:
                                updateResult = _a.sent();
                                if (!updateResult.affected) {
                                    return [2 /*return*/, res.status(404).json({ error: "Product not found" })];
                                }
                                return [4 /*yield*/, productRepository.findOne({
                                        where: { id: id },
                                    })];
                            case 2:
                                updatedProduct = _a.sent();
                                //Sending the data to the RabbitMQ Channel
                                channel_1.sendToQueue("product_updated", Buffer.from(JSON.stringify(updatedProduct)));
                                return [2 /*return*/, res.json(updatedProduct)];
                            case 3:
                                error_5 = _a.sent();
                                return [2 /*return*/, res.status(500).json({
                                        error: "An error occurred while updating the product",
                                    })];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                //DELETE Request
                app.delete("/api/products/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    var id, deleteRequest, error_6;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                id = parseInt(req.params.id);
                                return [4 /*yield*/, productRepository.delete(id)];
                            case 1:
                                deleteRequest = _a.sent();
                                if (!deleteRequest.affected) {
                                    return [2 /*return*/, res.status(404).json({ error: "Product not found" })];
                                }
                                channel_1.sendToQueue("product_deleted", Buffer.from(req.params.id));
                                return [2 /*return*/, res.status(200).json({
                                        message: "Product deleted successfully",
                                    })];
                            case 2:
                                error_6 = _a.sent();
                                return [2 /*return*/, res.status(500).json({
                                        error: "An error occurred while deleting the product",
                                    })];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                app.listen(parseInt(process.env.PORT), function () {
                    return console.log("Listening to port ".concat(process.env.PORT));
                });
                process.on("beforeExit", function () {
                    console.log("Closing the RabbitMQ Channel connection...");
                    connection_1.close();
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error("Error initializing RabbitMQ:", error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); })
    .catch(function (error) {
    return console.log("Error during Data Source initialization:", error);
});
