import { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Button, Grid,
  TextField, CircularProgress, LinearProgress, Alert, Skeleton,
} from '@mui/material';
import {
  CloudUpload, CheckCircle, Work, School, ArrowBack, ArrowForward,
  Description, Phone, Email, Person, BusinessCenter, InsertDriveFile,
  Close, AutoAwesome, Bolt, Shield,
} from '@mui/icons-material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { useDropzone } from 'react-dropzone';
import { publicService } from '../services/public';
import type { Job } from '../types';

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#07070a',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHover: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(99,160,255,0.4)',
  text: '#eef2ff',
  textMuted: 'rgba(238,242,255,0.52)',
  textDim: 'rgba(238,242,255,0.28)',
  blue: '#60a5fa',
  purple: '#a78bfa',
  green: '#34d399',
  red: '#f87171',
} as const;

// ─── Dark input styles ────────────────────────────────────────────────────────
const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    color: C.text,
    '& fieldset': { borderColor: C.border },
    '&:hover fieldset': { borderColor: 'rgba(99,160,255,0.3)' },
    '&.Mui-focused fieldset': { borderColor: C.blue, borderWidth: '1.5px' },
    '& input': { color: C.text },
    '& input::placeholder': { color: C.textDim, opacity: 1 },
    '& .MuiSvgIcon-root': { color: C.textDim },
  },
  '& .MuiInputLabel-root': { color: C.textDim },
  '& .MuiInputLabel-root.Mui-focused': { color: C.blue },
  '& .MuiFormHelperText-root': { color: C.textDim, mt: 0.75 },
};

// ─── Custom Step Indicator ────────────────────────────────────────────────────
function StepDot({
  index, label, active, done,
}: {
  index: number; label: string; active: boolean; done: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 38, height: 38, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.8rem',
          transition: 'all 0.3s ease',
          ...(done && {
            background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
            color: 'white',
            boxShadow: '0 0 18px rgba(52,211,153,0.4)',
          }),
          ...(active && !done && {
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: 'white',
            boxShadow: '0 0 24px rgba(96,165,250,0.45)',
            border: '1.5px solid rgba(99,160,255,0.4)',
          }),
          ...(!active && !done && {
            bgcolor: 'rgba(255,255,255,0.06)',
            color: C.textDim,
            border: `1px solid ${C.border}`,
          }),
        }}
      >
        {done ? <CheckCircle sx={{ fontSize: 18 }} /> : index}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: active ? 700 : 400,
          color: done ? C.green : active ? C.blue : C.textDim,
          whiteSpace: 'nowrap',
          transition: 'color 0.3s',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function StepLine({ done }: { done: boolean }) {
  return (
    <Box
      sx={{
        flex: 1, height: '1.5px', mx: 1.5, mt: '-20px',
        background: done
          ? 'linear-gradient(90deg, #059669 0%, #34d399 100%)'
          : 'rgba(255,255,255,0.08)',
        transition: 'background 0.4s ease',
      }}
    />
  );
}

// ─── Section header pill ──────────────────────────────────────────────────────
function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
      <Box
        sx={{
          width: 30, height: 30, borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.18) 100%)',
          border: '1px solid rgba(99,160,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: C.text }}>
        {text}
      </Typography>
    </Box>
  );
}

