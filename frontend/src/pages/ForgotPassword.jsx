import React, {useState} from 'react';
import axios from 'axios';
export default function ForgotPassword(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [re,setRe]=useState(''); const [msg,setMsg]=useState(null);
  const submit=async e=>{ e.preventDefault(); setMsg(null);
    if(password!==re){ setMsg('Passwords do not match'); return; }
    try{ const res = await axios.post('/api/auth/forgot-password',{email,password}); setMsg('Password updated'); }
    catch(err){ setMsg(err?.response?.data?.message || 'Network error'); }
  };
  return (
    <div className="page-center">
      <form onSubmit={submit} className="card">
        <h2>Forgot / Reset Password</h2>
        {msg && <div className="error">{msg}</div>}
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input placeholder="New Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
        <input placeholder="Re-enter New Password" type="password" value={re} onChange={e=>setRe(e.target.value)}/>
        <button type="submit">Update Password</button>
      </form>
    </div>
  );
}
