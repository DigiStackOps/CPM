import React, { useState } from 'react';
import api from '../services/api';

export default function ForgotPassword(){
  const [email,setEmail]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [msg,setMsg]=useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try{
      const res = await api.post('/auth/forgot-password',{ email, newPassword });
      setMsg('Password updated');
    }catch(err){
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={{maxWidth:380, margin:'20px auto'}}>
      <h2>Forgot Password</h2>
      <form onSubmit={submit}>
        <input placeholder="Enter email address" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Create new password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
        <button type="submit">Change</button>
      </form>
      {msg && <div style={{marginTop:10}}>{msg}</div>}
    </div>
  );
}