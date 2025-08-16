import type { Request, Response } from "express";
export declare class Controllers {
    static sendCode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static verifyCode: (req: Request, res: Response) => Promise<void>;
    static resetPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static verify: (req: Request, res: Response) => void;
    static logout: (req: Request, res: Response) => void;
    static sendEmailCode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static verifyEmailCode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getWorks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static publishWork: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static sendSolicitude: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getSolicitudesByWork: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static addSkills: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static removeSkill: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static searchSkill: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getWorksBySearch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static removeSolicitude: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getSKillsByUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getSkills: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getJobsByUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static removeJob: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getMySolicitudes: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getSolicitudes: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=controller.d.ts.map