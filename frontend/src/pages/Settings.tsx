import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, Divider, Switch, FormControlLabel, Grid,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    skillWeight: 40,
    experienceWeight: 30,
    educationWeight: 20,
    certificationWeight: 10,
    autoProcess: true,
    emailNotifications: true,
    dataRetentionDays: 365,
  });

  const handleSave = () => {
    // TODO: Save settings to backend
    setSuccess('Pengaturan berhasil disimpan');
  };

  const totalWeight =
    settings.skillWeight + settings.experienceWeight +
    settings.educationWeight + settings.certificationWeight;

  return (
    <Box>
      {success && <Alert severity="success" className="mb-4" onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} className="mb-4">Profil</Typography>
              <Box className="space-y-3">
                <TextField label="Nama" fullWidth defaultValue={user?.full_name} />
                <TextField label="Email" fullWidth defaultValue={user?.email} disabled />
                <TextField label="Role" fullWidth defaultValue={user?.role} disabled />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Ranking Weights */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} className="mb-4">
                Bobot Ranking
              </Typography>
              {totalWeight !== 100 && (
                <Alert severity="warning" className="mb-3">
                  Total bobot harus 100% (saat ini {totalWeight}%)
                </Alert>
              )}
              <Box className="space-y-3">
                <TextField
                  label="Skills (%)"
                  type="number"
                  fullWidth
                  value={settings.skillWeight}
                  onChange={(e) => setSettings((p) => ({ ...p, skillWeight: Number(e.target.value) }))}
                />
                <TextField
                  label="Pengalaman (%)"
                  type="number"
                  fullWidth
                  value={settings.experienceWeight}
                  onChange={(e) => setSettings((p) => ({ ...p, experienceWeight: Number(e.target.value) }))}
                />
                <TextField
                  label="Pendidikan (%)"
                  type="number"
                  fullWidth
                  value={settings.educationWeight}
                  onChange={(e) => setSettings((p) => ({ ...p, educationWeight: Number(e.target.value) }))}
                />
                <TextField
                  label="Sertifikasi (%)"
                  type="number"
                  fullWidth
                  value={settings.certificationWeight}
                  onChange={(e) => setSettings((p) => ({ ...p, certificationWeight: Number(e.target.value) }))}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* General Settings */}
        <Grid size={{ xs: 12 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} className="mb-4">
                Pengaturan Umum
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoProcess}
                    onChange={(e) => setSettings((p) => ({ ...p, autoProcess: e.target.checked }))}
                  />
                }
                label="Proses CV otomatis setelah upload"
              />
              <Divider className="my-3" />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings((p) => ({ ...p, emailNotifications: e.target.checked }))}
                  />
                }
                label="Notifikasi email saat ranking selesai"
              />
              <Divider className="my-3" />
              <TextField
                label="Retensi Data (hari)"
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => setSettings((p) => ({ ...p, dataRetentionDays: Number(e.target.value) }))}
                helperText="Data kandidat akan dihapus otomatis setelah periode ini (GDPR compliance)"
                className="mt-2"
              />
              <Box className="mt-4 text-right">
                <Button variant="contained" onClick={handleSave}>
                  Simpan Pengaturan
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
