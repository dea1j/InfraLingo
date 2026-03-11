import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Architecture } from "./entities/Architecture";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    throw new Error("CRITICAL: DATABASE_URL environment variable is missing.");
}

export const AppDataSource = new DataSource({
    type: "postgres",
    url: dbUrl, 
    synchronize: true, 
    logging: false,
    entities: [User, Architecture],
    subscribers: [],
    migrations: [],
});