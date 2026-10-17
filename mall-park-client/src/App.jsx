
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Header from './Components/Header'
import Home from './Pages/Home'
import Footer  from './Components/Footer'
import Parking from './Pages/Parking';




function App() {
 

  return (
    <>
    <Header/>
    <Routes>
       <Route path="/" element={<Home />} />
       <Route path="/parking" element={<Parking />} />

    </Routes>
      

      <Footer/>
    </>
  )
}

export default App
