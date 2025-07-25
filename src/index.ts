import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from './logger';
import { readConfig, writeConfig } from './utils/config';
import session, { Store } from 'express-session'; // Reabilitado
import { createClient } from 'redis';
import RedisStore from 'connect-redis';

import multer from 'multer';
import cookieParser from 'cookie-parser';
import Joi from 'joi';
import { v4 as uuidv4 } from 'uuid';
import compression from 'compression';
import helmet from 'helmet'; // Added
import rateLimit from 'express-rate-limit'; // Added

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { performance } from 'perf_hooks'; // Added
import corsMiddleware from './utils/cors';

// Validação de variáveis obrigatórias
const requiredEnvVars = [
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Variável de ambiente ${varName} é obrigatória`);
    process.exit(1);
  }
});

interface User {
  id: string;
  googleId?: string | null;
  name: string;
  email: string;
  password?: string | null;
  profileImageUrl?: string | null;
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  company?: string;
  phone?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      file?: Express.Multer.File; // Adicionado para tipagem do Multer
    }
  }
}


const app = express();

// Aplicando middleware CORS
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://seu-dominio-frontend.com'
];

const corsOptions = {
  origin: function (origin: any, callback: any) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

const port: number = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET: string = process.env.JWT_SECRET as string;
const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET as string;

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
    try {
      let users: User[] = await getUsers();
      let user: User | undefined = users.find(u => u.googleId === profile.id);
      const email: string | null = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

      if (!user) {
        user = users.find(u => u.email === email);

        if (user) {
          user.googleId = profile.id;
          user.profileImageUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : user.profileImageUrl;
          user.plan = user.plan || 'free';
          user.role = user.role || 'user';
          await saveUsers(users);
        } else {
          user = {
            id: uuidv4(),
            googleId: profile.id,
            name: profile.displayName,
            email: email as string,
            password: null,
            profileImageUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            plan: 'free',
            role: 'user'
          };
          users.push(user);
          await saveUsers(users);
        }
      } else {
        user.plan = user.plan || 'free';
        user.role = user.role || 'user';
        await saveUsers(users);
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

passport.serializeUser((user: any, done: (err: any, id?: string) => void) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done: (err: any, user?: Express.User | undefined) => void) => {
  const users: User[] = await getUsers();
  const user: User | undefined = users.find(u => u.id === id);
  done(null, user);
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: "Muitas requisições a partir deste IP, por favor, tente novamente após 15 minutos."
});

app.use('/api/', limiter); // Aplica o rate limiting apenas às rotas de API

// Ordem correta de middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"], 
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        },
    },
})); // Headers de segurança
app.use(compression()); // Middleware de compressão
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Redis temporariamente desabilitado para simplificar
// const redisClient = createClient({
//     url: process.env.REDIS_URL || 'redis://localhost:6379'
// });

// redisClient.on('connect', () => logger.info('Conectado ao Redis!'));
// redisClient.on('error', err => logger.error('Erro na conexão com o Redis:', err));

// (async () => {
//     await redisClient.connect();
// })();

logger.debug('[Middleware] Inicializando express-session...');
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
    sameSite: 'lax'
  }
}));
logger.debug('[Middleware] express-session inicializado.');

logger.debug('[Middleware] Inicializando passport.initialize()...');
app.use(passport.initialize());
logger.debug('[Middleware] passport.initialize() inicializado.');

logger.debug('[Middleware] Inicializando passport.session()...');
app.use(passport.session()); // Reabilitado
logger.debug('[Middleware] passport.session() inicializado.');

// Diretório de uploads (único diretório estático necessário)
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));



// const Queue = require('bull');

// const messagesQueue = new Queue('messages', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// // Tratamento de erros Redis/Bull
// messagesQueue.on('error', (error) => {
//   console.error('❌ Erro na fila Redis:', error.message);
//   // Não parar o servidor por erro do Redis
// });

const messagesDir = path.join(__dirname, '../messages'); // Manter por enquanto para compatibilidade, mas será removido
const usersFilePath = path.join(__dirname, '../users.json');

// Funções auxiliares para usuários
async function getUsers(): Promise<User[]> {
    try {
        await fs.access(usersFilePath);
        const data = await fs.readFile(usersFilePath, 'utf8');
        return JSON.parse(data) as User[];
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function saveUsers(users: User[]): Promise<void> {
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
}

// Helper function to find user by email
async function findUserByEmail(email: string): Promise<User | undefined> {
    const users = await getUsers();
    return users.find(user => user.email === email);
}

// Middleware de proteção de API - verifica o token no cookie
const protectApi = (...roles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token; // Verifica o cookie
    logger.info(`[protectApi] Tentando proteger rota: ${req.originalUrl}`);
    logger.info(`[protectApi] Token no cookie: ${token ? 'Presente' : 'Ausente'}`);

    if (!token) {
        logger.warn(`[protectApi] Acesso não autorizado: Token não fornecido para ${req.originalUrl}`);
        return res.status(401).json({ success: false, message: 'Acesso não autorizado. Token não fornecido.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        logger.info(`[protectApi] Token decodificado com sucesso. ID do usuário: ${decoded.id}`);
        const users: User[] = await getUsers();
        const foundUser = users.find(u => u.id === decoded.id);
        if (!foundUser) {
            logger.warn(`[protectApi] Usuário não encontrado para o ID: ${decoded.id}`);
            return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
        }
        logger.info(`[protectApi] Usuário encontrado: ${foundUser.email}`);
        req.user = foundUser;
        if (roles.length && req.user && !roles.includes((req.user as User).role)) {
            logger.warn(`[protectApi] Acesso negado: Usuário ${foundUser.email} não tem permissão para a role ${roles.join(', ')}`);
            return res.status(403).json({ success: false, message: 'Acesso negado. Você não tem permissão para realizar esta ação.' });
        }
        next();
    } catch (error: any) {
        logger.error(`[protectApi] Erro na validação do token para ${req.originalUrl}: ${error.message}`);
        return res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
    }
};

// Middleware functions
// const protect = (...roles: string[]) => async (req: Request, res: Response, next: NextFunction) => { // Removido
//     const token = req.headers['authorization']?.split(' ')[1];
//     if (!token) {
//         return res.status(401).json({ success: false, message: 'Acesso não autorizado. Token não fornecido.' });
//     }
//     try {
//         const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
//         const users: User[] = await getUsers();
//         const foundUser = users.find(u => u.id === decoded.id);
//         if (!foundUser) {
//             return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
//         }
//         req.user = foundUser;
//         if (roles.length && req.user && !roles.includes((req.user as User).role)) {
//             return res.status(403).json({ success: false, message: 'Acesso negado. Você não tem permissão para realizar esta ação.' });
//         }
//         next();
//     } catch (error) {
//         return res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
//     }
// };

// const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => { // Removido
//     const token = req.cookies.token;
//     if (!token) {
//         return res.redirect('/login');
//     }
//     try {
//         jwt.verify(token, JWT_SECRET);
//         next();
//     }
//     catch (error) {
//         return res.redirect('/login');
//     }
// };

// const ensureAuthenticatedHtml = (req: Request, res: Response, next: NextFunction) => { // Removido
//     const token = req.cookies.token;
//     if (!token) {
//         return res.redirect('/login');
//     }
//     try {
//         jwt.verify(token, JWT_SECRET);
//         next();
//     }
//     catch (error) {
//         return res.redirect('/login');
//     }
// };

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        await fs.mkdir(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

(async () => {
    try {
        await fs.mkdir(uploadsDir, { recursive: true }); // Garante que o diretório de uploads exista
        await getUsers(); // Garante que o arquivo de usuários seja acessível ou criado
    } catch (err: any) {
        logger.error('Erro na inicialização:', { error: err.message });
    }
})();

app.use((req, res, next) => {
    const start = performance.now();
    res.on('finish', () => {
        const duration = performance.now() - start;
        logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
    });
    logger.info({ method: req.method, url: req.originalUrl, ip: req.ip });
    next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'WhatsApp API Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '3001'
    });
});

app.post('/api/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logout bem-sucedido.' });
});

// Rotas de Autenticação
app.post('/api/register', async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(3).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        company: Joi.string().optional().allow(''),
        phone: Joi.string().min(10).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { name, email, password, company, phone } = req.body;

    const users = await getUsers();
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'O e-mail já está em uso por outra conta.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = { 
        id: uuidv4(), 
        name, 
        email, 
        password: hashedPassword, 
        profileImageUrl: null, 
        plan: 'free', 
        role: 'user',
        company: company || undefined,
        phone: phone,
        createdAt: new Date()
    };
    users.push(newUser);
    await saveUsers(users);

    logger.info(`Novo usuário registrado: ${email} (${newUser.id})`);
    res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!' });
});

app.post('/api/login', async (req: Request, res: Response) => {
    try {
        const { email, password, remember } = req.body;

        // Validação básica
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }

        // Validação de formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        // Buscar usuário (ajustar conforme seu sistema)
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha incorretos'
            });
        }

        // Verificar senha
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha incorretos'
            });
        }
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email ou senha incorretos'
            });
        }

        // Gerar token JWT
        const tokenPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'user'
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { 
            expiresIn: remember ? '30d' : '24h' 
        } as any);

        // Definir cookie com o token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Correção: secure deve ser true apenas em produção
            maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 dias ou 24 horas
            sameSite: 'lax',
            path: '/' // Garante que o cookie seja enviado para todas as rotas
        });

        // Log de login
        logger.info(`Login realizado: ${user.email} (${user.id})`);

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                plan: user.plan
            },
            redirect: '/dashboard'
        });

    } catch (error: any) {
        logger.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rota para verificar token
app.get('/api/verify-token', protectApi(), (req: Request, res: Response) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Rota para sincronizar sessão NextAuth com backend
app.post('/api/auth/sync-session', async (req: Request, res: Response) => {
    try {
        const { email, name, id } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email é obrigatório para sincronizar sessão'
            });
        }

        // Buscar usuário no backend
        let user = await findUserByEmail(email);
        
        // Se não existir, criar usuário (para usuários autenticados via Google)
        if (!user) {
            const users: User[] = await getUsers();
            const newUser: User = {
                id: id || Date.now().toString(),
                name: name || email.split('@')[0],
                email,
                role: 'user',
                plan: 'free',
                createdAt: new Date()
                // password não é necessário para usuários OAuth
            };

            users.push(newUser);
            await saveUsers(users);
            user = newUser;
            logger.info(`Novo usuário criado via OAuth: ${email} (${user.id})`);
        }

        // Gerar token JWT para o usuário
        const tokenPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'user'
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { 
            expiresIn: '24h' 
        } as any);

        // Definir cookie com o token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 24 horas
            sameSite: 'lax',
            path: '/'
        });

        logger.info(`Sessão sincronizada para: ${user.email} (${user.id})`);

        res.json({
            success: true,
            message: 'Sessão sincronizada com sucesso',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                plan: user.plan
            }
        });

    } catch (error: any) {
        logger.error('Erro ao sincronizar sessão:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Rotas de autenticação Google
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/login?error=google_auth_failed',
    session: false
}), (req: Request, res: Response) => {
    try {
        const user = req.user as User;
        
        if (!user) {
            logger.error('Usuário não encontrado após autenticação Google');
            return res.redirect('/login?error=user_not_found');
        }
        
        // Gerar token JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role || 'user'
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Definir cookie com o token (Google Auth)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Correção: secure deve ser true apenas em produção
            sameSite: 'lax',
            path: '/', // Garante que o cookie seja enviado para todas as rotas
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });

        // Log de login bem-sucedido
        logger.info(`Login Google realizado: ${user.email} (${user.id})`);
        
        // Redirecionar para o dashboard
        res.redirect('/dashboard');
        
    } catch (error: any) {
        logger.error('Erro no callback Google:', error);
        res.redirect('/login?error=google_callback_failed');
    }
});

// Nova rota para sincronização com NextAuth Google
app.post('/api/auth/google-sync', async (req: Request, res: Response) => {
    try {
        const { googleId, email, name, image } = req.body;

        if (!googleId || !email) {
            return res.status(400).json({ success: false, message: 'GoogleId e email são obrigatórios' });
        }

        let users: User[] = await getUsers();
        let user: User | undefined = users.find(u => u.googleId === googleId);

        if (!user) {
            // Verificar se já existe um usuário com este email
            user = users.find(u => u.email === email);

            if (user) {
                // Atualizar usuário existente com googleId
                user.googleId = googleId;
                user.profileImageUrl = image || user.profileImageUrl;
                user.plan = user.plan || 'free';
                user.role = user.role || 'user';
            } else {
                // Criar novo usuário
                user = {
                    id: uuidv4(),
                    googleId: googleId,
                    name: name,
                    email: email,
                    password: null,
                    profileImageUrl: image || null,
                    plan: 'free',
                    role: 'user'
                };
                users.push(user);
            }

            await saveUsers(users);
            logger.info(`Usuário Google sincronizado: ${email} (${user.id})`);
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.plan
            }
        });

    } catch (error: any) {
        logger.error('Erro na sincronização Google:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});




app.get('/api/profile', protectApi(), async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    res.json(req.user);
});

app.post('/api/profile', protectApi(), async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'O nome é obrigatório.' });
    }

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    let users: User[] = await getUsers();
    const userIndex = users.findIndex(u => u.id === (req.user as User).id);

    if (userIndex !== -1) {
        users[userIndex].name = name;
        await saveUsers(users);
        res.json({ success: true, message: 'Perfil atualizado com sucesso!' });
    } else {
        res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
});

app.post('/api/profile/upload-image', protectApi(), upload.single('profileImage'), async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada.' });
    }

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    let users: User[] = await getUsers();
    const userIndex = users.findIndex(u => u.id === (req.user as User).id);

    if (userIndex !== -1) {
        if (users[userIndex].profileImageUrl) {
            const oldImagePath = path.join(uploadsDir, path.basename(users[userIndex].profileImageUrl as string));
            try {
                await fs.unlink(oldImagePath);
            } catch (error: any) {
                logger.error('Erro ao remover imagem antiga:', { error: error.message });
            }
        }

        users[userIndex].profileImageUrl = `/uploads/${req.file.filename}`;
        await saveUsers(users);
        res.json({ success: true, message: 'Imagem de perfil atualizada com sucesso!', imageUrl: users[userIndex].profileImageUrl });
    } else {
        res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
});

app.delete('/api/profile/image', protectApi(), async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }

    let users: User[] = await getUsers();
    const userIndex = users.findIndex(u => u.id === (req.user as User).id);

    if (userIndex !== -1) {
        if (users[userIndex].profileImageUrl) {
            const imagePath = path.join(uploadsDir, path.basename(users[userIndex].profileImageUrl as string));
            try {
                await fs.unlink(imagePath);
                users[userIndex].profileImageUrl = null;
                await saveUsers(users);
                res.json({ success: true, message: 'Imagem de perfil removida com sucesso!' });
            } catch (error: any) {
                logger.error('Erro ao remover imagem:', { error: error.message });
                res.status(500).json({ success: false, message: 'Erro ao remover imagem.' });
            }
        } else {
            res.status(400).json({ success: false, message: 'Nenhuma imagem de perfil para remover.' });
        }
    } else {
        res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
});



app.post('/api/instances/:id/send', protectApi(), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
    }

    const instance = whatsappManager.getInstance(id);
    if (!instance || instance.status !== 'connected') {
        return res.status(404).json({ error: 'Instância não encontrada ou não conectada.' });
    }

    try {
        await instance.messagesQueue.add({ number, message });
        logger.info(`Mensagem para ${number} enfileirada na instância ${id}.`);
        res.json({ success: true, message: 'Mensagem enfileirada para envio.' });
    } catch (error: any) {
        logger.error(`Erro ao enfileirar mensagem na instância ${id}:`, { error: error.message });
        res.status(500).json({ error: 'Erro ao enfileirar mensagem.' });
    }
});

app.get('/logs', protectApi('admin'), async (req: Request, res: Response) => {
    const logFilePath = path.join(__dirname, '..', 'logs', 'combined.log');
    try {
        const data = await fs.readFile(logFilePath, 'utf8');
        res.send(data);
    }  catch (err: any) {
        logger.error('Erro ao ler arquivo de log', { error: err.toString() });
        res.status(500).send('Erro ao ler o arquivo de log.');
    }
});

app.post('/maintenance', protectApi(), (req: Request, res: Response) => {
    const config = readConfig();
    config.maintenanceMode = !config.maintenanceMode;
    writeConfig(config);
    logger.info(`Modo de manutenção ${config.maintenanceMode ? 'ativado' : 'desativado'}.`);
    res.json({ success: true, maintenanceMode: config.maintenanceMode });
});



app.post('/restart-api', protectApi('admin'), (req: Request, res: Response) => {
    logger.info('Solicitação para reiniciar a API.');
    exec('pm2 restart api', (error: any, stdout: string, stderr: string) => {
        if (error) {
            logger.error(`Erro ao reiniciar API: ${error.message}`);
            return res.status(500).json({ success: false, message: `Erro ao reiniciar API: ${error.message}` });
        }
        if (stderr) {
            logger.warn(`Stderr ao reiniciar API: ${stderr}`);
        }
        logger.info(`API reiniciada: ${stdout}`);
        res.json({ success: true, message: 'API reiniciada com sucesso.' });
    });
});

app.get('/api/settings', protectApi(), (req: Request, res: Response) => {
    const config = readConfig();
    res.json(config);
});

app.post('/api/settings', protectApi(), (req: Request, res: Response) => {
    const newSettings = req.body;
    writeConfig(newSettings);
    logger.info('Configurações atualizadas.', newSettings);
    res.json({ success: true, message: 'Configurações salvas com sucesso!' });
});

app.get('/api/dashboard', protectApi(), (req: Request, res: Response) => {
    const dashboardData = {
        mensagensEnviadas: 1234,
        eventosWebhook: 5678,
        dias: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        valoresMensagens: [150, 230, 224, 218, 135, 147, 260],
        valoresEventos: [80, 120, 100, 90, 150, 130, 180]
    };
    res.json(dashboardData);
});

import * as whatsappManager from './whatsappManager';

// Listar instâncias
app.get('/api/instances', protectApi(), (req: Request, res: Response) => {
    res.json(whatsappManager.listInstances());
});

// Criar nova instância
app.post('/api/instances', protectApi(), async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
        const inst = await whatsappManager.createInstance(name);
        if (!inst || !inst.id) {
            return res.status(500).json({ error: 'Falha ao criar instância. Verifique o backend.' });
        }
        res.json({ id: inst.id, name: inst.name, status: inst.status });
    } catch (error: any) {
        console.error('Erro ao criar instância:', error);
        res.status(500).json({ error: 'Erro interno ao criar instância', details: error?.message });
    }
});

// Reiniciar instância
app.post('/api/instances/:id/restart', protectApi(), async (req: Request, res: Response) => {
    const { id } = req.params;
    if (await whatsappManager.restartInstance(id)) {
        res.json({ success: true, message: `Instância ${id} reiniciada com sucesso.` });
    } else {
        res.status(404).json({ error: 'Instância não encontrada' });
    }
});

// Desconectar instância
app.post('/api/instances/:id/disconnect', protectApi(), async (req: Request, res: Response) => {
    const { id } = req.params;
    if (await whatsappManager.disconnectInstance(id)) {
        res.json({ success: true, message: `Instância ${id} desconectada com sucesso.` });
    } else {
        res.status(404).json({ error: 'Instância não encontrada' });
    }
});

// Deletar instância
app.delete('/api/instances/:id', protectApi(), async (req: Request, res: Response) => {
    const { id } = req.params;
    if (await whatsappManager.deleteInstance(id)) {
        res.json({ success: true, message: `Instância ${id} deletada com sucesso.` });
    } else {
        res.status(404).json({ error: 'Instância não encontrada' });
    }
});

// Obter QR code
app.get('/api/instances/:id/qr', protectApi(), (req: Request, res: Response) => {
    const { id } = req.params;
    const qr = whatsappManager.getQr(id);
    if (qr) {
        res.json({ success: true, qrString: qr });
    } else {
        res.status(404).json({ error: 'QR code não disponível' });
    }
});

// ============================================================================
// CHAT ENDPOINTS
// ============================================================================

// Listar chats de uma instância
app.get('/api/instances/:instanceId/chats', protectApi(), async (req: Request, res: Response) => {
    try {
        const { instanceId } = req.params;
        const chats = await whatsappManager.getChats(instanceId);
        res.json({ chats, total: chats.length });
    } catch (error: any) {
        logger.error('Erro ao buscar chats:', error);
        res.status(500).json({ error: 'Erro ao buscar chats', details: error?.message });
    }
});

// Obter mensagens de um chat
app.get('/api/chats/:chatId/messages', protectApi(), async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        const messages = await whatsappManager.getChatMessages(
            chatId, 
            parseInt(limit as string), 
            parseInt(offset as string)
        );
        
        res.json({ 
            messages, 
            total: messages.length,
            hasMore: messages.length === parseInt(limit as string)
        });
    } catch (error: any) {
        logger.error('Erro ao buscar mensagens:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens', details: error?.message });
    }
});

// Enviar mensagem
app.post('/api/chats/:chatId/messages', protectApi(), async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const { message, quotedMessageId } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        const result = await whatsappManager.sendMessage(chatId, message.trim(), quotedMessageId);
        
        if (result.success) {
            res.json({ 
                messageId: result.messageId, 
                status: 'success' 
            });
        } else {
            res.status(500).json({ 
                status: 'error', 
                error: result.error || 'Falha ao enviar mensagem' 
            });
        }
    } catch (error: any) {
        logger.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ 
            status: 'error', 
            error: 'Erro interno ao enviar mensagem', 
            details: error?.message 
        });
    }
});

// Marcar mensagens como lidas
app.post('/api/chats/:chatId/mark-read', protectApi(), async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;
        const result = await whatsappManager.markChatAsRead(chatId);
        
        if (result) {
            res.json({ success: true, message: 'Chat marcado como lido' });
        } else {
            res.status(500).json({ error: 'Falha ao marcar chat como lido' });
        }
    } catch (error: any) {
        logger.error('Erro ao marcar chat como lido:', error);
        res.status(500).json({ error: 'Erro interno', details: error?.message });
    }
});

// Buscar contatos
app.get('/api/instances/:instanceId/contacts', protectApi(), async (req: Request, res: Response) => {
    try {
        const { instanceId } = req.params;
        const { search } = req.query;
        
        const contacts = await whatsappManager.getContacts(instanceId, search as string);
        res.json({ contacts, total: contacts.length });
    } catch (error: any) {
        logger.error('Erro ao buscar contatos:', error);
        res.status(500).json({ error: 'Erro ao buscar contatos', details: error?.message });
    }
});

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

// API para estatísticas do dashboard
app.get('/api/dashboard/stats', protectApi(), async (req, res) => {
    try {
        const stats = {
            activeInstances: await getActiveInstancesCount(),
            todayMessages: await getTodayMessagesCount(),
            deliveryRate: await getDeliveryRate(),
            onlineUsers: await getOnlineUsersCount()
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
});

// Funções auxiliares para obter estatísticas (mocadas por enquanto)
async function getActiveInstancesCount() {
    return 12; // Exemplo
}

async function getTodayMessagesCount() {
    return 1247; // Exemplo
}

async function getDeliveryRate() {
    return 98.5; // Exemplo
}

async function getOnlineUsersCount() {
    return 89; // Exemplo
}

// Middleware 404 para rotas inexistentes
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Middleware de erro global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erro no servidor:', err.message);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

// app.get(/^(?!.*\.(?:html|css|js|png|jpg|svg)$)\/? .*/, (req: Request, res: Response) => {
//   res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
// });

// Inicia o servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 API rodando em http://localhost:${port}`);
    console.log(`📁 Servindo arquivos estáticos de: ${path.join(__dirname, '..', 'public')}`);
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`);
  });
}

export default app;
