import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const useWebSocket = (topics = [], onMessage, onConnect) => {
    const onMessageRef = useRef(onMessage);
    const onConnectRef = useRef(onConnect);

    useEffect(() => {
        onMessageRef.current = onMessage;
        onConnectRef.current = onConnect;
    });

    useEffect(() => {
        if (topics.length === 0) return;

        const token = localStorage.getItem('accessToken');
        const connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const client = new Client({
            webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL ?? '/ws'),
            connectHeaders,
            reconnectDelay: 5000,
            onConnect: () => {
                if (onConnectRef.current) onConnectRef.current();
                topics.forEach(topic => {
                    client.subscribe(topic, (msg) => {
                        try { onMessageRef.current(JSON.parse(msg.body)); } catch {}
                    });
                });
            },
        });

        client.activate();
        return () => {client.deactivate(); };
    }, [topics.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useWebSocket;