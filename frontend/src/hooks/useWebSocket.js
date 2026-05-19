import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const useWebSocket = (topics = [], onMessage) => {
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    });

    useEffect(() => {
        if (topics.length === 0) return;

        const token = localStorage.getItem('accessToken');
        const connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            connectHeaders,
            reconnectDelay: 5000,
            onConnect: () => {
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