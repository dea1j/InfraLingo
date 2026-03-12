import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("CRITICAL: JWT_SECRET environment variable is missing.");
}

export class AuthService {
    private static userRepository = AppDataSource.getRepository(User);

    static async register(email: string, password: string) {
        const existingUser = await this.userRepository.findOneBy({ email });
        if (existingUser) {
            throw new Error("EMAIL_EXISTS");
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = this.userRepository.create({ email, passwordHash });
        await this.userRepository.save(newUser);

        const token = jwt.sign({ id: newUser.id }, jwtSecret as string, { expiresIn: "7d" });
        return { token, user: { id: newUser.id, email: newUser.email } };
    }

    static async login(email: string, password: string) {
        const user = await this.userRepository.findOneBy({ email });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const token = jwt.sign({ id: user.id }, jwtSecret as string, { expiresIn: "7d" });
        return { token, user: { id: user.id, email: user.email } };
    }

    static async handleGithubAuth(email: string) {
        let user = await this.userRepository.findOneBy({ email });

        if (!user) {
            const randomDummyPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const passwordHash = await bcrypt.hash(randomDummyPassword, 10);
            
            user = this.userRepository.create({ email, passwordHash });
            await this.userRepository.save(user);
        }

        const token = jwt.sign({ id: user.id }, jwtSecret as string, { expiresIn: "7d" });
        return { token, user: { id: user.id, email: user.email } };
    }
}