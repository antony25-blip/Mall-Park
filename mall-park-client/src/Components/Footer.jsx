
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
} from '@mui/material';

import { LuCircleParking } from 'react-icons/lu';
import {
  FaInstagram,
  FaFacebook,
  FaWhatsapp,
  FaGithub,
} from 'react-icons/fa';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#10243A',
        color: 'white',
        py: 6,
        mt: 0,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>

          {/* Brand */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LuCircleParking size={32} color="#2DD4BF" />

              <Typography variant="h5" fontWeight="bold">
                MallPark
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{ color: '#CBD5E1', mt: 2, maxWidth: 300 }}
            >
              Smart mall parking reservations for a smooth,
              convenient and stress-free shopping experience.
            </Typography>
          </Grid>

          {/* Quick Links */}
          <Grid className="ms-5 ps-5"  item xs={6} md={2}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Explore
            </Typography>

            <Link href="/" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              Home
            </Link>
            <br />

            <Link href="/parking" color="inherit" underline="hover" display="block">
              Find Parking
            </Link>
          </Grid>

          {/* Bookings */}
          <Grid item xs={6} md={3}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Bookings
            </Typography>

            <Link href="/my-bookings" color="inherit" underline="hover" display="block" sx={{ mb: 1 }}>
              My Bookings
            </Link>
            <br />

            <Link href="/alternatives" color="inherit" underline="hover" display="block">
              Alternative Parking
            </Link>
          </Grid>

          {/* Social Media */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Connect With Us
            </Typography>

            <Typography variant="body2" sx={{ color: '#CBD5E1', mb: 2 }}>
              Making every shopping trip easier.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FaInstagram size={24} />
              <FaFacebook size={24} />
              <FaWhatsapp size={24} />
              <FaGithub size={24} />
            </Box>
          </Grid>

        </Grid>

        <Divider sx={{ bgcolor: '#475569', my: 3 }} />

        <Typography
          variant="body2"
          align="center"
          sx={{ color: '#CBD5E1' }}
        >
          © {new Date().getFullYear()} MallPark. All rights reserved.
        </Typography>

      </Container>
    </Box>
  );
}

export default Footer;

