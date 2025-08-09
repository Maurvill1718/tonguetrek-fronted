const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4545/api';

export type ApiResponse<T> = {
  data?: T;
  error?: string | string[];
  status: number;
};

function buildHeaders(token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, options: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const status = res.status;
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json() : undefined;
    if (!res.ok) {
      return { status, error: (body?.error ?? body?.errores) ?? 'Error desconocido' };
    }
    return { status, data: body as T };
  } catch (e) {
    return { status: 0, error: 'No se pudo conectar con el servidor' };
  }
}

export const api = {
  // Auth
  login: (correo: string, contrasena: string) =>
    request<{ mensaje: string; usuario: any; token: string }>(
      '/login',
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify({ t1: correo, t2: contrasena }) }
    ),

  register: (t1: string, t2: string, t3: string, t4: string, t5: string) =>
    request<{ mensaje: string; id: number }>(
      '/cliente',
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify({ t1, t2, t3, t4, t5 }) }
    ),

  // Profile
  getProfile: (token: string) =>
    request<{ mensaje?: string }>(
      '/perfil',
      { method: 'GET', headers: buildHeaders(token) }
    ),

  getProfileState: (token: string) =>
    request<{ perfilCompleto: boolean }>(
      '/perfil/estado',
      { method: 'GET', headers: buildHeaders(token) }
    ),

  updateProfile: (token: string, nombre: string, telefono: string) =>
    request<{ mensaje: string }>(
      '/perfil',
      { method: 'PUT', headers: buildHeaders(token), body: JSON.stringify({ t2: nombre, t4: telefono }) }
    ),

  completeProfile: (
    token: string,
    body: {
      direccion: string;
      fechaexpedicion: string;
      pregunta1: string; respuesta1: string;
      pregunta2: string; respuesta2: string;
      pregunta3: string; respuesta3: string;
    }
  ) => request<{ mensaje: string }>(
    '/perfil',
    { method: 'POST', headers: buildHeaders(token), body: JSON.stringify(body) }
  ),

  deleteAccount: (
    token: string,
    body?: { contrasena?: string; viaPreguntas?: boolean; sessionToken?: string; respuesta?: string; fechaexpedicion?: string }
  ) => request<{ mensaje: string }>(
      '/perfil',
      { method: 'DELETE', headers: buildHeaders(token), body: body ? JSON.stringify(body) : undefined }
    ),

  // Logout
  logout: (token: string) =>
    request<{ mensaje: string }>(
      '/cerrar-sesion',
      { method: 'POST', headers: buildHeaders(token) }
    ),

  // Recovery
  recoveryStart: (documento: string) =>
    request<{ mensaje: string; pregunta: string; sessionToken: string }>(
      '/recuperar/iniciar',
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify({ documento }) }
    ),

  recoveryValidate: (sessionToken: string, respuesta: string, fechaexpedicion: string) =>
    request<
      | { mensaje: string; resetToken: string }
      | { error: string; pregunta?: string; sessionToken?: string }
    >(
      '/recuperar/validar-pregunta',
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify({ sessionToken, respuesta, fechaexpedicion }) }
    ),

  resetPassword: (resetToken: string, nuevaContrasena: string) =>
    request<{ mensaje: string }>(
      '/recuperar/restablecer',
      { method: 'POST', headers: buildHeaders(), body: JSON.stringify({ resetToken, nuevaContrasena }) }
    ),
};


