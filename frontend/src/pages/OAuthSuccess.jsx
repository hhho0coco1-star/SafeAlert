import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

export default function OAuthSuccess() {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (!accessToken || !refreshToken) {
            navigate('/login');
            return;
        }

        axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        }).then(res => {
            login(accessToken, refreshToken, res.data.data);
            navigate('/dashboard');
        }).catch(() => {
            navigate('/login');
        });
    }, []);

    return <div>로그인 처리 중...</div>;
}
