import mysql2 from 'mysql2/promise';
import type { Job, Skill, Solicitude, User } from '../types.js';
export declare class Models {
    private static _connection;
    static initializeConnection(): Promise<void>;
    private static getConnection;
    static sendCode: (email: string) => Promise<{
        message: string;
    } | undefined>;
    static verifyCode: (code: string, email: string) => Promise<{
        message: string;
    } | undefined>;
    static resetPassword: (email: string, code: string, newPassword: string) => Promise<{
        message: string;
    } | undefined>;
    static login: (username: string, password: string) => Promise<{
        user_id: Buffer;
        username: string;
        name: string;
    }>;
    static sendEmailCode: (email: string) => Promise<{
        message: string;
    } | undefined>;
    static verifyEmailCode: (email: string, code: string) => Promise<{
        message: string;
    } | undefined>;
    static register: ({ name, username, password, email, birthdate, code }: {
        name: string;
        username: string;
        password: string;
        email: string;
        birthdate: Date;
        code: string;
    }) => Promise<{
        message: string;
    }>;
    static getWorks: () => Promise<Job[] | undefined>;
    static getWorksByUser: ({ id }: {
        id: string;
    }) => Promise<Job[] | undefined>;
    static getUser: (id: string) => Promise<User | undefined>;
    static publishWork: ({ description, salary, boss, title }: {
        description: string;
        salary: number;
        boss: string;
        title: string;
    }) => Promise<{
        message: string;
    } | undefined>;
    static sendSolicitude: ({ work_id, cv_url, user_id }: {
        work_id: string;
        cv_url: string;
        user_id: string;
    }) => Promise<{
        message: string;
    } | undefined>;
    static getSolicitudesByWork: ({ id }: {
        id: string;
    }) => Promise<Solicitude[] | undefined>;
    static addSkills: ({ user_id, skill_id }: {
        user_id: string;
        skill_id: number;
    }) => Promise<{
        message: string;
    } | undefined>;
    static removeSkill: ({ user_id, skill }: {
        user_id: string;
        skill: string;
    }) => Promise<{
        message: string;
    } | undefined>;
    static searchSkills: (search: string) => Promise<mysql2.QueryResult | undefined>;
    static getWorksBySearch: ({ search }: {
        search: string;
    }) => Promise<Job[] | undefined>;
    static removeSolicitude: ({ work_id, user_id }: {
        work_id: string;
        user_id: string;
    }) => Promise<{
        message: string;
    } | undefined>;
    static getSkillsByUser: ({ id }: {
        id: string;
    }) => Promise<Skill[] | undefined>;
    static getSkills: () => Promise<string[] | undefined>;
    static removeJob: ({ id }: {
        id: string;
    }) => Promise<{
        message: string;
    } | undefined>;
    static getMySolicitudes: ({ id }: {
        id: string;
    }) => Promise<any>;
    static getSolicitudes: () => Promise<any>;
    static updateProfile: (name: string, username: string, user_id: string) => Promise<{
        message: string;
    } | undefined>;
}
//# sourceMappingURL=models.d.ts.map