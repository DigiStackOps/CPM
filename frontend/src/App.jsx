import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
export default function App(){
  return (
    <BrowserRouter>
      <nav style={{padding:10}}>
        <Link to='/'>Login</Link>{" | "}
        <Link to='/signup'>Signup</Link>{" | "}
        <Link to='/forgot'>Forgot</Link>
      </nav>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/signup' element={<Signup/>}/>
        <Route path='/forgot' element={<ForgotPassword/>}/>
      </Routes>
    </BrowserRouter>
  );
}
