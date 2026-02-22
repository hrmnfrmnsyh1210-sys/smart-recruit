import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Skeleton } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { analyticsService, type TrendData, type ScoreDistribution, type SourceBreakdown } from '../services/analytics';
import type { AnalyticsOverview } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardContent className="flex items-center gap-4">
        <Box
          className="flex items-center justify-center rounded-xl"
          sx={{ width: 56, height: 56, bgcolor: `${color}15` }}
        >
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [scoreDist, setScoreDist] = useState<ScoreDistribution[]>([]);
  const [sources, setSources] = useState<SourceBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ov, tr, sd, sr] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getApplicantsTrend(30),
          analyticsService.getScoreDistribution(),
          analyticsService.getSourceBreakdown(),
        ]);
        setOverview(ov);
        setTrend(tr);
        setScoreDist(sd);
        setSources(sr);
      } catch {
        // Will show empty state
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3} className="mt-2">
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rounded" height={350} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rounded" height={350} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Kandidat"
            value={overview?.total_candidates ?? 0}
            icon={<PeopleIcon fontSize="large" />}
            color="#3b82f6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Lowongan"
            value={overview?.total_jobs ?? 0}
            icon={<WorkIcon fontSize="large" />}
            color="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Posisi Terbuka"
            value={overview?.open_positions ?? 0}
            icon={<TrendingUpIcon fontSize="large" />}
            color="#f59e0b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Upload Terbaru"
            value={overview?.recent_uploads ?? 0}
            icon={<CloudUploadIcon fontSize="large" />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} className="mt-2">
        {/* Applicant Trend */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} className="mb-4">
                Tren Pelamar (30 Hari Terakhir)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Pelamar"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Source Breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} className="mb-4">
                Sumber Pelamar
              </Typography>
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
                    {sources.map((_entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Score Distribution */}
      <Grid container spacing={3} className="mt-2">
        <Grid size={{ xs: 12 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} className="mb-4">
                Distribusi Skor Kandidat
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Jumlah Kandidat" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
