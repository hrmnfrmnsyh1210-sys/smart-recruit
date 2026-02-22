import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  AppBar, Toolbar, Container, Chip, Alert, LinearProgress,
  CircularProgress, Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { useDropzone } from 'react-dropzone';
import { publicService } from '../services/public';
import type { Job } from '../types';

export default function Apply() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [resultMessage, setResultMessage] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!jobId) return;
    publicService
      .getJobDetail(Number(jobId))
      .then(setJob)
      .catch(() => setError('Lowongan tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobId) return;

    setSubmitting(true);
    setError('');
    try {
      const result = await publicService.apply(
        { full_name: fullName, email, phone, job_id: Number(jobId) },
        file,
        setUploadProgress,
      );
      setSubmitted(true);
      setResultMessage(result.message);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Gagal mengirim lamaran. Silakan coba lagi.';
      setError(msg);
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <Box className="min-h-screen flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  // Success state
  if (submitted) {
    return (
      <Box className="min-h-screen bg-gray-50">
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters>
              <LeaderboardIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={700} color="primary">SmartRecruit</Typography>
            </Toolbar>
          </Container>
        </AppBar>
        <Container maxWidth="sm" className="py-16">
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent className="p-8 text-center">
              <CheckCircleIcon sx={{ fontSize: 80 }} color="success" />
              <Typography variant="h4" fontWeight={700} className="mt-4 mb-2">
                Lamaran Terkirim!
              </Typography>
              <Typography variant="body1" color="text.secondary" className="mb-6">
                {resultMessage}
              </Typography>
              <Typography variant="body2" color="text.secondary" className="mb-6">
                Tim rekrutmen kami akan meninjau lamaran kamu. Jika profil kamu sesuai, kami akan menghubungi melalui email.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/careers')}>
                Lihat Lowongan Lain
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

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
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/careers')}>
              Semua Lowongan
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" className="py-8">
        <Grid container spacing={4}>
          {/* Job Detail - Left */}
          <Grid size={{ xs: 12, md: 5 }}>
            {job && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', position: 'sticky', top: 80 }}>
                <CardContent className="p-6">
                  <Typography variant="h5" fontWeight={700} className="mb-2">
                    {job.title}
                  </Typography>
                  <Typography variant="body1" color="primary" fontWeight={600} className="mb-4">
                    {job.department}
                  </Typography>

                  <Box className="flex flex-wrap gap-3 mb-4">
                    {job.min_experience_years > 0 && (
                      <Box className="flex items-center gap-1 text-gray-600">
                        <WorkIcon fontSize="small" />
                        <Typography variant="body2">Min. {job.min_experience_years} tahun pengalaman</Typography>
                      </Box>
                    )}
                    {job.education_level && (
                      <Box className="flex items-center gap-1 text-gray-600">
                        <SchoolIcon fontSize="small" />
                        <Typography variant="body2">{job.education_level}</Typography>
                      </Box>
                    )}
                  </Box>

                  <Typography variant="subtitle2" fontWeight={600} className="mb-2">
                    Deskripsi
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="mb-4 whitespace-pre-line">
                    {job.description}
                  </Typography>

                  {job.requirements && (
                    <>
                      <Typography variant="subtitle2" fontWeight={600} className="mb-2">
                        Persyaratan
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-4 whitespace-pre-line">
                        {job.requirements}
                      </Typography>
                    </>
                  )}

                  <Typography variant="subtitle2" fontWeight={600} className="mb-2">
                    Skills yang Dibutuhkan
                  </Typography>
                  <Box className="flex flex-wrap gap-1">
                    {job.skills_required?.map((skill) => (
                      <Chip key={skill} label={skill} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Application Form - Right */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent className="p-6">
                <Typography variant="h5" fontWeight={700} className="mb-1">
                  Formulir Lamaran
                </Typography>
                <Typography variant="body2" color="text.secondary" className="mb-6">
                  Isi data diri kamu dan upload CV untuk melamar posisi ini.
                </Typography>

                {error && (
                  <Alert severity="error" className="mb-4" onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Box className="space-y-4">
                    <TextField
                      label="Nama Lengkap"
                      fullWidth
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                    />
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh@email.com"
                    />
                    <TextField
                      label="Nomor Telepon"
                      fullWidth
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 812 xxxx xxxx"
                    />

                    {/* CV Upload */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} className="mb-2">
                        Upload CV *
                      </Typography>
                      {file ? (
                        <Box
                          className="border-2 border-solid border-green-300 bg-green-50 rounded-xl p-4 flex items-center justify-between"
                        >
                          <Box className="flex items-center gap-3">
                            <InsertDriveFileIcon color="success" />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {file.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            </Box>
                          </Box>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => setFile(null)}
                          >
                            Hapus
                          </Button>
                        </Box>
                      ) : (
                        <Box
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                            isDragActive
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                          }`}
                        >
                          <input {...getInputProps()} />
                          <CloudUploadIcon
                            sx={{ fontSize: 48, color: isDragActive ? 'primary.main' : 'action.disabled' }}
                          />
                          <Typography variant="body1" className="mt-2" fontWeight={600}>
                            {isDragActive ? 'Lepaskan file di sini...' : 'Seret & lepas CV kamu di sini'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" className="mt-1">
                            atau klik untuk memilih file (PDF / DOCX, max 10MB)
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {submitting && (
                      <Box>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="caption" className="mt-1">
                          Mengirim lamaran... {uploadProgress}%
                        </Typography>
                      </Box>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={submitting || !file || !fullName || !email}
                      sx={{ py: 1.5 }}
                    >
                      {submitting ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Kirim Lamaran'
                      )}
                    </Button>

                    <Typography variant="caption" color="text.secondary" className="block text-center">
                      Dengan mengirim lamaran, Anda menyetujui bahwa data Anda akan diproses untuk keperluan rekrutmen.
                    </Typography>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
