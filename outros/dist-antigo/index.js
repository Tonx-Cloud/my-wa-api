"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const child_process_1 = require("child_process");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("./logger"));
const config_1 = require("./utils/config");
const express_session_1 = __importDefault(require("express-session")); // Reabilitado
const multer_1 = __importDefault(require("multer"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const joi_1 = __importDefault(require("joi"));
const uuid_1 = require("uuid");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet")); // Added
const express_rate_limit_1 = __importDefault(require("express-rate-limit")); // Added
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const perf_hooks_1 = require("perf_hooks"); // Added
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
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let users = await getUsers();
        let user = users.find(u => u.googleId === profile.id);
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        if (!user) {
            user = users.find(u => u.email === email);
            if (user) {
                user.googleId = profile.id;
                user.profileImageUrl = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : user.profileImageUrl;
                user.plan = user.plan || 'free';
                user.role = user.role || 'user';
                await saveUsers(users);
            }
            else {
                user = {
                    id: (0, uuid_1.v4)(),
                    googleId: profile.id,
                    name: profile.displayName,
                    email: email,
                    password: null,
                    profileImageUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
                    plan: 'free',
                    role: 'user'
                };
                users.push(user);
                await saveUsers(users);
            }
        }
        else {
            user.plan = user.plan || 'free';
            user.role = user.role || 'user';
            await saveUsers(users);
        }
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    const users = await getUsers();
    const user = users.find(u => u.id === id);
    done(null, user);
});
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: "Muitas requisições a partir deste IP, por favor, tente novamente após 15 minutos."
});
app.use('/api/', limiter); // Aplica o rate limiting apenas às rotas de API
// Ordem correta de middleware
app.use((0, helmet_1.default)({
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
app.use((0, compression_1.default)()); // Middleware de compressão
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('connect', () => logger_1.default.info('Conectado ao Redis!'));
redisClient.on('error', err => logger_1.default.error('Erro na conexão com o Redis:', err));
(async () => {
    await redisClient.connect();
})();
logger_1.default.debug('[Middleware] Inicializando express-session com Redis...');
app.use((0, express_session_1.default)({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false
}));
logger_1.default.debug('[Middleware] express-session com Redis inicializado.');
logger_1.default.debug('[Middleware] Inicializando passport.initialize()...');
app.use(passport_1.default.initialize());
logger_1.default.debug('[Middleware] passport.initialize() inicializado.');
logger_1.default.debug('[Middleware] Inicializando passport.session()...');
app.use(passport_1.default.session()); // Reabilitado
logger_1.default.debug('[Middleware] passport.session() inicializado.');
// Servir arquivos estáticos otimizados
app.use('/css', express_1.default.static(path_1.default.join(__dirname, '../public/css'), {
    maxAge: '1d',
    etag: true
}));
app.use('/js', express_1.default.static(path_1.default.join(__dirname, '../public/js'), {
    maxAge: '1d',
    etag: true
}));
// Arquivos estáticos por último
const uploadsDir = path_1.default.join(__dirname, '..', 'public', 'uploads'); // Moved up for use in app.use
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
app.use('/uploads', express_1.default.static(uploadsDir));
const stateFilePath = path_1.default.join(__dirname, '../state.json');
// const Queue = require('bull');
// const messagesQueue = new Queue('messages', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
// // Tratamento de erros Redis/Bull
// messagesQueue.on('error', (error) => {
//   console.error('❌ Erro na fila Redis:', error.message);
//   // Não parar o servidor por erro do Redis
// });
const messagesDir = path_1.default.join(__dirname, '../messages'); // Manter por enquanto para compatibilidade, mas será removido
const usersFilePath = path_1.default.join(__dirname, '../users.json');
// Funções auxiliares para usuários
async function getUsers() {
    try {
        await promises_1.default.access(usersFilePath);
        const data = await promises_1.default.readFile(usersFilePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}
async function saveUsers(users) {
    await promises_1.default.writeFile(usersFilePath, JSON.stringify(users, null, 2));
}
// Helper function to find user by email
async function findUserByEmail(email) {
    const users = await getUsers();
    return users.find(user => user.email === email);
}
// Middleware de proteção de API - verifica o token no cookie
const protectApi = (...roles) => async (req, res, next) => {
    const token = req.cookies.token; // Verifica o cookie
    logger_1.default.info(`[protectApi] Tentando proteger rota: ${req.originalUrl}`);
    logger_1.default.info(`[protectApi] Token no cookie: ${token ? 'Presente' : 'Ausente'}`);
    if (!token) {
        logger_1.default.warn(`[protectApi] Acesso não autorizado: Token não fornecido para ${req.originalUrl}`);
        return res.status(401).json({ success: false, message: 'Acesso não autorizado. Token não fornecido.' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        logger_1.default.info(`[protectApi] Token decodificado com sucesso. ID do usuário: ${decoded.id}`);
        const users = await getUsers();
        const foundUser = users.find(u => u.id === decoded.id);
        if (!foundUser) {
            logger_1.default.warn(`[protectApi] Usuário não encontrado para o ID: ${decoded.id}`);
            return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
        }
        logger_1.default.info(`[protectApi] Usuário encontrado: ${foundUser.email}`);
        req.user = foundUser;
        if (roles.length && req.user && !roles.includes(req.user.role)) {
            logger_1.default.warn(`[protectApi] Acesso negado: Usuário ${foundUser.email} não tem permissão para a role ${roles.join(', ')}`);
            return res.status(403).json({ success: false, message: 'Acesso negado. Você não tem permissão para realizar esta ação.' });
        }
        next();
    }
    catch (error) {
        logger_1.default.error(`[protectApi] Erro na validação do token para ${req.originalUrl}: ${error.message}`);
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
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        await promises_1.default.mkdir(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
(async () => {
    try {
        await promises_1.default.mkdir(uploadsDir, { recursive: true }); // Garante que o diretório de uploads exista
        await getUsers(); // Garante que o arquivo de usuários seja acessível ou criado
    }
    catch (err) {
        logger_1.default.error('Erro na inicialização:', { error: err.message });
    }
})();
app.use((req, res, next) => {
    const start = perf_hooks_1.performance.now();
    res.on('finish', () => {
        const duration = perf_hooks_1.performance.now() - start;
        logger_1.default.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
    });
    logger_1.default.info({ method: req.method, url: req.originalUrl, ip: req.ip });
    next();
});
// A rota /dashboard não precisa mais de middleware, pois a SPA lida com a proteção no frontend
app.get('/dashboard', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
app.post('/api/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logout bem-sucedido.' });
});
// A rota /profile também é gerenciada pela SPA, o middleware aqui é desnecessário
app.get('/profile', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
// Rotas de Autenticação
app.post('/api/register', async (req, res) => {
    const schema = joi_1.default.object({
        name: joi_1.default.string().min(3).required(),
        email: joi_1.default.string().email().required(),
        password: joi_1.default.string().min(6).required(),
        company: joi_1.default.string().optional().allow(''),
        phone: joi_1.default.string().min(10).required()
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
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const newUser = {
        id: (0, uuid_1.v4)(),
        name,
        email,
        password: hashedPassword,
        profileImageUrl: null,
        plan: 'free',
        role: 'user',
        company: company || undefined,
        phone: phone
    };
    users.push(newUser);
    await saveUsers(users);
    logger_1.default.info(`Novo usuário registrado: ${email} (${newUser.id})`);
    res.status(201).json({ success: true, message: 'Usuário cadastrado com sucesso!' });
});
app.post('/api/login', async (req, res) => {
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
        const passwordValid = await bcryptjs_1.default.compare(password, user.password);
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
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, {
            expiresIn: remember ? '30d' : '24h'
        });
        // Definir cookie com o token
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Correção: secure deve ser true apenas em produção
            maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 dias ou 24 horas
            sameSite: 'lax',
            path: '/' // Garante que o cookie seja enviado para todas as rotas
        });
        // Log de login
        logger_1.default.info(`Login realizado: ${user.email} (${user.id})`);
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
    }
    catch (error) {
        logger_1.default.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});
// Rota para verificar token
app.get('/api/verify-token', protectApi(), (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});
// Rotas de autenticação Google
app.get('/auth/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false }));
app.get('/auth/google/callback', passport_1.default.authenticate('google', {
    failureRedirect: '/login?error=google_auth_failed',
    session: false
}), (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            logger_1.default.error('Usuário não encontrado após autenticação Google');
            return res.redirect('/login?error=user_not_found');
        }
        // Gerar token JWT
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'user'
        }, JWT_SECRET, { expiresIn: '24h' });
        // Definir cookie com o token (Google Auth)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Correção: secure deve ser true apenas em produção
            sameSite: 'lax',
            path: '/', // Garante que o cookie seja enviado para todas as rotas
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });
        // Log de login bem-sucedido
        logger_1.default.info(`Login Google realizado: ${user.email} (${user.id})`);
        // Redirecionar para o dashboard
        res.redirect('/dashboard');
    }
    catch (error) {
        logger_1.default.error('Erro no callback Google:', error);
        res.redirect('/login?error=google_callback_failed');
    }
});
app.get('/api/profile', protectApi(), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    res.json(req.user);
});
app.post('/api/profile', protectApi(), async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'O nome é obrigatório.' });
    }
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    let users = await getUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex !== -1) {
        users[userIndex].name = name;
        await saveUsers(users);
        res.json({ success: true, message: 'Perfil atualizado com sucesso!' });
    }
    else {
        res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
});
app.post('/api/profile/upload-image', protectApi(), upload.single('profileImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada.' });
    }
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    let users = await getUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex !== -1) {
        if (users[userIndex].profileImageUrl) {
            const oldImagePath = path_1.default.join(uploadsDir, path_1.default.basename(users[userIndex].profileImageUrl));
            try {
                await promises_1.default.unlink(oldImagePath);
            }
            catch (error) {
                logger_1.default.error('Erro ao remover imagem antiga:', { error: error.message });
            }
        }
        users[userIndex].profileImageUrl = `/uploads/${req.file.filename}`;
        await saveUsers(users);
        res.json({ success: true, message: 'Imagem de perfil atualizada com sucesso!', imageUrl: users[userIndex].profileImageUrl });
    }
    else {
        res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
});
app.delete('/api/profile/image', protectApi(), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Usuário não autenticado.' });
    }
    let users = await getUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);
    if (userIndex !== -1) {
        if (users[userIndex].profileImageUrl) {
            const imagePath = path_1.default.join(uploadsDir, path_1.default.basename(users[userIndex].profileImageUrl));
            try {
                await promises_1.default.unlink(imagePath);
                users[userIndex].profileImageUrl = null;
                await saveUsers(users);
                res.json({ success: true, message: 'Imagem de perfil removida com sucesso!' });
            }
            catch (error) {
                logger_1.default.error('Erro ao remover imagem:', { error: error.message });
                res.status(500).json({ success: false, message: 'Erro ao remover imagem.' });
            }
        }
        else {
            res.status(400).json({ success: false, message: 'Nenhuma imagem de perfil para remover.' });
        }
    }
    else {
        res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }
});
app.get('/status', protectApi(), async (req, res) => {
    try {
        const stateData = await promises_1.default.readFile(stateFilePath, 'utf8');
        const state = JSON.parse(stateData);
        const config = (0, config_1.readConfig)();
        res.json({ ...state, maintenanceMode: config.maintenanceMode });
    }
    catch (error) {
        logger_1.default.error('Erro ao ler ou parsear arquivos de estado/configuração', { error: error.message, stack: error.stack });
        res.status(500).json({ status: 'error', qrCode: null, maintenanceMode: false, errorMessage: `Erro interno do servidor: ${error.message}` });
    }
});
app.post('/send', protectApi(), async (req, res) => {
    const config = (0, config_1.readConfig)();
    if (config.maintenanceMode) {
        logger_1.default.warn('Tentativa de envio de mensagem durante o modo de manutenção.');
        return res.status(503).json({ success: false, message: 'Serviço em modo de manutenção. Tente novamente mais tarde.' });
    }
    const { number, message } = req.body;
    if (!number || !message) {
        logger_1.default.warn('Tentativa de envio de mensagem com dados ausentes', { number, message });
        return res.status(400).json({ error: 'Número e mensagem são obrigatórios.' });
    }
    res.status(501).json({ success: false, message: 'Funcionalidade de envio temporariamente desabilitada.' });
});
app.get('/logs', protectApi('admin'), async (req, res) => {
    const logFilePath = path_1.default.join(__dirname, '..', 'logs', 'combined.log');
    try {
        const data = await promises_1.default.readFile(logFilePath, 'utf8');
        res.send(data);
    }
    catch (err) {
        logger_1.default.error('Erro ao ler arquivo de log', { error: err.toString() });
        res.status(500).send('Erro ao ler o arquivo de log.');
    }
});
app.post('/maintenance', protectApi(), (req, res) => {
    const config = (0, config_1.readConfig)();
    config.maintenanceMode = !config.maintenanceMode;
    (0, config_1.writeConfig)(config);
    logger_1.default.info(`Modo de manutenção ${config.maintenanceMode ? 'ativado' : 'desativado'}.`);
    res.json({ success: true, maintenanceMode: config.maintenanceMode });
});
app.post('/restart-bot', protectApi('admin'), (req, res) => {
    logger_1.default.info('Solicitação para reiniciar o bot.');
    (0, child_process_1.exec)('pm2 restart bot', (error, stdout, stderr) => {
        if (error) {
            logger_1.default.error(`Erro ao reiniciar bot: ${error.message}`);
            return res.status(500).json({ success: false, message: `Erro ao reiniciar bot: ${error.message}` });
        }
        if (stderr) {
            logger_1.default.warn(`Stderr ao reiniciar bot: ${stderr}`);
        }
        logger_1.default.info(`Bot reiniciado: ${stdout}`);
        res.json({ success: true, message: 'Bot reiniciado com sucesso.' });
    });
});
app.post('/restart-api', protectApi('admin'), (req, res) => {
    logger_1.default.info('Solicitação para reiniciar a API.');
    (0, child_process_1.exec)('pm2 restart api', (error, stdout, stderr) => {
        if (error) {
            logger_1.default.error(`Erro ao reiniciar API: ${error.message}`);
            return res.status(500).json({ success: false, message: `Erro ao reiniciar API: ${error.message}` });
        }
        if (stderr) {
            logger_1.default.warn(`Stderr ao reiniciar API: ${stderr}`);
        }
        logger_1.default.info(`API reiniciada: ${stdout}`);
        res.json({ success: true, message: 'API reiniciada com sucesso.' });
    });
});
app.get('/api/settings', protectApi(), (req, res) => {
    const config = (0, config_1.readConfig)();
    res.json(config);
});
app.post('/api/settings', protectApi(), (req, res) => {
    const newSettings = req.body;
    (0, config_1.writeConfig)(newSettings);
    logger_1.default.info('Configurações atualizadas.', newSettings);
    res.json({ success: true, message: 'Configurações salvas com sucesso!' });
});
app.get('/api/dashboard', protectApi(), (req, res) => {
    const dashboardData = {
        mensagensEnviadas: 1234,
        eventosWebhook: 5678,
        dias: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        valoresMensagens: [150, 230, 224, 218, 135, 147, 260],
        valoresEventos: [80, 120, 100, 90, 150, 130, 180]
    };
    res.json(dashboardData);
});
app.get('/api/instances', protectApi(), (req, res) => {
    // TODO: Substituir com a lógica real para buscar instâncias do banco de dados ou de um arquivo de configuração
    const mockInstances = [
        { id: 'inst_001', name: 'Instância de Vendas', status: 'connected' },
        { id: 'inst_002', name: 'Instância de Suporte', status: 'disconnected' },
        { id: 'inst_003', name: 'Instância de Marketing', status: 'connected' },
        { id: 'inst_004', name: 'Instância de Testes', status: 'disconnected' },
    ];
    res.json(mockInstances);
});
// Rota para reiniciar uma instância (mock)
app.post('/api/instances/:id/restart', protectApi(), (req, res) => {
    const { id } = req.params;
    logger_1.default.info(`Solicitação para reiniciar a instância ${id}`);
    // Lógica de reinício aqui
    res.json({ success: true, message: `Instância ${id} reiniciada com sucesso.` });
});
// Rota para desconectar uma instância (mock)
app.post('/api/instances/:id/disconnect', protectApi(), (req, res) => {
    const { id } = req.params;
    logger_1.default.info(`Solicitação para desconectar a instância ${id}`);
    // Lógica de desconexão aqui
    res.json({ success: true, message: `Instância ${id} desconectada com sucesso.` });
});
// Rota para deletar uma instância (mock)
app.delete('/api/instances/:id', protectApi(), (req, res) => {
    const { id } = req.params;
    logger_1.default.info(`Solicitação para deletar a instância ${id}`);
    // Lógica de exclusão aqui
    res.json({ success: true, message: `Instância ${id} deletada com sucesso.` });
});
// Rota para obter o QR code de uma instância (mock)
app.get('/api/instances/:id/qr', protectApi(), (req, res) => {
    const { id } = req.params;
    logger_1.default.info(`Solicitação de QR Code para a instância ${id}`);
    // Lógica para gerar e retornar o QR code aqui
    // Retornando uma imagem de QR code de exemplo (placeholder)
    const mockQrString = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // Pixel transparente
    res.json({ success: true, qrString: mockQrString });
});
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
    }
    catch (error) {
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
app.use((err, req, res, next) => {
    console.error('❌ Erro no servidor:', err.message);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
    });
});
app.get(/^(?!.*\.(?:html|css|js|png|jpg|svg)$)\/?.*/, (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
// Inicia o servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 API rodando em http://localhost:${port}`);
        console.log(`📁 Servindo arquivos estáticos de: ${path_1.default.join(__dirname, '..', 'public')}`);
        console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`);
    });
}
exports.default = app;
