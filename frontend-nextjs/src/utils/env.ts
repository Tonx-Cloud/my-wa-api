// Variáveis de ambiente tipadas
interface EnvVars {
    NEXT_PUBLIC_BACKEND_URL: string;
}

const env: EnvVars = {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
};

export const getEnvVar = (key: keyof EnvVars): string => {
    const value = env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};

export const getBackendUrl = (): string => {
    return getEnvVar('NEXT_PUBLIC_BACKEND_URL');
};

export const isDevEnvironment = (): boolean => {
    return process.env.NODE_ENV === 'development';
};

export const isProdEnvironment = (): boolean => {
    return process.env.NODE_ENV === 'production';
};
