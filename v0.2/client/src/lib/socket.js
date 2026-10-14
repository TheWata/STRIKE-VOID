import { io } from 'socket.io-client';

const isProd = import.meta.env.PROD;
const customBackend = import.meta.env.VITE_BACKEND_URL;
const socketUrl = customBackend || (isProd ? '/' : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`);

export const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

