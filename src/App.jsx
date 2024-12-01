import React from 'react'
import Camera from './Components/Camera';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './Components/Header';
import Footer from './Components/Footer';
import Checkout from './Components/Checkout';
import { Routes, Route } from 'react-router-dom';

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Header />

      <Routes>
        <Route path='/' element={ <Camera />}/>
        <Route path='/check-out' element={<Checkout />}/>
      </Routes>
      <Footer />
    </div>
  )
}

export default App
