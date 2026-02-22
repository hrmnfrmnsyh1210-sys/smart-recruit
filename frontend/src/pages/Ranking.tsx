import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, Alert, LinearProgress, Tooltip, Grid,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { rankingService } from '../services/ranking';
import { jobService } from '../services/jobs';
import type { Job, Ranking as RankingType } from '../types';

export default function Ranking() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [rankings, setRankings] = useState<RankingType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [compareData, setCompareData] = useState<RankingType[]>([]);

  useEffect(() => {
    jobService.list().then((res) => setJobs(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    setLoading(true);
    rankingService
      .getByJob(selectedJobId)
      .then((data) => setRankings(Array.isArray(data) ? data : []))
      .catch(() => setError('Gagal memuat ranking'))
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!selectedJobId) return;
    try {
      const blob = await rankingService.exportRanking(selectedJobId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ranking-job-${selectedJobId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Gagal mengekspor ranking');
    }
  };

  const handleCompare = async () => {
    if (selectedForCompare.length < 2 || !selectedJobId) return;
    try {
      const data = await rankingService.compare(selectedForCompare, selectedJobId);
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

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
      width: 130,
      renderCell: (params) => (
        <Box className="flex items-center gap-2 w-full">
          <LinearProgress
            variant="determinate"
            value={params.value}
            color={getScoreColor(params.value)}
            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" fontWeight={600}>
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
        <Chip label={params.value?.toFixed(1)} size="small" color={getScoreColor(params.value)} variant="outlined" />
      ),
    },
    {
      field: 'experience_score',
      headerName: 'Pengalaman',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value?.toFixed(1)} size="small" color={getScoreColor(params.value)} variant="outlined" />
      ),
    },
    {
      field: 'education_score',
      headerName: 'Pendidikan',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value?.toFixed(1)} size="small" color={getScoreColor(params.value)} variant="outlined" />
      ),
    },
    {
      field: 'matched_skills',
      headerName: 'Skills Cocok',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box className="flex flex-wrap gap-1 py-1">
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
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant={selectedForCompare.includes(params.row.candidate_id) ? 'contained' : 'outlined'}
          onClick={() => toggleCompare(params.row.candidate_id)}
        >
          {selectedForCompare.includes(params.row.candidate_id) ? 'Dipilih' : 'Pilih'}
        </Button>
      ),
    },
  ];

  const RADAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <Box>
      {error && <Alert severity="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }} className="mb-4">
        <CardContent>
          <Box className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Pilih Lowongan</InputLabel>
              <Select
                value={selectedJobId}
                label="Pilih Lowongan"
                onChange={(e) => setSelectedJobId(e.target.value as number)}
              >
                {jobs.map((job) => (
                  <MenuItem key={job.id} value={job.id}>
                    {job.title} - {job.department}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box className="flex gap-2">
              {selectedForCompare.length >= 2 && (
                <Button
                  variant="outlined"
                  startIcon={<CompareArrowsIcon />}
                  onClick={handleCompare}
                >
                  Bandingkan ({selectedForCompare.length})
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('csv')}
                disabled={!selectedJobId}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('pdf')}
                disabled={!selectedJobId}
              >
                Export PDF
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Rankings Table */}
      {selectedJobId && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }} className="mb-4">
          <CardContent>
            <Typography variant="h6" fontWeight={600} className="mb-3">
              Hasil Ranking ({rankings.length} kandidat)
            </Typography>
            <DataGrid
              rows={rankings}
              columns={columns}
              loading={loading}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              getRowHeight={() => 'auto'}
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': { py: 1 },
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Comparison Radar Chart */}
      {compareData.length >= 2 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} className="mb-3">
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
                      { metric: 'Kecocokan Semantik', ...Object.fromEntries(compareData.map((c, i) => [`c${i}`, c.semantic_similarity * 100])) },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
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
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                {compareData.map((c, i) => (
                  <Card key={c.candidate_id} variant="outlined" className="p-4 mb-3">
                    <Box className="flex items-center gap-2 mb-2">
                      <Box
                        className="w-4 h-4 rounded-full"
                        sx={{ bgcolor: RADAR_COLORS[i] }}
                      />
                      <Typography fontWeight={600}>
                        {c.candidate?.full_name || `Kandidat #${c.candidate_id}`}
                      </Typography>
                      <Chip label={`Skor: ${c.overall_score.toFixed(1)}`} color={getScoreColor(c.overall_score)} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" className="mb-2">
                      {c.explanation}
                    </Typography>
                    <Box className="flex flex-wrap gap-1">
                      {c.matched_skills?.map((skill) => (
                        <Chip key={skill} label={skill} size="small" color="success" variant="outlined" />
                      ))}
                    </Box>
                    {c.missing_skills?.length > 0 && (
                      <Box className="mt-2">
                        <Typography variant="caption" color="error">Skills kurang:</Typography>
                        <Box className="flex flex-wrap gap-1 mt-1">
                          {c.missing_skills.map((skill) => (
                            <Chip key={skill} label={skill} size="small" color="error" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Card>
                ))}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
