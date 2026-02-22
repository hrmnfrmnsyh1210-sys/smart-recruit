import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Chip, Typography,
  IconButton, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { candidateService } from '../services/candidates';
import type { Candidate } from '../types';

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const result = await candidateService.list({
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
        search: search || undefined,
      });
      setCandidates(result.items);
      setTotal(result.total);
    } catch {
      setError('Gagal memuat data kandidat');
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await candidateService.delete(deleteId);
      setDeleteId(null);
      loadCandidates();
    } catch {
      setError('Gagal menghapus kandidat');
    }
  };

  const handleExport = async (id: number) => {
    try {
      const blob = await candidateService.exportData(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidate-${id}-data.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Gagal mengekspor data');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'full_name', headerName: 'Nama Lengkap', flex: 1, minWidth: 180 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'skills',
      headerName: 'Keahlian',
      flex: 1.5,
      minWidth: 250,
      renderCell: (params) => (
        <Box className="flex flex-wrap gap-1 py-1">
          {(params.value as string[] || []).slice(0, 3).map((skill: string) => (
            <Chip key={skill} label={skill} size="small" color="primary" variant="outlined" />
          ))}
          {(params.value as string[] || []).length > 3 && (
            <Chip label={`+${(params.value as string[]).length - 3}`} size="small" />
          )}
        </Box>
      ),
    },
    { field: 'source', headerName: 'Sumber', width: 120 },
    {
      field: 'created_at',
      headerName: 'Tanggal',
      width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString('id-ID'),
    },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => setSelectedCandidate(params.row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleExport(params.row.id)}>
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteId(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {error && (
        <Alert severity="error" className="mb-4" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Box className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <Typography variant="h6" fontWeight={600}>
              Daftar Kandidat ({total})
            </Typography>
            <TextField
              placeholder="Cari kandidat..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 280 }}
            />
          </Box>

          <DataGrid
            rows={candidates}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            rowCount={total}
            paginationMode="server"
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            getRowHeight={() => 'auto'}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': { py: 1 },
            }}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCandidate} onClose={() => setSelectedCandidate(null)} maxWidth="md" fullWidth>
        <DialogTitle>Detail Kandidat</DialogTitle>
        <DialogContent>
          {selectedCandidate && (
            <Box className="space-y-4 mt-2">
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Nama</Typography>
                <Typography variant="body1">{selectedCandidate.full_name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedCandidate.email}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Telepon</Typography>
                <Typography variant="body1">{selectedCandidate.phone || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Keahlian</Typography>
                <Box className="flex flex-wrap gap-1 mt-1">
                  {selectedCandidate.skills?.map((skill) => (
                    <Chip key={skill} label={skill} size="small" color="primary" />
                  ))}
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Pengalaman</Typography>
                {selectedCandidate.experience?.map((exp, i) => (
                  <Card key={i} variant="outlined" className="p-3 mt-2">
                    <Typography fontWeight={600}>{exp.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {exp.company} - {exp.duration}
                    </Typography>
                    <Typography variant="body2" className="mt-1">{exp.description}</Typography>
                  </Card>
                ))}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Pendidikan</Typography>
                {selectedCandidate.education?.map((edu, i) => (
                  <Card key={i} variant="outlined" className="p-3 mt-2">
                    <Typography fontWeight={600}>{edu.degree}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {edu.institution} - {edu.year}
                    </Typography>
                  </Card>
                ))}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Ringkasan</Typography>
                <Typography variant="body2">{selectedCandidate.summary || '-'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCandidate(null)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Apakah Anda yakin ingin menghapus kandidat ini? Semua data termasuk CV akan dihapus permanen.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Batal</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
