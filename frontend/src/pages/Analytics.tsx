import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Select, MenuItem, FormControl,
  InputLabel, Alert, Chip, Grid, Skeleton,
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import {
  analyticsService,
  type TrendData, type ScoreDistribution, type SourceBreakdown, type BiasReport,
} from '../services/analytics';
import { jobService } from '../services/jobs';
import type { Job } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [scoreDist, setScoreDist] = useState<ScoreDistribution[]>([]);
  const [sources, setSources] = useState<SourceBreakdown[]>([]);
  const [biasReport, setBiasReport] = useState<BiasReport | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [trendDays, setTrendDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      jobService.list(),
      analyticsService.getApplicantsTrend(trendDays),
      analyticsService.getScoreDistribution(),
      analyticsService.getSourceBreakdown(),
    ])
      .then(([jobRes, trendRes, scoreRes, sourceRes]) => {
        setJobs(jobRes.items);
        setTrend(trendRes);
        setScoreDist(scoreRes);
        setSources(sourceRes);
      })
      .catch(() => setError('Gagal memuat data analytics'))
      .finally(() => setLoading(false));
  }, [trendDays]);

  useEffect(() => {
    if (!selectedJobId) {
      setBiasReport(null);
      return;
    }
    analyticsService.getBiasReport(selectedJobId).then(setBiasReport).catch(() => {});
  }, [selectedJobId]);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((i) => (
          <Grid size={{ xs: 12, md: 6 }} key={i}>
            <Skeleton variant="rounded" height={350} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Applicant Trend */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" fontWeight={600}>Tren Pelamar</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select value={trendDays} onChange={(e) => setTrendDays(e.target.value as number)}>
                    <MenuItem value={7}>7 Hari</MenuItem>
                    <MenuItem value={30}>30 Hari</MenuItem>
                    <MenuItem value={90}>90 Hari</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Pelamar" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Source Breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} className="mb-4">Sumber Pelamar</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sources}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {sources.map((_e, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Score Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} className="mb-4">Distribusi Skor</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Kandidat" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Bias Audit */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} className="mb-4">
                Audit Bias (4/5ths Rule)
              </Typography>
              <FormControl fullWidth className="mb-4">
                <InputLabel>Pilih Lowongan</InputLabel>
                <Select
                  value={selectedJobId}
                  label="Pilih Lowongan"
                  onChange={(e) => setSelectedJobId(e.target.value as number)}
                >
                  {jobs.map((job) => (
                    <MenuItem key={job.id} value={job.id}>
                      {job.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {biasReport ? (
                <Box>
                  <Box className="flex items-center gap-2 mb-3">
                    {biasReport.four_fifths_compliant ? (
                      <>
                        <CheckCircleIcon color="success" />
                        <Chip label="Compliant" color="success" size="small" />
                      </>
                    ) : (
                      <>
                        <WarningIcon color="warning" />
                        <Chip label="Non-Compliant" color="warning" size="small" />
                      </>
                    )}
                  </Box>
                  <Typography variant="body2" className="mb-3">
                    {biasReport.details}
                  </Typography>
                  <Typography variant="subtitle2" className="mb-2">Distribusi Skor per Demografi:</Typography>
                  {Object.entries(biasReport.score_by_demographic).map(([key, value]) => (
                    <Box key={key} className="flex justify-between items-center py-1">
                      <Typography variant="body2">{key}</Typography>
                      <Chip label={`${Number(value).toFixed(1)}`} size="small" variant="outlined" />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Pilih lowongan untuk melihat laporan audit bias.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
