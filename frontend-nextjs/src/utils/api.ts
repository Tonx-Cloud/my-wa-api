import axios from 'axios';
import { getBackendUrl } from './env';
import { getSession } from 'next-auth/react';

export const api = axios.create({
    baseURL: getBackendUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Flag para evitar múltiplas tentativas de sync simultâneas
let isSyncing = false;

// Função para sincronizar sessão NextAuth com backend
export const syncSessionWithBackend = async (): Promise<boolean> => {
    if (isSyncing) return false;
    
    try {
        isSyncing = true;
        const session = await getSession();
        
        if (!session?.user?.email) {
            console.log('No session found for sync');
            return false;
        }

        // Fazer login no backend com os dados da sessão NextAuth
        const response = await fetch(`${getBackendUrl()}/api/auth/sync-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                email: session.user.email,
                name: session.user.name,
                id: session.user.id
            }),
        });

        if (response.ok) {
            console.log('Session synced successfully with backend');
            return true;
        } else {
            console.error('Failed to sync session with backend:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error syncing session with backend:', error);
        return false;
    } finally {
        isSyncing = false;
    }
};

// Interceptor para tentativa automática de sync em caso de 401
api.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401) {
            console.log('Received 401, attempting to sync session with backend');
            const syncSuccess = await syncSessionWithBackend();
            
            if (syncSuccess) {
                // Tentar novamente a requisição original
                console.log('Retrying original request after session sync');
                return api.request(error.config);
            }
        }
        
        if (error.response) {
            // O servidor respondeu com um status de erro
            console.error('API Error:', error.response.data);
            return Promise.reject(error.response.data);
        } else if (error.request) {
            // A requisição foi feita mas não houve resposta
            console.error('API Request Error:', error.request);
            return Promise.reject({ message: 'Não foi possível conectar ao servidor' });
        } else {
            // Algo aconteceu na configuração da requisição
            console.error('API Config Error:', error.message);
            return Promise.reject({ message: 'Erro ao processar a requisição' });
        }
    }
);
