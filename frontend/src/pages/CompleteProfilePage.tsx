import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function CompleteProfilePage() {
  const { token } = useAuth();
  const [body, setBody] = useState({
    direccion: '',
    fechaexpedicion: '',
    pregunta1: '', respuesta1: '',
    pregunta2: '', respuesta2: '',
    pregunta3: '', respuesta3: '',
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!token) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    const res = await api.completeProfile(token, body);
    if (res.error) setErr(typeof res.error === 'string' ? res.error : 'Error');
    else setMsg(res.data?.mensaje ?? 'Guardado');
  };

  const set = (k: keyof typeof body) => (v: string) => setBody(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      <h2>Completar perfil</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Dirección" value={body.direccion} onChange={e=>set('direccion')(e.target.value)} required />
        <input placeholder="Fecha expedición (YYYY-MM-DD)" value={body.fechaexpedicion} onChange={e=>set('fechaexpedicion')(e.target.value)} required />

        <input placeholder="Pregunta 1" value={body.pregunta1} onChange={e=>set('pregunta1')(e.target.value)} required />
        <input placeholder="Respuesta 1" value={body.respuesta1} onChange={e=>set('respuesta1')(e.target.value)} required />
        <input placeholder="Pregunta 2" value={body.pregunta2} onChange={e=>set('pregunta2')(e.target.value)} required />
        <input placeholder="Respuesta 2" value={body.respuesta2} onChange={e=>set('respuesta2')(e.target.value)} required />
        <input placeholder="Pregunta 3" value={body.pregunta3} onChange={e=>set('pregunta3')(e.target.value)} required />
        <input placeholder="Respuesta 3" value={body.respuesta3} onChange={e=>set('respuesta3')(e.target.value)} required />

        <button>Guardar</button>
      </form>
      {msg && <p style={{color:'green'}}>{msg}</p>}
      {err && <p style={{color:'red'}}>{err}</p>}
    </div>
  );
}