// ─── Skill tag ────────────────────────────────────────────────────────────────
function SkillTag({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: 1.25, py: 0.3, borderRadius: '6px',
        bgcolor: 'rgba(96,165,250,0.08)',
        border: '1px solid rgba(96,165,250,0.16)',
      }}
    >
      <Typography sx={{ fontSize: '0.68rem', color: C.blue, fontWeight: 500 }}>{label}</Typography>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: C.bg,
        color: C.text,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Ambient background orbs ── */}
      <Box
        sx={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          '&::before': {
            content: '""', position: 'absolute',
            top: '-20%', right: '-10%',
            width: '60%', height: '65%',
            background: 'radial-gradient(circle, rgba(109,40,217,0.14) 0%, transparent 65%)',
            filter: 'blur(40px)',
          },
          '&::after': {
            content: '""', position: 'absolute',
            bottom: '5%', left: '-8%',
            width: '50%', height: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 65%)',
            filter: 'blur(50px)',
          },
        }}
      />

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <Box
        sx={{
          position: 'sticky', top: 0, zIndex: 200,
          bgcolor: 'rgba(7,7,10,0.8)',
          backdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, gap: 1.5 }}>
            <Box
              sx={{
                width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 18px rgba(96,165,250,0.3)',
              }}
            >
              <LeaderboardIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Typography
              variant="h6" fontWeight={900}
              sx={{
                flex: 1,
                background: 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.3px',
              }}
            >
              SmartRecruit
            </Typography>
            <Box
              sx={{
                px: 1.5, py: 0.5, borderRadius: '20px',
                bgcolor: 'rgba(96,165,250,0.1)',
                border: '1px solid rgba(96,165,250,0.2)',
              }}
            >
              <Typography variant="caption" sx={{ color: C.blue, fontWeight: 700 }}>
                Portal Pelamar
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── HERO ───────────────────────────────────────── */}
      <Box sx={{ position: 'relative', zIndex: 1, pt: { xs: 8, md: 14 }, pb: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          {/* Badge */}
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75,
              px: 1.75, py: 0.65, borderRadius: '20px', mb: 3.5,
              bgcolor: 'rgba(167,139,250,0.1)',
              border: '1px solid rgba(167,139,250,0.22)',
            }}
          >
            <AutoAwesome sx={{ fontSize: 13, color: C.purple }} />
            <Typography variant="caption" sx={{ color: C.purple, fontWeight: 700, letterSpacing: '0.06em' }}>
              AI-POWERED RECRUITMENT
            </Typography>
          </Box>

          {/* Title */}
          <Typography
            variant="h1" fontWeight={900}
            sx={{
              mb: 2.5, lineHeight: 1.05,
              fontSize: { xs: '2.4rem', sm: '3.2rem', md: '4.2rem' },
              background: 'linear-gradient(140deg, #ffffff 0%, #bfdbfe 40%, #e9d5ff 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px',
            }}
          >
            Mulai Karir<br />Terbaikmu
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: C.textMuted, fontWeight: 400, mb: 6,
              maxWidth: 500, lineHeight: 1.8,
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Upload CV kamu dalam hitungan menit. Sistem AI kami akan mencocokkan
            profil terbaikmu dengan posisi yang tersedia.
          </Typography>

          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[
              { icon: <Work sx={{ fontSize: 15, color: C.blue }} />, v: loadingJobs ? '...' : `${jobs.length}`, l: 'Posisi tersedia', glow: C.blue },
              { icon: <Bolt sx={{ fontSize: 15, color: C.purple }} />, v: 'AI Otomatis', l: 'Seleksi cerdas', glow: C.purple },
              { icon: <Shield sx={{ fontSize: 15, color: C.green }} />, v: 'Terenkripsi', l: 'Data aman', glow: C.green },
            ].map((s, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1.25, borderRadius: '12px',
                  bgcolor: C.surface, border: `1px solid ${C.border}`,
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: `${s.glow}33`,
                    bgcolor: `${s.glow}08`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 30, height: 30, borderRadius: '8px',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {s.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: C.text, lineHeight: 1 }}>
                    {s.v}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: C.textDim }}>
                    {s.l}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── STEPPER ────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative', zIndex: 1,
          bgcolor: 'rgba(255,255,255,0.018)',
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          py: 3,
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StepDot index={1} label="Pilih Posisi" active={activeStep === 0} done={activeStep > 0} />
            <StepLine done={activeStep > 0} />
            <StepDot index={2} label="Data & CV" active={activeStep === 1} done={activeStep > 1} />
            <StepLine done={activeStep > 1} />
            <StepDot index={3} label="Selesai" active={activeStep === 2} done={false} />
          </Box>
        </Container>
      </Box>

      {/* ── CONTENT ────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 6, pb: 14 }}>

        {/* ═══ STEP 0: Job List ═══════════════════════════ */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: C.text, mb: 0.75 }}>
              Pilih Posisi yang Kamu Minati
            </Typography>
            <Typography variant="body2" sx={{ color: C.textMuted, mb: 5 }}>
              Klik <Box component="span" sx={{ color: C.blue, fontWeight: 600 }}>Lamar</Box> pada
              posisi yang ingin kamu lamar untuk melanjutkan
            </Typography>

            {loadingJobs ? (
              <Grid container spacing={3}>
                {[...Array(4)].map((_, i) => (
                  <Grid size={{ xs: 12, md: 6 }} key={i}>
                    <Skeleton
                      variant="rounded" height={230}
                      sx={{ borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.04)' }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : jobs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 14 }}>
                <Work sx={{ fontSize: 64, color: C.textDim }} />
                <Typography variant="h6" sx={{ color: C.textMuted, mt: 2 }}>
                  Belum ada posisi tersedia saat ini
                </Typography>
                <Typography variant="body2" sx={{ color: C.textDim, mt: 1 }}>
                  Cek kembali nanti atau hubungi tim HR kami
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {jobs.map((job) => (
                  <Grid size={{ xs: 12, md: 6 }} key={job.id}>
                    <Box
                      sx={{
                        bgcolor: C.surface, borderRadius: '16px',
                        border: `1px solid ${C.border}`,
                        p: '1px', // for gradient border trick
                        height: '100%',
                        transition: 'all 0.25s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        '&:hover': {
                          '& .card-inner': {
                            bgcolor: C.surfaceHover,
                          },
                          boxShadow: '0 0 0 1px rgba(96,165,250,0.25), 0 16px 48px rgba(0,0,0,0.6)',
                          transform: 'translateY(-3px)',
                        },
                        // Top gradient accent on hover
                        '&::before': {
                          content: '""',
                          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                          background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                          opacity: 0, transition: 'opacity 0.25s',
                          zIndex: 2,
                        },
                        '&:hover::before': { opacity: 1 },
                      }}
                    >
                      <Box
                        className="card-inner"
                        sx={{
                          p: 3, height: '100%', borderRadius: '15px',
                          bgcolor: C.surface,
                          display: 'flex', flexDirection: 'column',
                          transition: 'bgcolor 0.25s',
                        }}
                      >
                        {/* Card header */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                          <Box
                            sx={{
                              width: 46, height: 46, borderRadius: '12px', flexShrink: 0,
                              background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.18) 100%)',
                              border: '1px solid rgba(96,165,250,0.14)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <BusinessCenter sx={{ color: C.blue, fontSize: 22 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="subtitle1" fontWeight={800}
                              sx={{ color: C.text, lineHeight: 1.25, mb: 0.25 }}
                            >
                              {job.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: C.blue, fontWeight: 600 }}>
                              {job.department}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: C.textMuted, mb: 2.5, flex: 1, lineHeight: 1.75,
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}
                        >
                          {job.description}
                        </Typography>

                        {/* Skills */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                          {job.skills_required?.slice(0, 4).map((s) => (
                            <SkillTag key={s} label={s} />
                          ))}
                          {(job.skills_required?.length ?? 0) > 4 && (
                            <Box
                              sx={{
                                px: 1.25, py: 0.3, borderRadius: '6px',
                                bgcolor: 'rgba(255,255,255,0.05)',
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              <Typography sx={{ fontSize: '0.68rem', color: C.textDim }}>
                                +{(job.skills_required?.length ?? 0) - 4}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Footer */}
                        <Box
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            pt: 2, borderTop: `1px solid ${C.border}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            {job.min_experience_years > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Work sx={{ fontSize: 13, color: C.textDim }} />
                                <Typography sx={{ fontSize: '0.72rem', color: C.textDim }}>
                                  {job.min_experience_years}+ thn
                                </Typography>
                              </Box>
                            )}
                            {job.education_level && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <School sx={{ fontSize: 13, color: C.textDim }} />
                                <Typography sx={{ fontSize: '0.72rem', color: C.textDim }}>
                                  {job.education_level}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                            onClick={() => handleSelectJob(job)}
                            sx={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                              borderRadius: '8px', px: 2, py: 0.7,
                              fontSize: '0.78rem', fontWeight: 700,
                              boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                              border: '1px solid rgba(96,165,250,0.25)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #2563eb 0%, #6d28d9 100%)',
                                boxShadow: '0 4px 20px rgba(59,130,246,0.5)',
                              },
                            }}
                          >
                            Lamar
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* ═══ STEP 1: Form & Upload ══════════════════════ */}
        {activeStep === 1 && selectedJob && (
          <Grid container spacing={4}>
            {/* ── Sidebar ── */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  bgcolor: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: '16px', p: 3,
                  position: { md: 'sticky' }, top: 90,
                  // Top accent
                  '&::before': {
                    content: '""', position: 'absolute',
                    top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                    borderRadius: '16px 16px 0 0',
                  },
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em',
                    color: C.textDim, textTransform: 'uppercase', mb: 2,
                  }}
                >
                  Posisi Dipilih
                </Typography>

                <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                  <Box
                    sx={{
                      width: 44, height: 44, borderRadius: '10px', flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(139,92,246,0.18) 100%)',
                      border: '1px solid rgba(96,165,250,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <BusinessCenter sx={{ color: C.blue, fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: C.text, lineHeight: 1.3 }}>
                      {selectedJob.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: C.blue, fontWeight: 600 }}>
                      {selectedJob.department}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ bgcolor: C.border, height: '1px', mb: 2.5 }} />

                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em', color: C.textDim, textTransform: 'uppercase', mb: 1.5 }}>
                  Skills Dibutuhkan
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                  {selectedJob.skills_required?.map((s) => <SkillTag key={s} label={s} />)}
                </Box>

                {(selectedJob.min_experience_years > 0 || selectedJob.education_level) && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                    {selectedJob.min_experience_years > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Work sx={{ fontSize: 14, color: C.textDim }} />
                        <Typography sx={{ fontSize: '0.78rem', color: C.textMuted }}>
                          Min. {selectedJob.min_experience_years} tahun pengalaman
                        </Typography>
                      </Box>
                    )}
                    {selectedJob.education_level && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <School sx={{ fontSize: 14, color: C.textDim }} />
                        <Typography sx={{ fontSize: '0.78rem', color: C.textMuted }}>
                          {selectedJob.education_level}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {selectedJob.requirements && (
                  <>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em', color: C.textDim, textTransform: 'uppercase', mb: 1 }}>
                      Persyaratan
                    </Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: C.textMuted, whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                      {selectedJob.requirements}
                    </Typography>
                  </>
                )}

                <Box sx={{ pt: 2.5, mt: 2.5, borderTop: `1px solid ${C.border}` }}>
                  <Button
                    size="small"
                    startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
                    onClick={() => setActiveStep(0)}
                    sx={{ color: C.textDim, '&:hover': { color: C.text, bgcolor: 'rgba(255,255,255,0.05)' } }}
                  >
                    Ganti Posisi
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* ── Form Panel ── */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Box
                sx={{
                  bgcolor: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: '16px', p: { xs: 3, md: 4 },
                }}
              >
                <Typography variant="h5" fontWeight={800} sx={{ color: C.text, mb: 0.5 }}>
                  Data Diri & Upload CV
                </Typography>
                <Typography variant="body2" sx={{ color: C.textMuted, mb: 4 }}>
                  Lengkapi form di bawah. CV dalam format PDF atau DOCX (maks. 10MB).
                </Typography>

                {error && (
                  <Alert
                    severity="error"
                    onClose={() => setError('')}
                    sx={{
                      mb: 3, borderRadius: '10px',
                      bgcolor: 'rgba(248,113,113,0.08)',
                      border: '1px solid rgba(248,113,113,0.2)',
                      color: '#fca5a5',
                      '& .MuiAlert-icon': { color: C.red },
                      '& .MuiAlert-action button': { color: C.textDim },
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Personal Info */}
                  <Box>
                    <SectionLabel
                      icon={<Person sx={{ fontSize: 15, color: C.blue }} />}
                      text="Informasi Pribadi"
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <TextField
                        label="Nama Lengkap" fullWidth required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masukkan nama lengkap sesuai KTP"
                        sx={inputSx}
                        slotProps={{
                          input: { startAdornment: <Person sx={{ mr: 1, fontSize: 18 }} /> },
                        }}
                      />
                      <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Email Aktif" type="email" fullWidth required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="contoh@email.com"
                            helperText="Notifikasi dikirim ke email ini"
                            sx={inputSx}
                            slotProps={{
                              input: { startAdornment: <Email sx={{ mr: 1, fontSize: 18 }} /> },
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Nomor Telepon" fullWidth
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+62 812 xxxx xxxx"
                            sx={inputSx}
                            slotProps={{
                              input: { startAdornment: <Phone sx={{ mr: 1, fontSize: 18 }} /> },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>

                  <Box sx={{ bgcolor: C.border, height: '1px' }} />

                  {/* Upload */}
                  <Box>
                    <SectionLabel
                      icon={<Description sx={{ fontSize: 15, color: C.blue }} />}
                      text="Upload CV / Berkas"
                    />

                    {file ? (
                      <Box
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                          p: 2.5, borderRadius: '12px',
                          bgcolor: 'rgba(52,211,153,0.06)',
                          border: '1px solid rgba(52,211,153,0.18)',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 42, height: 42, borderRadius: '10px',
                              bgcolor: 'rgba(52,211,153,0.1)',
                              border: '1px solid rgba(52,211,153,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <InsertDriveFile sx={{ color: C.green, fontSize: 22 }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: C.text }}>
                              {file.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: C.textDim }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB · {file.name.split('.').pop()?.toUpperCase()}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<Close sx={{ fontSize: 13 }} />}
                          onClick={() => setFile(null)}
                          sx={{
                            color: C.red, flexShrink: 0,
                            border: '1px solid rgba(248,113,113,0.2)',
                            borderRadius: '8px',
                            '&:hover': { bgcolor: 'rgba(248,113,113,0.08)' },
                          }}
                        >
                          Hapus
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        {...getRootProps()}
                        sx={{
                          border: '1.5px dashed',
                          borderColor: isDragActive ? C.blue : 'rgba(255,255,255,0.1)',
                          borderRadius: '14px',
                          p: { xs: 4.5, md: 6 },
                          textAlign: 'center',
                          cursor: 'pointer',
                          bgcolor: isDragActive ? 'rgba(96,165,250,0.05)' : 'rgba(255,255,255,0.015)',
                          transition: 'all 0.2s ease',
                          boxShadow: isDragActive ? '0 0 0 5px rgba(96,165,250,0.07), inset 0 0 30px rgba(96,165,250,0.04)' : 'none',
                          '&:hover': {
                            borderColor: 'rgba(96,165,250,0.3)',
                            bgcolor: 'rgba(96,165,250,0.03)',
                          },
                        }}
                      >
                        <input {...getInputProps()} />
                        <Box
                          sx={{
                            width: 68, height: 68, borderRadius: '50%',
                            background: isDragActive
                              ? 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)'
                              : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isDragActive ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mx: 'auto', mb: 3,
                            transition: 'all 0.2s ease',
                            boxShadow: isDragActive ? '0 0 32px rgba(96,165,250,0.35)' : 'none',
                          }}
                        >
                          <CloudUpload sx={{ fontSize: 30, color: isDragActive ? 'white' : C.textDim, transition: 'color 0.2s' }} />
                        </Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: C.text, mb: 0.75 }}>
                          {isDragActive ? 'Lepaskan file di sini...' : 'Seret & lepas CV kamu'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: C.textMuted, mb: 3 }}>
                          atau{' '}
                          <Box component="span" sx={{ color: C.blue, fontWeight: 700, cursor: 'pointer' }}>
                            klik untuk memilih file
                          </Box>
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                          {['PDF', 'DOCX', 'Maks. 10MB'].map((t) => (
                            <Box
                              key={t}
                              sx={{
                                px: 1.5, py: 0.35, borderRadius: '6px',
                                bgcolor: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              <Typography sx={{ fontSize: '0.68rem', color: C.textDim }}>{t}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Progress bar */}
                  {submitting && (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontSize: '0.78rem', color: C.textMuted }}>
                          Mengirim lamaran...
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: C.blue, fontWeight: 700 }}>
                          {uploadProgress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{
                          height: 5, borderRadius: '3px',
                          bgcolor: 'rgba(255,255,255,0.06)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                            borderRadius: '3px',
                          },
                        }}
                      />
                    </Box>
                  )}

                  {/* Submit button */}
                  <Button
                    variant="contained" size="large" fullWidth
                    disabled={submitting || !file || !fullName || !email}
                    onClick={handleSubmit}
                    sx={{
                      py: 1.8, borderRadius: '12px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                      fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.02em',
                      boxShadow: '0 8px 28px rgba(59,130,246,0.32)',
                      border: '1px solid rgba(96,165,250,0.28)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb 0%, #6d28d9 100%)',
                        boxShadow: '0 8px 36px rgba(59,130,246,0.48)',
                      },
                      '&.Mui-disabled': {
                        background: 'rgba(255,255,255,0.05)',
                        color: C.textDim,
                        border: `1px solid ${C.border}`,
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {submitting
                      ? <CircularProgress size={22} sx={{ color: C.blue }} />
                      : 'Kirim Lamaran Sekarang'}
                  </Button>

                  <Typography sx={{ fontSize: '0.72rem', color: C.textDim, textAlign: 'center', lineHeight: 1.8 }}>
                    Dengan mengirim lamaran, Anda menyetujui data Anda diproses untuk keperluan rekrutmen.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* ═══ STEP 2: Success ════════════════════════════ */}
        {activeStep === 2 && (
          <Box sx={{ maxWidth: 520, mx: 'auto', textAlign: 'center', pt: 4 }}>
            {/* Glow ring + icon */}
            <Box
              sx={{
                width: 108, height: 108, borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 4,
                boxShadow: '0 0 0 18px rgba(52,211,153,0.07), 0 0 0 36px rgba(52,211,153,0.04), 0 0 80px rgba(52,211,153,0.3)',
              }}
            >
              <CheckCircle sx={{ fontSize: 52, color: 'white' }} />
            </Box>

            <Typography
              variant="h4" fontWeight={900}
              sx={{
                mb: 1.5, letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #86efac 60%, #34d399 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}
            >
              Lamaran Terkirim!
            </Typography>
            <Typography variant="body1" sx={{ color: C.textMuted, mb: 1 }}>
              {resultData?.message || 'Lamaran kamu telah berhasil dikirim.'}
            </Typography>
            <Typography variant="body2" sx={{ color: C.textMuted, mb: 5, lineHeight: 1.9 }}>
              CV kamu untuk posisi{' '}
              <Box component="span" sx={{ color: C.text, fontWeight: 800 }}>
                {resultData?.job_title}
              </Box>{' '}
              sedang kami proses. Kami akan menghubungi melalui email jika profilmu sesuai.
            </Typography>

            {/* Next Steps */}
            <Box
              sx={{
                bgcolor: C.surface, border: `1px solid ${C.border}`,
                borderRadius: '16px', p: 3, mb: 4, textAlign: 'left',
                position: 'relative', overflow: 'hidden',
                '&::before': {
                  content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg, #059669 0%, #34d399 100%)',
                },
              }}
            >
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em', color: C.textDim, textTransform: 'uppercase', mb: 2 }}>
                Langkah Selanjutnya
              </Typography>
              {[
                { text: 'CV kamu sedang diproses sistem AI SmartRecruit', c: C.blue },
                { text: 'Tim rekrutmen meninjau kandidat terbaik', c: C.purple },
                { text: 'Kandidat terpilih dihubungi via email dalam 3–5 hari kerja', c: C.green },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: i < 2 ? 1.75 : 0 }}>
                  <Box
                    sx={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0, mt: 0.1,
                      background: `${item.c}18`,
                      border: `1px solid ${item.c}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: item.c }}>
                      {i + 1}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.75 }}>
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button
              variant="contained" size="large" onClick={handleReset}
              sx={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                borderRadius: '12px', px: 5, py: 1.5,
                fontWeight: 800, fontSize: '0.9rem',
                boxShadow: '0 8px 28px rgba(59,130,246,0.32)',
                border: '1px solid rgba(96,165,250,0.28)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb 0%, #6d28d9 100%)',
                  boxShadow: '0 8px 36px rgba(59,130,246,0.48)',
                },
              }}
            >
              Lamar Posisi Lain
            </Button>
          </Box>
        )}
      </Container>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <Box
        sx={{
          position: 'relative', zIndex: 1,
          borderTop: `1px solid ${C.border}`,
          bgcolor: 'rgba(255,255,255,0.012)',
          py: 3,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LeaderboardIcon sx={{ color: C.blue, fontSize: 16 }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: C.blue }}>
                SmartRecruit
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.72rem', color: C.textDim }}>
              © 2025 SmartRecruit · Data kamu dilindungi sesuai kebijakan privasi kami
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
