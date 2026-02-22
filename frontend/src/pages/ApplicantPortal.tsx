import { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Typography, Button, Grid,
  TextField, CircularProgress, LinearProgress, Alert, Skeleton,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  CloudUpload, CheckCircle, Work, School, ArrowForward,
  Description, Phone, Email, Person, BusinessCenter, InsertDriveFile,
  Close, AutoAwesome, Bolt, Shield, KeyboardArrowDown, ArrowBack,
} from '@mui/icons-material';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { useDropzone } from 'react-dropzone';
import { publicService } from '../services/public';
import type { Job } from '../types';

// ─── Animations ───────────────────────────────────────────────────────────────
const glow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0); }
  50%       { box-shadow: 0 0 0 8px rgba(167,139,250,0.12); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
`;

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#050508',
  surface: 'rgba(255,255,255,0.032)',
  surfaceUp: 'rgba(255,255,255,0.058)',
  border: 'rgba(255,255,255,0.072)',
  borderActive: 'rgba(96,165,250,0.45)',
  text: '#f1f5ff',
  muted: 'rgba(241,245,255,0.5)',
  dim: 'rgba(241,245,255,0.26)',
  blue: '#60a5fa',
  indigo: '#818cf8',
  purple: '#a78bfa',
  green: '#34d399',
  red: '#f87171',
} as const;

// ─── Shared input sx ─────────────────────────────────────────────────────────
const inputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    color: C.text,
    transition: 'box-shadow 0.2s',
    '& fieldset': { borderColor: C.border },
    '&:hover fieldset': { borderColor: 'rgba(96,165,250,0.3)' },
    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(96,165,250,0.12)' },
    '&.Mui-focused fieldset': { borderColor: C.blue, borderWidth: '1.5px' },
    '& input': { color: C.text },
    '& input::placeholder': { color: C.dim, opacity: 1 },
    '& .MuiSvgIcon-root': { color: C.dim },
  },
  '& .MuiInputLabel-root': { color: C.dim },
  '& .MuiInputLabel-root.Mui-focused': { color: C.blue },
  '& .MuiFormHelperText-root': { color: C.dim },
};

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepPill({ index, label, active, done }: {
  index: number; label: string; active: boolean; done: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 800, transition: 'all 0.35s ease',
        ...(done ? {
          background: 'linear-gradient(135deg,#059669,#34d399)',
          color: '#fff', boxShadow: '0 0 14px rgba(52,211,153,0.5)',
        } : active ? {
          background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
          color: '#fff', boxShadow: '0 0 18px rgba(96,165,250,0.55)',
        } : {
          bgcolor: 'rgba(255,255,255,0.07)',
          color: C.dim, border: `1px solid ${C.border}`,
        }),
      }}>
        {done ? <CheckCircle sx={{ fontSize: 14 }} /> : index}
      </Box>
      <Typography sx={{
        fontSize: '0.8rem', fontWeight: active ? 700 : 400,
        color: done ? C.green : active ? C.blue : C.dim,
        transition: 'color 0.35s',
        display: { xs: 'none', sm: 'block' },
      }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Skill badge ──────────────────────────────────────────────────────────────
function Skill({ label }: { label: string }) {
  return (
    <Box sx={{
      px: 1.25, py: 0.3, borderRadius: '6px',
      bgcolor: 'rgba(96,165,250,0.07)',
      border: '1px solid rgba(96,165,250,0.15)',
    }}>
      <Typography sx={{ fontSize: '0.68rem', color: C.blue, fontWeight: 500 }}>{label}</Typography>
    </Box>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHead({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: '9px',
        background: 'linear-gradient(135deg,rgba(59,130,246,0.16),rgba(139,92,246,0.16))',
        border: '1px solid rgba(96,165,250,0.16)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: C.text }}>{text}</Typography>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ApplicantPortal() {
  const [step, setStep] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ message: string; job_title: string } | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    publicService.listOpenJobs()
      .then(d => setJobs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  }, []);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setFile(files[0]);
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

  const pickJob = (job: Job) => {
    setSelectedJob(job);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!file || !selectedJob || !fullName || !email) return;
    setSubmitting(true); setError('');
    try {
      const res = await publicService.apply(
        { full_name: fullName, email, phone, job_id: selectedJob.id },
        file, setProgress,
      );
      setResult(res); setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || 'Gagal mengirim lamaran. Silakan coba lagi.');
    } finally {
      setSubmitting(false); setProgress(0);
    }
  };

  const reset = () => {
    setStep(0); setSelectedJob(null); setFile(null);
    setFullName(''); setEmail(''); setPhone('');
    setResult(null); setError('');
  };

  // ── Shared button style ──────────────────────────────
  const primaryBtn = {
    background: 'linear-gradient(135deg,#3b82f6 0%,#7c3aed 100%)',
    borderRadius: '12px', fontWeight: 800,
    border: '1px solid rgba(96,165,250,0.25)',
    boxShadow: '0 6px 24px rgba(59,130,246,0.3)',
    '&:hover': {
      background: 'linear-gradient(135deg,#2563eb 0%,#6d28d9 100%)',
      boxShadow: '0 8px 32px rgba(59,130,246,0.45)',
    },
    '&.Mui-disabled': {
      background: 'rgba(255,255,255,0.06)',
      color: C.dim, border: `1px solid ${C.border}`, boxShadow: 'none',
    },
  };

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: C.bg, color: C.text,
      // Dot grid
      backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
    }}>

      {/* ── Ambient orbs (fixed) ─────────────────────── */}
      <Box sx={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        '&::before': {
          content: '""', position: 'absolute',
          top: '-10%', right: '-5%', width: '55%', height: '60%',
          background: 'radial-gradient(circle,rgba(109,40,217,0.18) 0%,transparent 60%)',
          filter: 'blur(60px)',
        },
        '&::after': {
          content: '""', position: 'absolute',
          bottom: '10%', left: '-5%', width: '45%', height: '50%',
          background: 'radial-gradient(circle,rgba(37,99,235,0.13) 0%,transparent 60%)',
          filter: 'blur(60px)',
        },
      }} />

      {/* ── NAVBAR ───────────────────────────────────── */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 300,
        bgcolor: 'rgba(5,5,8,0.75)', backdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, gap: 2 }}>
            {/* Logo */}
            <Box sx={{
              width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(96,165,250,0.35)',
            }}>
              <LeaderboardIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Typography fontWeight={900} sx={{
              flex: 1, fontSize: '1.1rem',
              background: 'linear-gradient(135deg,#93c5fd,#c4b5fd)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              SmartRecruit
            </Typography>

            {/* Stepper inline */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <StepPill index={1} label="Pilih Posisi" active={step === 0} done={step > 0} />
              <Box sx={{ width: 24, height: '1.5px', bgcolor: step > 0 ? C.green : C.border, transition: 'background .4s', flexShrink: 0 }} />
              <StepPill index={2} label="Data & CV" active={step === 1} done={step > 1} />
              <Box sx={{ width: 24, height: '1.5px', bgcolor: step > 1 ? C.green : C.border, transition: 'background .4s', flexShrink: 0 }} />
              <StepPill index={3} label="Selesai" active={step === 2} done={false} />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── HERO (only on step 0) ─────────────────────── */}
      {step === 0 && (
        <Box sx={{
          position: 'relative', zIndex: 1,
          minHeight: { xs: 'auto', md: '88vh' },
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
          pt: { xs: 8, md: 0 }, pb: { xs: 6, md: 4 },
        }}>
          {/* Decorative glow ring behind title */}
          <Box sx={{
            position: 'absolute', width: 480, height: 480, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(96,165,250,0.06) 0%,rgba(139,92,246,0.04) 50%,transparent 70%)',
            pointerEvents: 'none',
          }} />

          <Container maxWidth="md" sx={{ position: 'relative' }}>
            {/* Badge */}
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75,
              px: 2, py: 0.75, borderRadius: '20px', mb: 4,
              bgcolor: 'rgba(167,139,250,0.08)',
              border: '1px solid rgba(167,139,250,0.2)',
              animation: `${glow} 2.5s ease-in-out infinite`,
            }}>
              <AutoAwesome sx={{ fontSize: 13, color: C.purple }} />
              <Typography sx={{ fontSize: '0.72rem', color: C.purple, fontWeight: 700, letterSpacing: '0.08em' }}>
                AI-POWERED RECRUITMENT PLATFORM
              </Typography>
            </Box>

            {/* Title */}
            <Typography fontWeight={900} sx={{
              fontSize: { xs: '2.6rem', sm: '3.6rem', md: '5rem' },
              lineHeight: 1.05, letterSpacing: '-2px', mb: 3,
              background: 'linear-gradient(140deg,#fff 0%,#bfdbfe 35%,#c4b5fd 65%,#f0abfc 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: `${fadeUp} 0.7s ease both`,
            }}>
              Temukan Karir<br />Impianmu Disini
            </Typography>

            {/* Subtitle */}
            <Typography sx={{
              color: C.muted, fontSize: { xs: '1rem', md: '1.15rem' },
              lineHeight: 1.8, maxWidth: 500, mx: 'auto', mb: 5,
              animation: `${fadeUp} 0.7s 0.1s ease both`,
            }}>
              Upload CV kamu dan biarkan sistem AI kami mencocokkan
              profil terbaikmu dengan posisi yang paling sesuai.
            </Typography>

            {/* CTA */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 8,
              animation: `${fadeUp} 0.7s 0.2s ease both` }}>
              <Button
                variant="contained" size="large"
                endIcon={<ArrowForward />}
                onClick={() => document.getElementById('job-list')?.scrollIntoView({ behavior: 'smooth' })}
                sx={{ ...primaryBtn, px: 4, py: 1.5, fontSize: '0.95rem' }}
              >
                Lihat Posisi Tersedia
              </Button>
              <Button
                variant="outlined" size="large"
                sx={{
                  px: 4, py: 1.5, borderRadius: '12px', fontSize: '0.95rem', fontWeight: 700,
                  borderColor: C.border, color: C.muted,
                  '&:hover': { borderColor: C.blue, color: C.text, bgcolor: 'rgba(96,165,250,0.06)' },
                }}
              >
                Pelajari Lebih Lanjut
              </Button>
            </Box>

            {/* Stats */}
            <Box sx={{
              display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap',
              animation: `${fadeUp} 0.7s 0.3s ease both`,
            }}>
              {[
                { icon: <Work sx={{ fontSize: 15, color: C.blue }} />, v: loadingJobs ? '—' : `${jobs.length} Posisi`, sub: 'Tersedia saat ini' },
                { icon: <Bolt sx={{ fontSize: 15, color: C.purple }} />, v: 'AI Scoring', sub: 'Seleksi otomatis' },
                { icon: <Shield sx={{ fontSize: 15, color: C.green }} />, v: 'Encrypted', sub: 'Data terlindungi' },
              ].map((s, i) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2.5, py: 1.5, borderRadius: '14px',
                  bgcolor: C.surface, border: `1px solid ${C.border}`,
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: C.border, bgcolor: C.surfaceUp },
                }}>
                  {s.icon}
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: C.text, lineHeight: 1 }}>
                      {s.v}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: C.dim, mt: 0.25 }}>{s.sub}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Container>

          {/* Scroll indicator */}
          <Box sx={{
            position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            display: { xs: 'none', md: 'flex' }, flexDirection: 'column', alignItems: 'center', gap: 0.5,
            animation: `${float} 2s ease-in-out infinite`,
          }}>
            <Typography sx={{ fontSize: '0.65rem', color: C.dim, letterSpacing: '0.1em' }}>SCROLL</Typography>
            <KeyboardArrowDown sx={{ fontSize: 18, color: C.dim }} />
          </Box>
        </Box>
      )}

      {/* ── CONTENT ──────────────────────────────────── */}
      <Box id="job-list" sx={{ position: 'relative', zIndex: 1 }}>
        <Container maxWidth="lg" sx={{ py: step === 0 ? 2 : 6, pb: 16 }}>

          {/* ══ STEP 0: Job grid ════════════════════════ */}
          {step === 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color: C.text }}>
                    Posisi yang Tersedia
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: C.muted, mt: 0.5 }}>
                    {loadingJobs ? 'Memuat...' : `${jobs.length} lowongan aktif`}
                  </Typography>
                </Box>
              </Box>

              {loadingJobs ? (
                <Grid container spacing={3}>
                  {[...Array(6)].map((_, i) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                      <Skeleton variant="rounded" height={240}
                        sx={{ borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.04)' }} />
                    </Grid>
                  ))}
                </Grid>
              ) : jobs.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 16 }}>
                  <Box sx={{
                    width: 72, height: 72, borderRadius: '20px', mx: 'auto', mb: 3,
                    bgcolor: C.surface, border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Work sx={{ fontSize: 32, color: C.dim }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: C.muted }}>Belum ada posisi tersedia</Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: C.dim, mt: 1 }}>
                    Cek kembali nanti atau hubungi tim HR kami
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {jobs.map((job, idx) => {
                    const accentColors = ['#60a5fa', '#a78bfa', '#34d399', '#fb923c', '#f472b6'];
                    const accent = accentColors[idx % accentColors.length];
                    return (
                      <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={job.id}>
                        <Box sx={{
                          height: '100%', p: '1px', borderRadius: '18px',
                          background: C.border,
                          transition: 'all 0.25s ease',
                          '&:hover': {
                            background: `linear-gradient(135deg,${accent}50,${accent}20)`,
                            transform: 'translateY(-4px)',
                            '& .card-body': { bgcolor: '#0c0c12' },
                            '& .apply-btn': { opacity: 1, transform: 'translateY(0)' },
                          },
                        }}>
                          <Box className="card-body" sx={{
                            bgcolor: '#09090e', borderRadius: '17px',
                            p: 3, height: '100%',
                            display: 'flex', flexDirection: 'column',
                            transition: 'bgcolor 0.25s',
                          }}>
                            {/* Header */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
                              <Box sx={{
                                width: 46, height: 46, borderRadius: '12px', flexShrink: 0,
                                background: `linear-gradient(135deg,${accent}22,${accent}11)`,
                                border: `1px solid ${accent}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <BusinessCenter sx={{ color: accent, fontSize: 22 }} />
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography fontWeight={800} sx={{ color: C.text, lineHeight: 1.25, mb: 0.25, fontSize: '0.95rem' }}>
                                  {job.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.green,
                                    boxShadow: `0 0 6px ${C.green}` }} />
                                  <Typography sx={{ fontSize: '0.72rem', color: C.green, fontWeight: 600 }}>
                                    Open
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.72rem', color: C.dim }}>· {job.department}</Typography>
                                </Box>
                              </Box>
                            </Box>

                            {/* Description */}
                            <Typography sx={{
                              color: C.muted, fontSize: '0.82rem', lineHeight: 1.75, mb: 2.5, flex: 1,
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {job.description}
                            </Typography>

                            {/* Skills */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                              {job.skills_required?.slice(0, 3).map(s => <Skill key={s} label={s} />)}
                              {(job.skills_required?.length ?? 0) > 3 && (
                                <Box sx={{ px: 1.25, py: 0.3, borderRadius: '6px', bgcolor: C.surface, border: `1px solid ${C.border}` }}>
                                  <Typography sx={{ fontSize: '0.68rem', color: C.dim }}>
                                    +{(job.skills_required?.length ?? 0) - 3}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {/* Footer */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              pt: 2, borderTop: `1px solid ${C.border}` }}>
                              <Box sx={{ display: 'flex', gap: 2 }}>
                                {job.min_experience_years > 0 && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Work sx={{ fontSize: 12, color: C.dim }} />
                                    <Typography sx={{ fontSize: '0.7rem', color: C.dim }}>{job.min_experience_years}+ thn</Typography>
                                  </Box>
                                )}
                                {job.education_level && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <School sx={{ fontSize: 12, color: C.dim }} />
                                    <Typography sx={{ fontSize: '0.7rem', color: C.dim }}>{job.education_level}</Typography>
                                  </Box>
                                )}
                              </Box>
                              <Button
                                className="apply-btn"
                                variant="contained" size="small"
                                endIcon={<ArrowForward sx={{ fontSize: 13 }} />}
                                onClick={() => pickJob(job)}
                                sx={{
                                  background: `linear-gradient(135deg,${accent}cc,${accent}88)`,
                                  borderRadius: '8px', px: 2, py: 0.6,
                                  fontSize: '0.75rem', fontWeight: 700,
                                  border: `1px solid ${accent}44`,
                                  boxShadow: `0 4px 16px ${accent}30`,
                                  opacity: 0.85,
                                  transform: 'translateY(2px)',
                                  transition: 'all 0.2s',
                                  '&:hover': { opacity: 1, boxShadow: `0 4px 24px ${accent}50` },
                                }}
                              >
                                Lamar
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          )}

          {/* ══ STEP 1: Form ════════════════════════════ */}
          {step === 1 && selectedJob && (
            <Grid container spacing={4}>
              {/* Sidebar */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{
                  bgcolor: '#09090e', border: `1px solid ${C.border}`,
                  borderRadius: '18px', p: 3,
                  position: { xs: 'relative', md: 'sticky' }, top: { md: 88 },
                }}>
                  {/* Gradient top bar */}
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)',
                    borderRadius: '18px 18px 0 0',
                  }} />

                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em',
                    color: C.dim, textTransform: 'uppercase', mb: 2 }}>
                    Kamu Melamar Untuk
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '11px', flexShrink: 0,
                      background: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(139,92,246,0.18))',
                      border: '1px solid rgba(96,165,250,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <BusinessCenter sx={{ color: C.blue, fontSize: 21 }} />
                    </Box>
                    <Box>
                      <Typography fontWeight={800} sx={{ color: C.text, lineHeight: 1.3, fontSize: '0.95rem' }}>
                        {selectedJob.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: C.blue, fontWeight: 600 }}>
                        {selectedJob.department}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ bgcolor: C.border, height: '1px', mb: 2.5 }} />

                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em',
                    color: C.dim, textTransform: 'uppercase', mb: 1.5 }}>
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2.5 }}>
                    {selectedJob.skills_required?.map(s => <Skill key={s} label={s} />)}
                  </Box>

                  {(selectedJob.min_experience_years > 0 || selectedJob.education_level) && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2.5 }}>
                      {selectedJob.min_experience_years > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Work sx={{ fontSize: 14, color: C.dim }} />
                          <Typography sx={{ fontSize: '0.78rem', color: C.muted }}>
                            Min. {selectedJob.min_experience_years} tahun pengalaman
                          </Typography>
                        </Box>
                      )}
                      {selectedJob.education_level && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <School sx={{ fontSize: 14, color: C.dim }} />
                          <Typography sx={{ fontSize: '0.78rem', color: C.muted }}>
                            {selectedJob.education_level}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {selectedJob.requirements && (
                    <>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em',
                        color: C.dim, textTransform: 'uppercase', mb: 1 }}>
                        Persyaratan
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: C.muted, whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                        {selectedJob.requirements}
                      </Typography>
                    </>
                  )}

                  <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${C.border}` }}>
                    <Button size="small" startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
                      onClick={() => setStep(0)}
                      sx={{ color: C.dim, borderRadius: '8px',
                        '&:hover': { color: C.text, bgcolor: 'rgba(255,255,255,0.05)' } }}>
                      Ganti Posisi
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {/* Form */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{
                  bgcolor: '#09090e', border: `1px solid ${C.border}`,
                  borderRadius: '18px', p: { xs: 3, md: 4 },
                }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: C.text, mb: 0.5 }}>
                    Lengkapi Lamaranmu
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: C.muted, mb: 4 }}>
                    Isi data diri dan upload CV dalam format PDF atau DOCX (maks. 10MB)
                  </Typography>

                  {error && (
                    <Alert severity="error" onClose={() => setError('')} sx={{
                      mb: 3, borderRadius: '10px',
                      bgcolor: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)',
                      color: '#fca5a5', '& .MuiAlert-icon': { color: C.red },
                    }}>
                      {error}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Personal info */}
                    <Box>
                      <SectionHead icon={<Person sx={{ fontSize: 15, color: C.blue }} />} text="Informasi Pribadi" />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField label="Nama Lengkap" fullWidth required
                          value={fullName} onChange={e => setFullName(e.target.value)}
                          placeholder="Nama sesuai KTP" sx={inputSx}
                          slotProps={{ input: { startAdornment: <Person sx={{ mr: 1, fontSize: 18 }} /> } }}
                        />
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Email Aktif" type="email" fullWidth required
                              value={email} onChange={e => setEmail(e.target.value)}
                              placeholder="contoh@email.com"
                              helperText="Notifikasi seleksi dikirim ke sini"
                              sx={inputSx}
                              slotProps={{ input: { startAdornment: <Email sx={{ mr: 1, fontSize: 18 }} /> } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Nomor Telepon" fullWidth
                              value={phone} onChange={e => setPhone(e.target.value)}
                              placeholder="+62 812 xxxx xxxx" sx={inputSx}
                              slotProps={{ input: { startAdornment: <Phone sx={{ mr: 1, fontSize: 18 }} /> } }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>

                    <Box sx={{ bgcolor: C.border, height: '1px' }} />

                    {/* Upload */}
                    <Box>
                      <SectionHead icon={<Description sx={{ fontSize: 15, color: C.blue }} />} text="Upload CV / Berkas" />

                      {file ? (
                        <Box sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                          p: 2.5, borderRadius: '12px',
                          bgcolor: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.18)',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                              width: 42, height: 42, borderRadius: '10px', flexShrink: 0,
                              bgcolor: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <InsertDriveFile sx={{ color: C.green, fontSize: 22 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: C.text }}>
                                {file.name}
                              </Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: C.dim }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB · {file.name.split('.').pop()?.toUpperCase()}
                              </Typography>
                            </Box>
                          </Box>
                          <Button size="small" startIcon={<Close sx={{ fontSize: 13 }} />}
                            onClick={() => setFile(null)} sx={{
                              color: C.red, flexShrink: 0,
                              border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px',
                              '&:hover': { bgcolor: 'rgba(248,113,113,0.07)' },
                            }}>
                            Hapus
                          </Button>
                        </Box>
                      ) : (
                        <Box {...getRootProps()} sx={{
                          border: '1.5px dashed',
                          borderColor: isDragActive ? C.blue : 'rgba(255,255,255,0.09)',
                          borderRadius: '16px', p: { xs: 5, md: 7 }, textAlign: 'center', cursor: 'pointer',
                          bgcolor: isDragActive ? 'rgba(96,165,250,0.05)' : 'rgba(255,255,255,0.014)',
                          transition: 'all 0.2s ease',
                          boxShadow: isDragActive ? '0 0 0 6px rgba(96,165,250,0.08)' : 'none',
                          '&:hover': { borderColor: 'rgba(96,165,250,0.28)', bgcolor: 'rgba(96,165,250,0.03)' },
                        }}>
                          <input {...getInputProps()} />
                          <Box sx={{
                            width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 3,
                            background: isDragActive
                              ? 'linear-gradient(135deg,#3b82f6,#7c3aed)'
                              : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isDragActive ? 'rgba(96,165,250,0.45)' : 'rgba(255,255,255,0.07)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: isDragActive ? '0 0 36px rgba(96,165,250,0.4)' : 'none',
                          }}>
                            <CloudUpload sx={{ fontSize: 30, color: isDragActive ? '#fff' : C.dim, transition: 'color 0.2s' }} />
                          </Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: C.text, mb: 0.75 }}>
                            {isDragActive ? 'Lepaskan di sini...' : 'Seret & lepas file CV'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: C.muted, mb: 3 }}>
                            atau{' '}
                            <Box component="span" sx={{ color: C.blue, fontWeight: 700 }}>klik untuk memilih</Box>
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            {['PDF', 'DOCX', 'Max 10MB'].map(t => (
                              <Box key={t} sx={{
                                px: 1.5, py: 0.3, borderRadius: '6px',
                                bgcolor: C.surface, border: `1px solid ${C.border}`,
                              }}>
                                <Typography sx={{ fontSize: '0.68rem', color: C.dim }}>{t}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* Upload progress */}
                    {submitting && (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ fontSize: '0.78rem', color: C.muted }}>Mengirim lamaran...</Typography>
                          <Typography sx={{ fontSize: '0.78rem', color: C.blue, fontWeight: 700 }}>{progress}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={progress} sx={{
                          height: 5, borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.06)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: '3px',
                          },
                        }} />
                      </Box>
                    )}

                    {/* Submit */}
                    <Button variant="contained" size="large" fullWidth
                      disabled={submitting || !file || !fullName || !email}
                      onClick={submit}
                      sx={{ ...primaryBtn, py: 1.8, fontSize: '0.95rem' }}>
                      {submitting
                        ? <CircularProgress size={22} sx={{ color: C.blue }} />
                        : 'Kirim Lamaran Sekarang'}
                    </Button>

                    <Typography sx={{ fontSize: '0.72rem', color: C.dim, textAlign: 'center', lineHeight: 1.8 }}>
                      Dengan mengirim lamaran, Anda menyetujui data Anda diproses untuk keperluan rekrutmen.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* ══ STEP 2: Success ═════════════════════════ */}
          {step === 2 && (
            <Box sx={{ maxWidth: 520, mx: 'auto', textAlign: 'center', pt: 6 }}>
              {/* Icon with triple ring */}
              <Box sx={{
                width: 110, height: 110, borderRadius: '50%',
                background: 'linear-gradient(135deg,#059669,#34d399)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 4,
                boxShadow: '0 0 0 20px rgba(52,211,153,0.06), 0 0 0 40px rgba(52,211,153,0.03), 0 0 100px rgba(52,211,153,0.28)',
                animation: `${float} 3s ease-in-out infinite`,
              }}>
                <CheckCircle sx={{ fontSize: 52, color: '#fff' }} />
              </Box>

              <Typography fontWeight={900} sx={{
                fontSize: '2.2rem', mb: 1.5, letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg,#dcfce7,#86efac,#34d399)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Lamaran Terkirim!
              </Typography>
              <Typography sx={{ color: C.muted, mb: 1, fontSize: '0.95rem' }}>
                {result?.message || 'Lamaran kamu telah berhasil dikirim.'}
              </Typography>
              <Typography sx={{ color: C.muted, mb: 5, lineHeight: 1.9, fontSize: '0.875rem' }}>
                CV untuk posisi{' '}
                <Box component="span" sx={{ color: C.text, fontWeight: 800 }}>{result?.job_title}</Box>{' '}
                sedang diproses. Kami hubungi via email jika profilmu sesuai.
              </Typography>

              {/* Steps card */}
              <Box sx={{
                bgcolor: '#09090e', border: `1px solid ${C.border}`,
                borderRadius: '18px', p: 3, mb: 4, textAlign: 'left',
                position: 'relative', overflow: 'hidden',
                '&::before': {
                  content: '""', position: 'absolute',
                  top: 0, left: 0, right: 0, height: '2px',
                  background: 'linear-gradient(90deg,#059669,#34d399)',
                },
              }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em',
                  color: C.dim, textTransform: 'uppercase', mb: 2.5 }}>
                  Selanjutnya
                </Typography>
                {[
                  { t: 'CV diproses sistem AI SmartRecruit secara otomatis', c: C.blue },
                  { t: 'Tim rekrutmen meninjau kandidat terbaik', c: C.purple },
                  { t: 'Kandidat terpilih dihubungi email dalam 3–5 hari kerja', c: C.green },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: i < 2 ? 1.75 : 0 }}>
                    <Box sx={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0, mt: 0.1,
                      background: `${item.c}18`, border: `1px solid ${item.c}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: item.c }}>{i + 1}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: C.muted, lineHeight: 1.75 }}>{item.t}</Typography>
                  </Box>
                ))}
              </Box>

              <Button variant="contained" size="large" onClick={reset}
                sx={{ ...primaryBtn, px: 5, py: 1.5 }}>
                Lamar Posisi Lain
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* ── FOOTER ───────────────────────────────────── */}
      <Box sx={{
        position: 'relative', zIndex: 1,
        borderTop: `1px solid ${C.border}`,
        bgcolor: 'rgba(255,255,255,0.01)', py: 3,
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LeaderboardIcon sx={{ color: C.blue, fontSize: 15 }} />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: C.blue }}>SmartRecruit</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: C.dim }}>
              © 2025 SmartRecruit · Data dilindungi sesuai kebijakan privasi
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
