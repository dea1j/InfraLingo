import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Architecture } from "./Architecture";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    passwordHash!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @OneToMany(() => Architecture, (architecture) => architecture.user)
    architectures!: Architecture[];
}