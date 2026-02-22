import { useState, useCallback, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, LinearProgress, Alert,
  List, ListItem, ListItemIcon, ListItemText, Chip, Select,
  MenuItem, FormControl, InputLabel,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useDropzone } from 'react-dropzone';
import { uploadService } from '../services/upload';
import { jobService } from '../services/jobs';
import type { Job, UploadStatus } from '../types';

interface FileUploadState {
  file: File;
  taskId?: string;
  status: UploadStatus['status'] | 'uploading';
  progress: number;
}

export default function Upload() {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');

  useEffect(() => {
    jobService.list({ status: 'open' }).then((res) => setJobs(res.items)).catch(() => {});
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles
      .filter((f) => ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type))
      .map((file) => ({ file, status: 'pending' as const, progress: 0 }));

    if (newFiles.length < acceptedFiles.length) {
      setError('Beberapa file ditolak. Hanya PDF dan DOCX yang didukung.');
    }
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setUploading(true);
    setError('');
    try {
      const result = await uploadService.uploadResumes(
        pendingFiles.map((f) => f.file),
        selectedJobId || undefined,
        setUploadProgress
      );

      setFiles((prev) =>
        prev.map((f, i) => {
          const taskId = result.task_ids[i];
          return taskId ? { ...f, taskId, status: 'processing' as const } : f;
        })
      );
      setSuccess(`${pendingFiles.length} CV berhasil diupload dan sedang diproses.`);

      // Poll for processing status
      result.task_ids.forEach((taskId, index) => {
        pollStatus(taskId, index);
      });
    } catch {
      setError('Gagal mengupload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const pollStatus = async (taskId: string, fileIndex: number) => {
    const interval = setInterval(async () => {
      try {
        const status = await uploadService.getStatus(taskId);
        setFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex ? { ...f, status: status.status, progress: status.progress } : f
          )
        );
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 3000);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'processing': return <HourglassEmptyIcon color="warning" />;
      default: return <InsertDriveFileIcon color="action" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box>
      {error && <Alert severity="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" className="mb-4" onClose={() => setSuccess('')}>{success}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }} className="mb-4">
        <CardContent>
          <FormControl fullWidth className="mb-4">
            <InputLabel>Pilih Lowongan (Opsional)</InputLabel>
            <Select
              value={selectedJobId}
              label="Pilih Lowongan (Opsional)"
              onChange={(e) => setSelectedJobId(e.target.value as number)}
            >
              <MenuItem value="">Tanpa lowongan spesifik</MenuItem>
              {jobs.map((job) => (
                <MenuItem key={job.id} value={job.id}>
                  {job.title} - {job.department}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Drag & Drop Zone */}
          <Box
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 64, color: isDragActive ? 'primary.main' : 'action.disabled' }} />
            <Typography variant="h6" className="mt-3" color={isDragActive ? 'primary' : 'textSecondary'}>
              {isDragActive ? 'Lepaskan file di sini...' : 'Seret & lepas CV di sini'}
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              atau klik untuk memilih file (PDF, DOCX - max 10MB)
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Box className="flex justify-between items-center mb-3">
              <Typography variant="h6" fontWeight={600}>
                File ({files.length})
              </Typography>
              <Box className="flex gap-2">
                <Chip
                  label={`${files.filter((f) => f.status === 'completed').length} selesai`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
                {uploading && (
                  <Chip label="Mengupload..." color="primary" size="small" />
                )}
              </Box>
            </Box>

            {uploading && (
              <Box className="mb-3">
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" className="mt-1">
                  Upload: {uploadProgress}%
                </Typography>
              </Box>
            )}

            <List>
              {files.map((f, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    f.status === 'pending' && (
                      <Chip
                        label="Hapus"
                        size="small"
                        onClick={() => removeFile(index)}
                        onDelete={() => removeFile(index)}
                      />
                    )
                  }
                >
                  <ListItemIcon>{statusIcon(f.status)}</ListItemIcon>
                  <ListItemText
                    primary={f.file.name}
                    secondary={`${formatSize(f.file.size)} - ${
                      f.status === 'pending' ? 'Menunggu upload' :
                      f.status === 'uploading' ? 'Mengupload...' :
                      f.status === 'processing' ? 'Sedang diproses...' :
                      f.status === 'completed' ? 'Selesai' : 'Gagal'
                    }`}
                  />
                </ListItem>
              ))}
            </List>

            {files.some((f) => f.status === 'pending') && (
              <Box className="mt-3 text-right">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Mengupload...' : `Upload ${files.filter((f) => f.status === 'pending').length} File`}
                </button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
