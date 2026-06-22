import { useEffect } from 'react';
import { Medication, MedicationSchedule } from '@/api/entities';
import { dateKey, formatTime } from '@/lib/schedule';

const LEAD_MIN = 15; // fire this many minutes before a dose
const NOTIFIED_KEY = 'safemeds_notified';

function getNotified() {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY)) || []);
  } catch {
    return new Set();
  }
}
function saveNotified(set) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

/** Headless: polls today's doses and fires a browser notification near each due time. */
export default function NotificationManager() {
  useEffect(() => {
    if (typeof Notification === 'undefined') return undefined;
    let active = true;

    const tick = async () => {
      if (!active || Notification.permission !== 'granted') return;
      const today = dateKey();
      const [meds, doses] = await Promise.all([
        Medication.list(),
        MedicationSchedule.filter({ date: today })
      ]);
      const medMap = Object.fromEntries(meds.map((m) => [m.id, m]));
      const now = new Date();
      const notified = getNotified();

      for (const d of doses) {
        if (d.taken || d.skipped || notified.has(d.id)) continue;
        const [h, m] = d.scheduled_time.split(':').map(Number);
        const when = new Date();
        when.setHours(h, m, 0, 0);
        const diffMin = (when - now) / 60000;
        if (diffMin <= LEAD_MIN && diffMin >= -60) {
          const med = medMap[d.medication_id];
          // eslint-disable-next-line no-new
          new Notification('Time for your dose', {
            body: `${med?.name || 'Medication'} · ${formatTime(d.scheduled_time)}`,
            icon: '/favicon.svg'
          });
          notified.add(d.id);
        }
      }
      saveNotified(notified);
    };

    tick();
    const id = setInterval(tick, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return null;
}
