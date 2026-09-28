const DAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

export function banglaParts(iso: string) {
  const d = new Date(iso);
  const weekday = DAYS[d.getDay()];
  const date = d.toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const hh = d.getHours();
  const mm = d.getMinutes();
  const ss = d.getSeconds();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    weekday,
    date,
    hour: pad(hh),
    minute: pad(mm),
    second: pad(ss),
    clock: `${pad(hh)}:${pad(mm)}:${pad(ss)}`,
  };
}

export function currentWeekday() {
  return DAYS[new Date().getDay()];
}

export function digitsOnlyPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("880") && d.length >= 13) return d;
  if (d.startsWith("0") && d.length === 11) return `88${d}`;
  if (d.length === 10) return `880${d}`;
  return d;
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${digitsOnlyPhone(phone)}?text=${encodeURIComponent(text)}`;
}
