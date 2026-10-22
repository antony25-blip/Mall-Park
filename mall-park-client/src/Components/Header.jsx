
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { LuCircleParking } from "react-icons/lu";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function Header() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch {
      toast.error('Unable to sign out. Please try again.');
    }
  };

  return (
    <AppBar position="static" sx={{ bgcolor: '#10243A' }}>
      <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>

        {/* MallPark logo */}
       <LuCircleParking size={28} className="me-2" />

        <Typography
          variant="h5"
          sx={{ fontWeight: 'bold', flexGrow: 1 }}
        >
          MallPark
        </Typography>

        {/* Navigation links */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>

          {user?.role !== 'admin' && (
            <Button color="inherit" component={Link} to="/parking">
              Find Parking
            </Button>
          )}

          {user && user.role !== 'admin' && (
            <Button color="inherit" component={Link} to="/my-bookings">
              My Bookings
            </Button>
          )}

          {user?.role === 'admin' && (
            <>
              <Button color="inherit" component={Link} to="/admin">
                Booking Management
              </Button>
              <Button color="inherit" component={Link} to="/admin/availability">
                Slot Availability
              </Button>
            </>
          )}
          {!user && !loading ? (
            <>
              <Button color="inherit" component={Link} to="/login">
                Sign In
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </>
          ) : user ? (
            <Button color="inherit" onClick={handleLogout}>
              Sign Out
            </Button>
          ) : null}
        </Box>

      </Toolbar>
    </AppBar>
  );
}

export default Header;
