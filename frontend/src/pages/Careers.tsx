import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Button, Grid,
  AppBar, Toolbar, Container, Skeleton, TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { publicService } from '../services/public';
import type { Job } from '../types';

export default function Careers() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    publicService
      .listOpenJobs()
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase()) ||
      j.skills_required?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Box className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <LeaderboardIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={700} color="primary" className="flex-1">
              SmartRecruit
            </Typography>
            <Button variant="text" onClick={() => navigate('/login')}>
              Login Rekruter
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero */}
      <Box className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight={800} className="mb-3">
            Temukan Karir Impianmu
          </Typography>
          <Typography variant="h6" className="mb-6 opacity-90">
            Bergabung dengan perusahaan terbaik. Lamar dengan mudah menggunakan CV kamu.
          </Typography>
          <TextField
            placeholder="Cari posisi, departemen, atau skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{
              maxWidth: 600,
              bgcolor: 'white',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': { border: 'none' },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography variant="body2" className="mt-3 opacity-75">
            {filtered.length} posisi tersedia
          </Typography>
        </Container>
      </Box>

      {/* Job Listings */}
      <Container maxWidth="lg" className="py-8">
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Grid size={{ xs: 12, md: 6 }} key={i}>
                  <Skeleton variant="rounded" height={220} />
                </Grid>
              ))
            : filtered.map((job) => (
                <Grid size={{ xs: 12, md: 6 }} key={job.id}>
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: 'primary.main', boxShadow: 3 },
                    }}
                  >
                    <CardContent className="p-6">
                      <Box className="flex justify-between items-start mb-3">
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {job.title}
                          </Typography>
                          <Box className="flex items-center gap-3 mt-1">
                            <Box className="flex items-center gap-1 text-gray-500">
                              <LocationOnIcon fontSize="small" />
                              <Typography variant="body2">{job.department}</Typography>
                            </Box>
                            {job.min_experience_years > 0 && (
                              <Box className="flex items-center gap-1 text-gray-500">
                                <WorkIcon fontSize="small" />
                                <Typography variant="body2">
                                  Min. {job.min_experience_years} tahun
                                </Typography>
                              </Box>
                            )}
                            {job.education_level && (
                              <Box className="flex items-center gap-1 text-gray-500">
                                <SchoolIcon fontSize="small" />
                                <Typography variant="body2">{job.education_level}</Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" className="mb-4 line-clamp-2">
                        {job.description}
                      </Typography>

                      <Box className="flex flex-wrap gap-1 mb-4">
                        {job.skills_required?.map((skill) => (
                          <Chip key={skill} label={skill} size="small" variant="outlined" color="primary" />
                        ))}
                      </Box>

                      <Box className="flex justify-between items-center">
                        <Typography variant="caption" color="text.secondary">
                          Diposting {new Date(job.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={() => navigate(`/apply/${job.id}`)}
                        >
                          Lamar Sekarang
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
        </Grid>

        {!loading && filtered.length === 0 && (
          <Box className="text-center py-16">
            <WorkIcon sx={{ fontSize: 64, color: 'action.disabled' }} />
            <Typography variant="h6" color="text.secondary" className="mt-3">
              {search ? 'Tidak ada lowongan yang cocok dengan pencarian.' : 'Belum ada lowongan tersedia saat ini.'}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
