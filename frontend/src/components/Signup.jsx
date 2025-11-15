import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Signup(){
  const [form,setForm]=useState({full_name:'',mobile:'',city:'',gender:'Female',email:'',password:'',passwordAgain:''});
  const [msg,setMsg]=useState(null);
  const nav = useNavigate();

  const onChange = (k,v) => setForm(s=>({...s,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (form.password !== form.passwordAgain) return setMsg('Passwords do not match');
    try{
      const res = await api.post('/auth/signup',{
        email: form.email, password: form.password, full_name: form.full_name, mobile: form.mobile, city: form.city, gender: form.gender
      });
      setMsg('Signup success');
      nav('/');
    }catch(err){
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div style={{maxWidth:420, margin:'20px auto', padding:20}}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full Name" value={form.full_name} onChange={e=>onChange('full_name', e.target.value)} />
        <input placeholder="Mobile" value={form.mobile} onChange={e=>onChange('mobile', e.target.value)} />
        <input placeholder="City" value={form.city} onChange={e=>onChange('city', e.target.value)} />
        <div>
          <label><input type="radio" name="gender" checked={form.gender==='Female'} onChange={()=>onChange('gender','Female')} /> Female</label>
          <label style={{marginLeft:10}}><input type="radio" name="gender" checked={form.gender==='Male'} onChange={()=>onChange('gender','Male')} /> Male</label>
        </div>
        <input placeholder="Email" value={form.email} onChange={e=>onChange('email', e.target.value)} />
        <input type="password" placeholder="Password" value={form.password} onChange={e=>onChange('password', e.target.value)} />
        <input type="password" placeholder="Password Again" value={form.passwordAgain} onChange={e=>onChange('passwordAgain', e.target.value)} />
        <label><input type="checkbox" required/> I agree</label>
        <button type="submit">Submit</button>
      </form>
      {msg && <div style={{marginTop:10}}>{msg}</div>}
    </div>
  );
}