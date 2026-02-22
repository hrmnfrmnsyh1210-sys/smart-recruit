import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Toolbar, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import Header from './Header';
import { useModal } from '../../contexts/ModalContext';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/candidates': 'Daftar Kandidat',
  '/jobs': 'Daftar Lowongan',
  '/upload': 'Upload CV',
  '/ranking': 'Ranking Kandidat',
  '/analytics': 'Analytics',
  '/settings': 'Pengaturan',
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isOpen, modalContent, modalTitle, closeModal } = useModal();

  const title = pageTitles[location.pathname] || 'SmartRecruit';

  return (
    <Box className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
        className="p-4 md:p-6"
      >
        <Toolbar />
        <Outlet />
      </Box>

      {/* Global Modal */}
      <Dialog
        open={isOpen}
        onClose={closeModal}
        maxWidth="md"
        fullWidth
        fullScreen={window.innerWidth < 768}
      >
        <DialogTitle className="flex items-center justify-between">
          {modalTitle}
          <IconButton onClick={closeModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>{modalContent}</DialogContent>
      </Dialog>
    </Box>
  );
}
