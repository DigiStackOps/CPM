import React, {useState} from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [msg,setMsg]=useState(null);
  const submit=async e=>{ e.preventDefault(); setMsg(null);
    try{ const res = await axios.post('/api/auth/login',{email,password}); setMsg('Login success'); console.log(res.data); }
    catch(err){ setMsg(err?.response?.data?.message || 'Network error'); }
  };
  return (
    <div className="page-center">
      <motion.form initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{duration:0.4}} onSubmit={submit} className="card">
        <h2>Admin Login</h2>
        {msg && <div className="error">{msg}</div>}
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </motion.form>
    </div>
  );
}
