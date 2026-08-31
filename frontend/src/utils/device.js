// Genera/recupera un identificador anónimo de dispositivo para el cliente.
// No guarda datos sensibles; solo identifica la sesión para la wallet sin cuenta.
const KEY = 'miwallet_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Math.random().toString(36).slice(2);
    localStorage.setItem(KEY, id);
  }
  return id;
}
