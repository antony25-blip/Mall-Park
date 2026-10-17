import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { LuCircleParking } from 'react-icons/lu';
import Footer from '../Components/Footer';


function Home() {
  return (
    <Box className="home-hero" sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <LuCircleParking size={55} />

      <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 2 }}>
        Welcome to MallPark
      </Typography>

      <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
        Smart Mall Parking Reservation and Management System
      </Typography>

      <Typography sx={{ mt: 2, mb: 3 }}>
        Find available parking, reserve your slot before arriving,
        and enjoy a hassle-free shopping experience.
      </Typography>

      <Button
        variant="contained"
        component={Link}
        to="/parking"
        sx={{ mt: 2 }}
      >
        Find Parking
      </Button>
    </Box>
    
  );
  <Footer/>
}

export default Home;

