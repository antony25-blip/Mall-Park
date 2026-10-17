
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { LuCircleParking } from "react-icons/lu";
import { Link } from 'react-router-dom';

function Header() {
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

          <Button color="inherit" component={Link} to="/parking">
            Find Parking
          </Button>

          <Button color="inherit" component={Link} to="/my-bookings">
            My Bookings
          </Button>

          <Button color="inherit" component={Link} to="/alternatives">
            Alternatives
          </Button>
        </Box>

      </Toolbar>
    </AppBar>
  );
}

export default Header;
