import { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Button, Card, CardContent,
  Grid, Chip, TextField, Stepper, Step, StepLabel,
  CircularProgress, LinearProgress, Alert, AppBar, Toolbar,
  Avatar, Divider, Paper, Skeleton,
} from '@mui/material';
import {
  CloudUpload, CheckCircle, Work, School, ArrowBack,
  ArrowForward, Description, Phone, Email, Person,
  BusinessCenter, InsertDriveFile, Close,
} from '@mui/icons-material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { useDropzone } from 'react-dropzone';
import { publicService } from '../services/public';
import type { Job } from '../types';

const STEPS = ['Pilih Posisi', 'Data Diri & CV', 'Selesai'];

export default function ApplicantPortal() {
  const [activeStep, setActiveStep] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState<{ message: string; job_title: string } | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    publicService
      .listOpenJobs()
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
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

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setActiveStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!file || !selectedJob || !fullName || !email) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await publicService.apply(
        { full_name: fullName, email, phone, job_id: selectedJob.id },
        file,
        setUploadProgress,
      );
      setResultData(result);
      setActiveStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleReset = () => {
    setActiveStep(0);
    setSelectedJob(null);
    setFile(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setResultData(null);
    setError('');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Navbar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LeaderboardIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                flex: 1,
              }}
            >
              SmartRecruit
            </Typography>
            <Chip
              label="Portal Pelamar"
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 55%, #7c3aed 100%)',
          py: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 15% 60%, rgba(255,255,255,0.07) 0%, transparent 55%), radial-gradient(circle at 85% 15%, rgba(255,255,255,0.05) 0%, transparent 45%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            fontWeight={800}
            color="white"
            sx={{ mb: 1.5, lineHeight: 1.2, fontSize: { xs: '2rem', md: '2.5rem' } }}
          >
            Portal Lamaran Kerja
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, fontWeight: 400, maxWidth: 560 }}
          >
            Pilih posisi yang sesuai dan upload CV kamu. Proses seleksi kami menggunakan teknologi AI
            untuk menemukan kandidat terbaik.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[
              { label: 'Posisi Tersedia', value: loadingJobs ? '...' : `${jobs.length}` },
              { label: 'Seleksi AI', value: 'Otomatis' },
              { label: 'Waktu Review', value: '3–5 Hari' },
            ].map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 1.5,
                  border: '1px solid rgba(255,255,255,0.18)',
                  minWidth: 100,
                }}
              >
                <Typography variant="h6" fontWeight={800} color="white" sx={{ lineHeight: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', mt: 0.25, display: 'block' }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Stepper */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 3 }}>
        <Container maxWidth="md">
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5, pb: 10 }}>
        {/* ─── STEP 0: Pilih Posisi ─── */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 0.75 }}>
              Pilih Posisi yang Kamu Minati
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Klik tombol <strong>Lamar</strong> pada posisi yang ingin kamu lamar untuk melanjutkan.
            </Typography>

            {loadingJobs ? (
              <Grid container spacing={3}>
                {[...Array(4)].map((_, i) => (
                  <Grid size={{ xs: 12, md: 6 }} key={i}>
                    <Skeleton variant="rounded" height={210} sx={{ borderRadius: 3 }} />
                  </Grid>
                ))}
              </Grid>
            ) : jobs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 12 }}>
                <Work sx={{ fontSize: 72, color: 'action.disabled' }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  Belum ada posisi yang tersedia saat ini
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Silakan cek kembali nanti atau hubungi tim HR kami.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {jobs.map((job) => (
                  <Grid size={{ xs: 12, md: 6 }} key={job.id}>
                    <Card
                      elevation={0}
                      sx={{
                        border: '2px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'translateY(-3px)',
                          boxShadow: '0 10px 28px rgba(59,130,246,0.14)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                          <Avatar
                            sx={{
                              background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
                              width: 48,
                              height: 48,
                              flexShrink: 0,
                            }}
                          >
                            <BusinessCenter sx={{ color: '#3b82f6', fontSize: 24 }} />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                              {job.title}
                            </Typography>
                            <Typography variant="body2" color="primary.main" fontWeight={600}>
                              {job.department}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Desc */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flex: 1,
                          }}
                        >
                          {job.description}
                        </Typography>

                        {/* Skills */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                          {job.skills_required?.slice(0, 4).map((skill) => (
                            <Chip
                              key={skill}
                              label={skill}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                          ))}
                          {(job.skills_required?.length ?? 0) > 4 && (
                            <Chip
                              label={`+${(job.skills_required?.length ?? 0) - 4} lainnya`}
                              size="small"
                              sx={{ height: 22, fontSize: '0.7rem', bgcolor: 'grey.100' }}
                            />
                          )}
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* Footer */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            {job.min_experience_years > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Work sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {job.min_experience_years}+ thn
                                </Typography>
                              </Box>
                            )}
                            {job.education_level && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <School sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {job.education_level}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            endIcon={<ArrowForward />}
                            onClick={() => handleSelectJob(job)}
                            sx={{
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                              },
                            }}
                          >
                            Lamar
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* ─── STEP 1: Data & Upload ─── */}
        {activeStep === 1 && selectedJob && (
          <Grid container spacing={4}>
            {/* Sidebar: Job Summary */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  p: 3,
                  position: { md: 'sticky' },
                  top: 90,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', letterSpacing: 1.5, fontSize: '0.7rem' }}
                >
                  Posisi yang Dipilih
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, mb: 2 }}>
                  <Avatar
                    sx={{
                      background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
                      width: 44,
                      height: 44,
                    }}
                  >
                    <BusinessCenter sx={{ color: '#3b82f6', fontSize: 22 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                      {selectedJob.title}
                    </Typography>
                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                      {selectedJob.department}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Skills yang Dibutuhkan
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                  {selectedJob.skills_required?.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      color="primary"
                      sx={{ height: 24, fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>

                {(selectedJob.min_experience_years > 0 || selectedJob.education_level) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                    {selectedJob.min_experience_years > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Work sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Min. {selectedJob.min_experience_years} tahun pengalaman
                        </Typography>
                      </Box>
                    )}
                    {selectedJob.education_level && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {selectedJob.education_level}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {selectedJob.requirements && (
                  <>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      Persyaratan
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.78rem', whiteSpace: 'pre-line', lineHeight: 1.7 }}
                    >
                      {selectedJob.requirements}
                    </Typography>
                  </>
                )}

                <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<ArrowBack />}
                    onClick={() => setActiveStep(0)}
                    color="inherit"
                    sx={{ color: 'text.secondary' }}
                  >
                    Ganti Posisi
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Main: Form */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper
                elevation={0}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 3, md: 4 } }}
              >
                <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                  Data Diri & Upload CV
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Isi data diri kamu dengan benar dan upload CV dalam format PDF atau DOCX.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                  {/* Section: Informasi Pribadi */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Person sx={{ fontSize: 18, color: '#3b82f6' }} />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Informasi Pribadi
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Nama Lengkap"
                        fullWidth
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masukkan nama lengkap sesuai KTP"
                        slotProps={{
                          input: {
                            startAdornment: <Person sx={{ color: 'action.active', mr: 1, fontSize: 20 }} />,
                          },
                        }}
                      />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Email Aktif"
                            type="email"
                            fullWidth
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contoh@email.com"
                            helperText="Notifikasi seleksi dikirim ke email ini"
                            slotProps={{
                              input: {
                                startAdornment: <Email sx={{ color: 'action.active', mr: 1, fontSize: 20 }} />,
                              },
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Nomor Telepon"
                            fullWidth
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+62 812 xxxx xxxx"
                            slotProps={{
                              input: {
                                startAdornment: <Phone sx={{ color: 'action.active', mr: 1, fontSize: 20 }} />,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Section: Upload CV */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Description sx={{ fontSize: 18, color: '#3b82f6' }} />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Upload CV / Berkas Lamaran
                      </Typography>
                    </Box>

                    {file ? (
                      <Box
                        sx={{
                          border: '2px solid #22c55e',
                          borderRadius: 2.5,
                          p: 2.5,
                          bgcolor: '#f0fdf4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#dcfce7', width: 44, height: 44 }}>
                            <InsertDriveFile sx={{ color: '#16a34a' }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(file.size / 1024 / 1024).toFixed(2)} MB •{' '}
                              {file.name.split('.').pop()?.toUpperCase()}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<Close />}
                          onClick={() => setFile(null)}
                          sx={{ borderRadius: 2, flexShrink: 0 }}
                        >
                          Hapus
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        {...getRootProps()}
                        sx={{
                          border: '2px dashed',
                          borderColor: isDragActive ? 'primary.main' : '#d1d5db',
                          borderRadius: 3,
                          p: { xs: 4, md: 6 },
                          textAlign: 'center',
                          cursor: 'pointer',
                          bgcolor: isDragActive ? '#eff6ff' : '#fafafa',
                          transition: 'all 0.2s ease',
                          '&:hover': { borderColor: 'primary.main', bgcolor: '#eff6ff' },
                        }}
                      >
                        <input {...getInputProps()} />
                        <Box
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            background: isDragActive
                              ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                              : 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2.5,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <CloudUpload
                            sx={{
                              fontSize: 34,
                              color: isDragActive ? 'white' : '#3b82f6',
                            }}
                          />
                        </Box>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>
                          {isDragActive ? 'Lepaskan file di sini...' : 'Seret & lepas CV kamu di sini'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                          atau{' '}
                          <Typography
                            component="span"
                            color="primary.main"
                            fontWeight={600}
                            sx={{ cursor: 'pointer' }}
                          >
                            klik untuk memilih file
                          </Typography>
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Chip label="PDF" size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                          <Chip label="DOCX" size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                          <Chip label="Maks. 10MB" size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Progress */}
                  {submitting && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="caption" color="text.secondary">
                          Mengirim lamaran...
                        </Typography>
                        <Typography variant="caption" color="primary.main" fontWeight={600}>
                          {uploadProgress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{ borderRadius: 1, height: 6 }}
                      />
                    </Box>
                  )}

                  {/* Submit Button */}
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={submitting || !file || !fullName || !email}
                    onClick={handleSubmit}
                    sx={{
                      py: 1.75,
                      borderRadius: 2.5,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      boxShadow: '0 6px 20px rgba(59,130,246,0.35)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        boxShadow: '0 8px 28px rgba(59,130,246,0.45)',
                      },
                      '&:disabled': {
                        background: '#e5e7eb',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {submitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Kirim Lamaran Sekarang'
                    )}
                  </Button>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: 'center', display: 'block', lineHeight: 1.7 }}
                  >
                    Dengan mengirim lamaran, Anda menyetujui bahwa data Anda akan diproses untuk
                    keperluan seleksi rekrutmen sesuai kebijakan privasi kami.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* ─── STEP 2: Sukses ─── */}
        {activeStep === 2 && (
          <Box sx={{ maxWidth: 540, mx: 'auto', textAlign: 'center', pt: 4 }}>
            {/* Icon */}
            <Box
              sx={{
                width: 104,
                height: 104,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 16px 48px rgba(16,185,129,0.3)',
              }}
            >
              <CheckCircle sx={{ fontSize: 54, color: 'white' }} />
            </Box>

            <Typography variant="h4" fontWeight={800} sx={{ mb: 1.5 }}>
              Lamaran Berhasil Dikirim!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {resultData?.message || 'Lamaran kamu telah berhasil dikirim.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Tim rekrutmen kami akan meninjau CV kamu untuk posisi{' '}
              <Typography component="span" fontWeight={700} color="text.primary">
                {resultData?.job_title}
              </Typography>
              . Jika profil kamu sesuai, kami akan menghubungi kamu melalui email yang didaftarkan.
            </Typography>

            {/* Next Steps */}
            <Paper
              elevation={0}
              sx={{
                bgcolor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 3,
                p: 3,
                mb: 4,
                textAlign: 'left',
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ mb: 2, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 0.75 }}
              >
                <CheckCircle sx={{ fontSize: 16 }} /> Langkah Selanjutnya
              </Typography>
              {[
                'CV kamu sedang diproses oleh sistem AI SmartRecruit',
                'Tim rekrutmen akan meninjau kandidat terbaik',
                'Kandidat terpilih akan dihubungi via email dalam 3–5 hari kerja',
              ].map((step, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: i < 2 ? 1.5 : 0 }}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      bgcolor: '#3b82f6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      mt: 0.15,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {step}
                  </Typography>
                </Box>
              ))}
            </Paper>

            <Button
              variant="contained"
              size="large"
              onClick={handleReset}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: 2.5,
                px: 5,
                py: 1.5,
                fontWeight: 700,
                boxShadow: '0 6px 20px rgba(59,130,246,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                },
              }}
            >
              Lamar Posisi Lain
            </Button>
          </Box>
        )}
      </Container>

      {/* Footer */}
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white',
          py: 3,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LeaderboardIcon sx={{ color: '#3b82f6', fontSize: 18 }} />
              <Typography variant="body2" fontWeight={700} color="primary.main">
                SmartRecruit
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              © 2025 SmartRecruit · Semua data dilindungi dan diproses sesuai kebijakan privasi kami.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
