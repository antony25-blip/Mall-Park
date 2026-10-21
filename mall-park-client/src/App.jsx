
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Header from './Components/Header'
import Home from './Pages/Home'
import Footer  from './Components/Footer'
import Parking from './Pages/Parking';
import Booking from './Pages/Booking';
import MyBookings from './Pages/MyBookings';
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";



function App() {
 

  return (
    <>
    <Header/>
    <Routes>
       <Route path="/" element={<Home />} />
       <Route path="/parking" element={<Parking />} />
      <Route path="/book" element={<Booking />} />
      <Route path="/my-bookings" element={<MyBookings />} />

      
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} theme="colored"/>

      <Footer/>
    </>
  )
}

export default App
