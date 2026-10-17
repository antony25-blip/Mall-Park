
import {Box,Container,Typography,Card,CardContent,Button,Chip} from '@mui/material';
import { LuCircleParking, LuArrowRight } from 'react-icons/lu';
import { Link } from 'react-router-dom';

const parkingAreas = [
  {
    id: 1,
    name: 'Basement Parking',
    totalSlots: 100,
    availableSlots: 45,
    price: 30,
  },
  {
    id: 2,
    name: 'Ground Floor Parking',
    totalSlots: 80,
    availableSlots: 30,
    price: 40,
  },
  {
    id: 3,
    name: 'Premium Parking',
    totalSlots: 40,
    availableSlots: 12,
    price: 60,
  },
];

function ParkingAreas() {
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight="bold" textAlign="center">
        Available Parking Areas
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        textAlign="center"
        sx={{ mt: 1, mb: 4 }}
      >
        Choose a parking area that suits your needs.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        {parkingAreas.map((area) => (
          <Card key={area.id} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <LuCircleParking size={40} color="#0D9488" />

              <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>
                {area.name}
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Total slots: {area.totalSlots}
              </Typography>

              <Chip
                label={`${area.availableSlots} slots available`}
                color={area.availableSlots > 0 ? 'success' : 'error'}
                sx={{ mt: 2 }}
              />

              <Typography variant="h6" sx={{ mt: 2 }}>
                ₹{area.price} / hour
              </Typography>

              <Button
                component={Link}
                to="/book"
                variant="contained"
                fullWidth
                endIcon={<LuArrowRight />}
                sx={{ mt: 3 }}
              >
                Select Parking
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}

export default ParkingAreas;
