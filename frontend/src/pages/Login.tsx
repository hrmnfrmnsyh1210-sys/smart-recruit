import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      navigate('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message :
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Terjadi kesalahan';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card sx={{ maxWidth: 440, width: '100%' }} elevation={4}>
        <CardContent className="p-8">
          <Box className="text-center mb-6">
            <LeaderboardIcon color="primary" sx={{ fontSize: 48 }} />
            <Typography variant="h4" fontWeight={700} color="primary" className="mt-2">
              SmartRecruit
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              AI-Powered Resume Ranking System
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <TextField
                label="Nama Lengkap"
                fullWidth
                margin="normal"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              className="mt-4"
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : isLogin ? 'Masuk' : 'Daftar'}
            </Button>
          </form>

          <Box className="text-center mt-4">
            <Typography variant="body2">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
              >
                {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
