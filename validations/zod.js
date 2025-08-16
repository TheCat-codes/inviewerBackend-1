import z from 'zod';
const userSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    password: z.string().min(6, "Password must be at least 6 characters long")
});
const registerSchema = userSchema.extend({
    name: z.string().min(3, 'name must be longer'),
    email: z.string().min(10, 'email must have at least 10 chars'),
    birthdate: z.string({ message: 'select your birthdate' }),
    code: z.string()
});
export const validateUser = (user) => {
    return userSchema.safeParse(user);
};
export const validateRegister = (user) => {
    return registerSchema.safeParse(user);
};
//# sourceMappingURL=zod.js.map