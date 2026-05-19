import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const useWebSocket = (regions = [], onMessage) => {
    const clientRef = useRef(null);
}
