import express from 'express';
import cors from 'cors';
import { router } from './routes/routes.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { Models } from './models/models.js';
dotenv.config();
const app = express();
app.use(cors({
    origin: true, // Permite explícitamente el origen de tu frontend en el host
    credentials: true, // Permite el envío de cookies y cabeceras de autorización
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({
    limit: '50mb',
    type: (req) => !req.headers['content-type']?.startsWith('multipart/form-data')
}));
app.use(cookieParser());
app.use('/', router);
async function startServer() {
    try {
        // ¡Paso CRUCIAL! Inicializa la conexión a la base de datos con reintentos.
        // Esto se ejecuta una vez al inicio y espera hasta que la conexión esté lista.
        await Models.initializeConnection();
        console.log('Aplicación: La base de datos está lista y la conexión inicializada.');
        const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
        const HOST = process.env.HOST || '0.0.0.0';
        app.listen(PORT, HOST, () => {
            console.log(`Servidor escuchando en http://${HOST}:${PORT}`);
        });
    }
    catch (error) {
        console.error('🔴 Error crítico al iniciar la aplicación:', error);
        // Si la DB no pudo conectar después de todos los reintentos, salimos de la aplicación
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=app.js.map