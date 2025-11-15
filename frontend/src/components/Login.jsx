import React, { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg(null);
    try{
      const res = await api.post('/auth/login',{email,password});
      setMsg('Login successful');
      // TODO: store session / JWT when implemented
    }catch(err){
      if (err.response) setMsg(err.response.data.message || 'Error');
      else setMsg('Network error');
    }
  };

  return (
    <div style={{maxWidth:380, margin:'40px auto', padding:20}}>
      <motion.h1 initial={{y:-40, opacity:0}} animate={{y:0, opacity:1}} transition={{duration:0.5}}>Hello again!</motion.h1>
      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" />
        <button type="submit">Login</button>
      </form>
      <div style={{marginTop:10}}>
        <Link to="/forgot">Forgot your password?</Link>
      </div>
      <div style={{marginTop:10}}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </div>
      {msg && <div style={{marginTop:10}}>{msg}</div>}
    </div>
  );
}