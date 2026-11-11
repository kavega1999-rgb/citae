import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getPushPublicKey, removePushSubscription, savePushSubscription } from './push.functions';

function keyBytes(base64: string) {
  const s = atob((base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
}

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(savePushSubscription), remove = useServerFn(removePushSubscription), publicKey = useServerFn(getPushPublicKey);
  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.self === window.top;
    setSupported(ok);
    if (ok) navigator.serviceWorker.getRegistration('/push-sw.js').then(r => r?.pushManager.getSubscription()).then(s => setActive(!!s)).catch(() => {});
  }, []);
  if (!supported) return null;
  const toggle = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.register('/push-sw.js');
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (active && existing) { await remove({ data: { endpoint: existing.endpoint } }); await existing.unsubscribe(); setActive(false); toast.success('Avisos desactivados en este dispositivo.'); return; }
      if (await Notification.requestPermission() !== 'granted') { toast.error('Debes permitir las notificaciones en tu navegador.'); return; }
      const sub = existing ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(await publicKey()) });
      const json = sub.toJSON();
      await save({ data: { endpoint: sub.endpoint, keys: { p256dh: json.keys?.['p256dh'] ?? '', auth: json.keys?.['auth'] ?? '' } } });
      setActive(true); toast.success('Te avisaremos aquí cada vez que reserven.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'No pudimos activar los avisos.'); }
    finally { setBusy(false); }
  };
  return <Button variant="ghost" onClick={toggle} disabled={busy} title={active ? 'Desactivar avisos de reservas' : 'Activar avisos de reservas'}>{active ? <BellOff/> : <Bell/>}<span className="hidden sm:inline">{active ? 'Avisos activos' : 'Activar avisos'}</span></Button>;
}
