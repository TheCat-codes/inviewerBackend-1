import z from 'zod';
import type { Login, Register } from '../types.js';
export declare const validateUser: (user: Login) => z.ZodSafeParseResult<{
    username: string;
    password: string;
}>;
export declare const validateRegister: (user: Register) => z.ZodSafeParseResult<{
    username: string;
    password: string;
    name: string;
    email: string;
    birthdate: string;
    code: string;
}>;
//# sourceMappingURL=zod.d.ts.map