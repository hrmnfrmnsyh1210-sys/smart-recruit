import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Alert, LinearProgress,
  Tooltip, Grid, Pagination, Skeleton, CircularProgress,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { rankingService } from '../services/ranking';
import { jobService } from '../services/jobs';
import type { Job, Ranking as RankingType } from '../types';

const JOBS_PER_PAGE = 10;

const C = {
  surface: 'rgba(255,255,255,0.032)',
  border: 'rgba(255,255,255,0.072)',
  text: '#f1f5ff',
  muted: 'rgba(241,245,255,0.5)',
  dim: 'rgba(241,245,255,0.26)',
  blue: '#60a5fa',
  purple: '#a78bfa',
  green: '#34d399',
  red: '#f87171',
  yellow: '#fbbf24',
} as const;

const ACCENT_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fb923c', '#f472b6'];
const RADAR_COLORS = ['#60a5fa', '#34d399', '#fbbf24'];

const statusLabels: Record<string, string> = {
  open: 'Terbuka',
  closed: 'Ditutup',
  draft: 'Draft',
};

export default function Ranking() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [rankings, setRankings] = useState<RankingType[]>([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [runningStatus, setRunningStatus] = useState('');
  const [error, setError] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [compareData, setCompareData] = useState<RankingType[]>([]);
  const [jobPage, setJobPage] = useState(1);

  useEffect(() => {
    setJobsLoading(true);
    jobService.list()
      .then((res) => setJobs(res.items))
      .catch(() => setError('Gagal memuat daftar lowongan'))
      .finally(() => setJobsLoading(false));
  }, []);

  const fetchOrRunRanking = useCallback(async (job: Job) => {
    setRankingLoading(true);
    setRankings([]);
    setSelectedForCompare([]);
    setCompareData([]);
    setError('');
    setAutoRunning(true);
    setRunningStatus('Menjalankan AI ranking untuk semua pelamar...');

    try {
      // Always re-run to get fresh results including all new applicants
      await rankingService.runRanking(job.id);

      setRunningStatus('Memuat hasil ranking...');
      const fresh = await rankingService.getByJob(job.id);
      setRankings(Array.isArray(fresh) ? fresh : []);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || 'Gagal memuat ranking. Pastikan ada pelamar dengan CV yang sudah diproses.');
    } finally {
      setRankingLoading(false);
      setAutoRunning(false);
      setRunningStatus('');
    }
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    fetchOrRunRanking(selectedJob);
  }, [selectedJob, fetchOrRunRanking]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!selectedJob) return;
    try {
      const blob = await rankingService.exportRanking(selectedJob.id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ranking-job-${selectedJob.id}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Gagal mengekspor ranking');
    }
  };

  const handleCompare = async () => {
    if (selectedForCompare.length < 2 || !selectedJob) return;
    try {
      const data = await rankingService.compare(selectedForCompare, selectedJob.id);
      setCompareData(data);
    } catch {
      setError('Gagal membandingkan kandidat');
    }
  };

  const toggleCompare = (candidateId: number) => {
    setSelectedForCompare((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : prev.length < 3
        ? [...prev, candidateId]
        : prev
    );
  };

  const getScoreMuiColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreHex = (score: number) => {
    if (score >= 80) return C.green;
    if (score >= 60) return C.yellow;
    return C.red;
  };

  const totalJobPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
  const pagedJobs = jobs.slice((jobPage - 1) * JOBS_PER_PAGE, jobPage * JOBS_PER_PAGE);

  const columns: GridColDef[] = [
    { field: 'rank_position', headerName: '#', width: 60 },
    {
      field: 'candidate_name',
      headerName: 'Kandidat',
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row.candidate?.full_name || `Kandidat #${row.candidate_id}`,
    },
    {
      field: 'overall_score',
      headerName: 'Skor Total',
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={params.value}
            color={getScoreMuiColor(params.value)}
            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
          />
          <Typography variant="body2" fontWeight={700} sx={{ color: getScoreHex(params.value), minWidth: 36 }}>
            {params.value?.toFixed(1)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'skill_score',
      headerName: 'Skills',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value?.toFixed(1)} size="small" color={getScoreMuiColor(params.value)} variant="outlined" />
      ),
    },
    {
      field: 'experience_score',
      headerName: 'Pengalaman',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value?.toFixed(1)} size="small" color={getScoreMuiColor(params.value)} variant="outlined" />
      ),
    },
    {
      field: 'education_score',
      headerName: 'Pendidikan',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value?.toFixed(1)} size="small" color={getScoreMuiColor(params.value)} variant="outlined" />
      ),
    },
    {
      field: 'matched_skills',
      headerName: 'Skills Cocok',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 1 }}>
          {(params.value as string[] || []).slice(0, 3).map((skill: string) => (
            <Chip key={skill} label={skill} size="small" color="success" variant="outlined" />
          ))}
          {(params.value as string[] || []).length > 3 && (
            <Tooltip title={(params.value as string[]).slice(3).join(', ')}>
              <Chip label={`+${(params.value as string[]).length - 3}`} size="small" />
            </Tooltip>
          )}
        </Box>
      ),
    },
    {
      field: 'compare',
      headerName: 'Bandingkan',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant={selectedForCompare.includes(params.row.candidate_id) ? 'contained' : 'outlined'}
          onClick={() => toggleCompare(params.row.candidate_id)}
          sx={{ fontSize: '0.72rem', minWidth: 'auto', px: 1.5 }}
        >
          {selectedForCompare.includes(params.row.candidate_id) ? 'Dipilih' : 'Pilih'}
        </Button>
      ),
    },
  ];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {/* ── Job Cards Section ─────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        {/* Section header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          mb: 3, flexWrap: 'wrap', gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg,rgba(96,165,250,0.2),rgba(167,139,250,0.2))',
              border: '1px solid rgba(96,165,250,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LeaderboardIcon sx={{ color: C.blue, fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: C.text }}>
                Pilih Lowongan
              </Typography>
              <Typography variant="body2" sx={{ color: C.muted }}>
                {jobsLoading ? 'Memuat...' : `${jobs.length} lowongan tersedia — klik kartu untuk melihat ranking`}
              </Typography>
            </Box>
          </Box>

          {/* Action buttons (visible when job selected) */}
          {selectedJob && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedForCompare.length >= 2 && (
                <Button
                  variant="outlined"
                  startIcon={<CompareArrowsIcon />}
                  onClick={handleCompare}
                  size="small"
                  sx={{ borderColor: C.purple, color: C.purple, '&:hover': { borderColor: C.purple, bgcolor: `${C.purple}10` } }}
                >
                  Bandingkan ({selectedForCompare.length})
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={rankingLoading ? <CircularProgress size={14} /> : <RefreshIcon />}
                onClick={() => fetchOrRunRanking(selectedJob)}
                size="small"
                disabled={rankingLoading}
              >
                Jalankan Ulang
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('csv')}
                size="small"
                disabled={rankings.length === 0}
              >
                Export CSV
              </Button>
            </Box>
          )}
        </Box>

        {/* Job Cards Grid */}
        {jobsLoading ? (
          <Grid container spacing={2}>
            {[...Array(6)].map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                <Skeleton
                  variant="rounded"
                  height={160}
                  sx={{ borderRadius: '16px', bgcolor: C.surface }}
                />
              </Grid>
            ))}
          </Grid>
        ) : jobs.length === 0 ? (
          <Box sx={{
            textAlign: 'center', py: 10,
            bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px',
          }}>
            <WorkIcon sx={{ fontSize: 44, color: C.dim, mb: 2, display: 'block', mx: 'auto' }} />
            <Typography sx={{ color: C.muted, fontWeight: 600 }}>Belum ada lowongan tersedia</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: C.dim, mt: 0.5 }}>
              Buat lowongan di menu Lowongan terlebih dahulu
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {pagedJobs.map((job, idx) => {
                const accent = ACCENT_COLORS[((jobPage - 1) * JOBS_PER_PAGE + idx) % ACCENT_COLORS.length];
                const isSelected = selectedJob?.id === job.id;
                return (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={job.id}>
                    <Box
                      onClick={() => setSelectedJob(isSelected ? null : job)}
                      sx={{
                        height: '100%', p: '1.5px', borderRadius: '16px', cursor: 'pointer',
                        background: isSelected
                          ? `linear-gradient(135deg,${accent}55,${accent}22)`
                          : C.border,
                        boxShadow: isSelected
                          ? `0 0 20px ${accent}18, 0 4px 24px rgba(0,0,0,0.4)`
                          : '0 2px 8px rgba(0,0,0,0.2)',
                        transition: 'all 0.25s ease',
                        '&:hover': {
                          background: isSelected
                            ? `linear-gradient(135deg,${accent}66,${accent}33)`
                            : `linear-gradient(135deg,${accent}40,${accent}18)`,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 0 24px ${accent}20, 0 6px 28px rgba(0,0,0,0.45)`,
                        },
                      }}
                    >
                      <Box sx={{
                        bgcolor: '#0c0c12',
                        borderRadius: '14px', p: 2.5,
                        height: '100%', display: 'flex', flexDirection: 'column',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        {/* Top accent bar when selected */}
                        {isSelected && (
                          <Box sx={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                            background: `linear-gradient(90deg,${accent},${accent}30)`,
                          }} />
                        )}

                        {/* Card header */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                          <Box sx={{
                            width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                            background: isSelected
                              ? `linear-gradient(135deg,${accent}30,${accent}18)`
                              : `linear-gradient(135deg,${accent}18,${accent}0c)`,
                            border: `1px solid ${accent}${isSelected ? '40' : '22'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.25s',
                          }}>
                            <BusinessCenterIcon sx={{ color: accent, fontSize: 20 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={700} sx={{
                              color: C.text, lineHeight: 1.3, mb: 0.25, fontSize: '0.9rem',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {job.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Box sx={{
                                width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                                bgcolor: job.status === 'open' ? C.green : C.dim,
                                boxShadow: job.status === 'open' ? `0 0 5px ${C.green}` : 'none',
                              }} />
                              <Typography sx={{ fontSize: '0.7rem', color: C.muted }}>
                                {job.department}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', color: C.dim }}>·</Typography>
                              <Typography sx={{
                                fontSize: '0.65rem',
                                color: job.status === 'open' ? C.green : C.dim,
                                fontWeight: 600,
                              }}>
                                {statusLabels[job.status] ?? job.status}
                              </Typography>
                            </Box>
                          </Box>
                          {isSelected && (
                            <Box sx={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0, mt: 0.2,
                              bgcolor: `${accent}22`, border: `1px solid ${accent}50`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <CheckCircleIcon sx={{ color: accent, fontSize: 14 }} />
                            </Box>
                          )}
                        </Box>

                        {/* Skills */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5, flex: 1 }}>
                          {job.skills_required?.slice(0, 3).map((s) => (
                            <Box key={s} sx={{
                              px: 1, py: 0.2, borderRadius: '5px',
                              bgcolor: `${accent}0c`,
                              border: `1px solid ${accent}${isSelected ? '35' : '22'}`,
                            }}>
                              <Typography sx={{ fontSize: '0.65rem', color: accent, fontWeight: 500 }}>{s}</Typography>
                            </Box>
                          ))}
                          {(job.skills_required?.length ?? 0) > 3 && (
                            <Box sx={{
                              px: 1, py: 0.2, borderRadius: '5px',
                              bgcolor: C.surface, border: `1px solid ${C.border}`,
                            }}>
                              <Typography sx={{ fontSize: '0.65rem', color: C.dim }}>
                                +{(job.skills_required?.length ?? 0) - 3}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Footer */}
                        <Box sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          pt: 1.5,
                          borderTop: `1px solid ${isSelected ? `${accent}25` : C.border}`,
                        }}>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            {job.min_experience_years > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                <WorkIcon sx={{ fontSize: 11, color: C.dim }} />
                                <Typography sx={{ fontSize: '0.65rem', color: C.dim }}>
                                  {job.min_experience_years}+ thn
                                </Typography>
                              </Box>
                            )}
                            {job.education_level && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                <SchoolIcon sx={{ fontSize: 11, color: C.dim }} />
                                <Typography sx={{ fontSize: '0.65rem', color: C.dim }}>
                                  {job.education_level}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          <Typography sx={{
                            fontSize: '0.65rem', fontWeight: isSelected ? 700 : 400,
                            color: isSelected ? accent : C.dim,
                          }}>
                            {isSelected ? 'Terpilih ✓' : 'Lihat ranking →'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Jobs Pagination */}
            {totalJobPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalJobPages}
                  page={jobPage}
                  onChange={(_, p) => { setJobPage(p); setSelectedJob(null); }}
                  color="primary"
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ── Rankings Section ─────────────────────────── */}
      {selectedJob && (
        <Box>
          {/* Section divider + title */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 2, mb: 3, pb: 2, borderBottom: `1px solid ${C.border}`,
            flexWrap: 'wrap',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 4, height: 32, borderRadius: '4px', flexShrink: 0,
                background: 'linear-gradient(180deg,#60a5fa,#a78bfa)',
              }} />
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: C.text }}>
                  Ranking — {selectedJob.title}
                </Typography>
                <Typography variant="body2" sx={{ color: C.muted }}>
                  {autoRunning
                    ? runningStatus
                    : rankingLoading
                    ? 'Memuat...'
                    : `${rankings.length} pelamar diurutkan berdasarkan kecocokan`}
                </Typography>
              </Box>
            </Box>
            {autoRunning && (
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1,
                borderRadius: '10px', bgcolor: 'rgba(167,139,250,0.08)',
                border: '1px solid rgba(167,139,250,0.2)',
              }}>
                <CircularProgress size={14} sx={{ color: C.purple }} />
                <AutoAwesomeIcon sx={{ fontSize: 14, color: C.purple }} />
                <Typography sx={{ fontSize: '0.78rem', color: C.purple, fontWeight: 600 }}>
                  AI sedang memproses...
                </Typography>
              </Box>
            )}
          </Box>

          {/* Auto-running animation bar */}
          {autoRunning && (
            <LinearProgress
              sx={{
                mb: 2, height: 3, borderRadius: 2,
                bgcolor: 'rgba(167,139,250,0.12)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg,#60a5fa,#a78bfa)',
                },
              }}
            />
          )}

          <Card elevation={0} sx={{ border: `1px solid ${C.border}` }}>
            <CardContent>
              {/* No results after run */}
              {!rankingLoading && !autoRunning && rankings.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: '14px', mx: 'auto', mb: 2,
                    bgcolor: C.surface, border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <LeaderboardIcon sx={{ fontSize: 26, color: C.dim }} />
                  </Box>
                  <Typography sx={{ color: C.muted, fontWeight: 600, mb: 0.5 }}>
                    Belum ada pelamar untuk posisi ini
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: C.dim }}>
                    Pelamar perlu mengupload CV dan CV-nya harus sudah diproses
                  </Typography>
                </Box>
              )}

              {/* DataGrid */}
              {(rankingLoading || rankings.length > 0) && (
                <DataGrid
                  rows={rankings}
                  columns={columns}
                  loading={rankingLoading || autoRunning}
                  autoHeight
                  disableRowSelectionOnClick
                  pageSizeOptions={[10]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  getRowHeight={() => 'auto'}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': { py: 1 },
                    '& .MuiDataGrid-columnHeaders': {
                      bgcolor: 'rgba(255,255,255,0.025)',
                      borderBottom: `1px solid ${C.border}`,
                    },
                    '& .MuiDataGrid-row:hover': {
                      bgcolor: 'rgba(96,165,250,0.04)',
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ── Comparison Radar Chart ─────────────────────── */}
      {compareData.length >= 2 && (
        <Card elevation={0} sx={{ border: `1px solid ${C.border}`, mt: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ color: C.text, mb: 3 }}>
              Perbandingan Kandidat
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart
                    data={[
                      { metric: 'Skills', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.skill_score])) },
                      { metric: 'Pengalaman', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.experience_score])) },
                      { metric: 'Pendidikan', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.education_score])) },
                      { metric: 'Sertifikasi', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.certification_score])) },
                      { metric: 'Kecocokan', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.semantic_similarity * 100])) },
                    ]}
                  >
                    <PolarGrid stroke={C.border} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: C.muted, fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: C.dim, fontSize: 10 }} />
                    {compareData.map((c, i) => (
                      <Radar
                        key={c.candidate_id}
                        name={c.candidate?.full_name || `Kandidat #${c.candidate_id}`}
                        dataKey={`c${i}`}
                        stroke={RADAR_COLORS[i]}
                        fill={RADAR_COLORS[i]}
                        fillOpacity={0.15}
                      />
                    ))}
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0c0c12',
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {compareData.map((c, i) => (
                  <Box key={c.candidate_id} sx={{
                    p: 2.5, mb: 2, borderRadius: '14px',
                    bgcolor: C.surface,
                    border: `1px solid ${RADAR_COLORS[i]}30`,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Box sx={{
                        width: 12, height: 12, borderRadius: '50%',
                        bgcolor: RADAR_COLORS[i], flexShrink: 0,
                      }} />
                      <Typography fontWeight={700} sx={{ color: C.text, flex: 1 }}>
                        {c.candidate?.full_name || `Kandidat #${c.candidate_id}`}
                      </Typography>
                      <Box sx={{
                        px: 1.5, py: 0.3, borderRadius: '6px',
                        bgcolor: `${RADAR_COLORS[i]}18`,
                        border: `1px solid ${RADAR_COLORS[i]}40`,
                      }}>
                        <Typography sx={{ fontSize: '0.75rem', color: RADAR_COLORS[i], fontWeight: 700 }}>
                          {c.overall_score.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: C.muted, mb: 1.5, fontSize: '0.8rem', lineHeight: 1.7 }}>
                      {c.explanation}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {c.matched_skills?.map((skill) => (
                        <Box key={skill} sx={{
                          px: 1, py: 0.2, borderRadius: '5px',
                          bgcolor: 'rgba(52,211,153,0.08)',
                          border: '1px solid rgba(52,211,153,0.2)',
                        }}>
                          <Typography sx={{ fontSize: '0.65rem', color: C.green, fontWeight: 500 }}>{skill}</Typography>
                        </Box>
                      ))}
                    </Box>
                    {c.missing_skills?.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: C.red, mb: 0.5, fontWeight: 600 }}>
                          Skills kurang:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {c.missing_skills.map((skill) => (
                            <Box key={skill} sx={{
                              px: 1, py: 0.2, borderRadius: '5px',
                              bgcolor: 'rgba(248,113,113,0.08)',
                              border: '1px solid rgba(248,113,113,0.2)',
                            }}>
                              <Typography sx={{ fontSize: '0.65rem', color: C.red, fontWeight: 500 }}>{skill}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
