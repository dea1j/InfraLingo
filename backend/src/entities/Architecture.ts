import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity("architectures")
export class Architecture {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column("text")
    originalPrompt!: string;

    @Column()
    targetLanguage!: string;

    @Column("jsonb")
    nodesJson!: any;

    @Column("jsonb")
    edgesJson!: any;

    @Column("text")
    terraformCode!: string;

    @Column("text")
    readmeLocalized!: string;

    @Column("jsonb", { nullable: true })
    quizJson!: any;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, (user) => user.architectures, { nullable: true, onDelete: "CASCADE" })
    user!: User | null;
}