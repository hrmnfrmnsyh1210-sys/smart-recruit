import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Chip, Typography,
  IconButton, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Grid, MenuItem, Select, FormControl, InputLabel,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { jobService, type CreateJobRequest } from '../services/jobs';
import { rankingService } from '../services/ranking';
import type { Job } from '../types';

const statusColors: Record<string, 'success' | 'error' | 'default'> = {
  open: 'success',
  closed: 'error',
  draft: 'default',
};

const statusLabels: Record<string, string> = {
  open: 'Terbuka',
  closed: 'Ditutup',
  draft: 'Draft',
};

const JOBS_PER_PAGE = 10;

const emptyJob: CreateJobRequest = {
  title: '',
  department: '',
  description: '',
  requirements: '',
  skills_required: [],
  min_experience_years: 0,
  education_level: '',
  status: 'draft',
};

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<CreateJobRequest>(emptyJob);
  const [skillInput, setSkillInput] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await jobService.list({ search: search || undefined });
      setJobs(result.items);
      setPage(1);
    } catch {
      setError('Gagal memuat data lowongan');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleOpenForm = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        department: job.department,
        description: job.description,
        requirements: job.requirements,
        skills_required: job.skills_required,
        min_experience_years: job.min_experience_years,
        education_level: job.education_level,
        status: job.status,
      });
    } else {
      setEditingJob(null);
      setFormData(emptyJob);
    }
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingJob) {
        await jobService.update(editingJob.id, formData);
        setSuccess('Lowongan berhasil diperbarui');
      } else {
        await jobService.create(formData);
        setSuccess('Lowongan berhasil dibuat');
      }
      setFormOpen(false);
      loadJobs();
    } catch {
      setError('Gagal menyimpan lowongan');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await jobService.delete(deleteId);
      setDeleteId(null);
      loadJobs();
    } catch {
      setError('Gagal menghapus lowongan');
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills_required.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills_required: [...prev.skills_required, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills_required: prev.skills_required.filter((s) => s !== skill),
    }));
  };

  const handleRunRanking = async (jobId: number) => {
    try {
      await rankingService.runRanking(jobId);
      setSuccess('Proses ranking dimulai. Cek halaman Ranking untuk melihat hasil.');
    } catch {
      setError('Gagal memulai ranking');
    }
  };

  const totalPages = Math.ceil(jobs.length / JOBS_PER_PAGE);
  const pagedJobs = jobs.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2, mb: 3 }}>
        <TextField
          placeholder="Cari lowongan..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon /></InputAdornment>
              ),
            },
          }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
          Buat Lowongan
        </Button>
      </Box>

      <Grid container spacing={3}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: 200 }} />
              </Grid>
            ))
          : pagedJobs.map((job) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={job.id}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography variant="h6" fontWeight={600} sx={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flex: 1, mr: 1,
                      }}>
                        {job.title}
                      </Typography>
                      <Chip
                        label={statusLabels[job.status]}
                        color={statusColors[job.status]}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {job.department}
                    </Typography>
                    <Typography variant="body2" sx={{
                      mb: 2, display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {job.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                      {job.skills_required?.slice(0, 4).map((skill) => (
                        <Chip key={skill} label={skill} size="small" variant="outlined" />
                      ))}
                      {(job.skills_required?.length ?? 0) > 4 && (
                        <Chip label={`+${job.skills_required.length - 4}`} size="small" />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Min. {job.min_experience_years} tahun exp.
                      </Typography>
                      <Box>
                        <IconButton size="small" color="primary" onClick={() => handleRunRanking(job.id)} title="Jalankan Ranking">
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleOpenForm(job)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(job.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </Box>
      )}
      {!loading && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
          {jobs.length > 0 ? `Menampilkan ${(page - 1) * JOBS_PER_PAGE + 1}–${Math.min(page * JOBS_PER_PAGE, jobs.length)} dari ${jobs.length} lowongan` : 'Tidak ada lowongan'}
        </Typography>
      )}

      {/* Job Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingJob ? 'Edit Lowongan' : 'Buat Lowongan Baru'}</DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-2">
            <TextField
              label="Judul Posisi"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              required
            />
            <TextField
              label="Departemen"
              fullWidth
              value={formData.department}
              onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
            />
            <TextField
              label="Deskripsi Pekerjaan"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              required
            />
            <TextField
              label="Persyaratan"
              fullWidth
              multiline
              rows={3}
              value={formData.requirements}
              onChange={(e) => setFormData((p) => ({ ...p, requirements: e.target.value }))}
            />
            <Box>
              <Typography variant="subtitle2" className="mb-2">Keahlian yang Dibutuhkan</Typography>
              <Box className="flex gap-2 mb-2">
                <TextField
                  size="small"
                  placeholder="Tambah skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="flex-1"
                />
                <Button variant="outlined" onClick={handleAddSkill}>Tambah</Button>
              </Box>
              <Box className="flex flex-wrap gap-1">
                {formData.skills_required.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                    color="primary"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Min. Pengalaman (tahun)"
                  type="number"
                  fullWidth
                  value={formData.min_experience_years}
                  onChange={(e) => setFormData((p) => ({ ...p, min_experience_years: Number(e.target.value) }))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Tingkat Pendidikan"
                  fullWidth
                  value={formData.education_level}
                  onChange={(e) => setFormData((p) => ({ ...p, education_level: e.target.value }))}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as 'open' | 'closed' | 'draft' }))}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="open">Terbuka</MenuItem>
                <MenuItem value="closed">Ditutup</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingJob ? 'Simpan' : 'Buat'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>Apakah Anda yakin ingin menghapus lowongan ini?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Batal</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Hapus</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
