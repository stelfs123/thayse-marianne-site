import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton, Menu, MenuItem, Drawer, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import EventIcon from '@mui/icons-material/Event';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const Header = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Thayse Marianne
      </Typography>
      <Divider />
      <List>
        <ListItem button component={RouterLink} to="/">
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Início" />
        </ListItem>
        <ListItem button component={RouterLink} to="/services">
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary="Serviços" />
        </ListItem>
        <ListItem button component={RouterLink} to="/plans">
          <ListItemIcon>
            <EventIcon />
          </ListItemIcon>
          <ListItemText primary="Planos" />
        </ListItem>
        {!currentUser ? (
          <>
            <ListItem button component={RouterLink} to="/login">
              <ListItemIcon>
                <LoginIcon />
              </ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem button component={RouterLink} to="/register">
              <ListItemText primary="Cadastre-se" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button component={RouterLink} to={isAdmin ? "/admin/dashboard" : "/client/dashboard"}>
              <ListItemText primary="Minha Área" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemText primary="Sair" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" color="primary">
        <Container maxWidth="lg">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold'
              }}
            >
              Thayse Marianne
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Button color="inherit" component={RouterLink} to="/">
                Início
              </Button>
              <Button color="inherit" component={RouterLink} to="/services">
                Serviços
              </Button>
              <Button color="inherit" component={RouterLink} to="/plans">
                Planos
              </Button>
              {!currentUser ? (
                <>
                  <Button color="inherit" component={RouterLink} to="/login">
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    component={RouterLink}
                    to="/register"
                    sx={{ ml: 1 }}
                  >
                    Cadastre-se
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="inherit"
                    onClick={handleMenu}
                  >
                    {currentUser.full_name || 'Minha Conta'}
                  </Button>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem 
                      onClick={() => {
                        handleClose();
                        navigate(isAdmin ? '/admin/dashboard' : '/client/dashboard');
                      }}
                    >
                      Minha Área
                    </MenuItem>
                    <MenuItem 
                      onClick={() => {
                        handleClose();
                        navigate(isAdmin ? '/admin/profile' : '/client/profile');
                      }}
                    >
                      Perfil
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Sair</MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
