import React, {useState} from 'react';
import axios from 'axios';
export default function Signup(){
  const [form,setForm]=useState({name:'',mobile:'',gender:'male',marriage_status:'unmarried',email:'',password:'',rePassword:''});
  const [msg,setMsg]=useState(null);
  const onChange=e=>setForm({...form,[e.target.name]:e.target.value});
  const submit=async e=>{ e.preventDefault(); setMsg(null);
    if(form.password!==form.rePassword){ setMsg('Passwords do not match'); return; }
    try{ const res = await axios.post('/api/auth/signup', form); setMsg('Signup success'); console.log(res.data); }
    catch(err){ setMsg(err?.response?.data?.message || 'Network error'); }
  };
  return (
    <div className="page-center">
      <form onSubmit={submit} className="card">
        <h2>Signup</h2>
        {msg && <div className="error">{msg}</div>}
        <input name="name" placeholder="Name" value={form.name} onChange={onChange}/>
        <input name="mobile" placeholder="Mobile" value={form.mobile} onChange={onChange}/>
        <select name="gender" value={form.gender} onChange={onChange}><option value="male">Male</option><option value="female">Female</option></select>
        <select name="marriage_status" value={form.marriage_status} onChange={onChange}><option value="married">Married</option><option value="unmarried">Unmarried</option></select>
        <input name="email" placeholder="Email" value={form.email} onChange={onChange}/>
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={onChange}/>
        <input name="rePassword" placeholder="Re-enter Password" type="password" value={form.rePassword} onChange={onChange}/>
        <button type="submit">Signup</button>
      </form>
    </div>
  );
}
