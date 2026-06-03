'use client';

import { useCallback, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

// Minimal typings for the Google APIs loaded at runtime
declare global {
  interface Window {
    gapi: {
      load: (api: string, cb: () => void) => void;
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (r: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
      picker: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        PickerBuilder: new () => any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        DocsView: new () => any;
        Action: { PICKED: string };
      };
    };
  }
}

interface PickerData {
  action: string;
  docs?: { id: string; name: string; mimeType: string }[];
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function GoogleDrivePicker({
  onFile,
  disabled = false,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const tokenRef = useRef('');

  const open = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? '';

    if (!clientId) {
      setError('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await Promise.all([
        loadScript('https://apis.google.com/js/api.js'),
        loadScript('https://accounts.google.com/gsi/client'),
      ]);

      await new Promise<void>((res) => window.gapi.load('picker', res));

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: async (response) => {
          if (!response.access_token || response.error) {
            setError('Google sign-in was cancelled or failed.');
            setIsLoading(false);
            return;
          }

          tokenRef.current = response.access_token;

          const pickerCallback = async (data: PickerData) => {
            if (data.action !== window.google.picker.Action.PICKED || !data.docs?.[0]) {
              setIsLoading(false);
              return;
            }

            const doc = data.docs[0];
            try {
              const res = await fetch(
                `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
                { headers: { Authorization: `Bearer ${tokenRef.current}` } }
              );
              if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
              const blob = await res.blob();
              onFile(new File([blob], doc.name, { type: doc.mimeType }));
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to download file.');
            } finally {
              setIsLoading(false);
            }
          };

          const picker = new window.google.picker.PickerBuilder()
            .addView(new window.google.picker.DocsView().setMimeTypes('application/pdf,text/plain'))
            .setOAuthToken(response.access_token)
            .setDeveloperKey(apiKey)
            .setCallback(pickerCallback)
            .build();

          picker.setVisible(true);
          setIsLoading(false);
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Drive unavailable.');
      setIsLoading(false);
    }
  }, [onFile]);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={open}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
        )}
        Import from Google Drive
      </button>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
