import { useRef, useState } from 'react';
import { api } from '../services/api.js';

// Selector + subida de logo. Llama a onUploaded(url) cuando termina.
export default function LogoUploader({ onUploaded, initial }) {
  const inputRef = useRef(null);
  const [url, setUrl] = useState(initial || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url: newUrl } = await api.uploadFile('/api/upload/logo', file);
      setUrl(newUrl);
      onUploaded(newUrl);
    } catch (err2) {
      setError(err2.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 border flex items-center justify-center">
        {url ? (
          <img src={url} alt="logo" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-xs">Logo</span>
        )}
      </div>
      <div className="flex-1">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : url ? 'Cambiar logo' : 'Subir logo'}
        </button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  );
}
