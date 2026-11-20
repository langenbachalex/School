/* The Keys of the Tower – Zeiger für die Uhren der Welt (Block B1, 20.11.2026).
   Alle Uhren zeigen dieselbe Zeit aus dem Stand der Geschichte (stand.js). Die Zeiger springen nicht: Bei einem Schritt laufen sie sichtbar vor.
   bauZeiger(radius) liefert eine Gruppe, die flach vor ein Zifferblatt gehört (Blick aus +z; 12 Uhr = +y). */
import * as THREE from "three";

const TEMPO = 2.5;   // Spiel-Minuten je Sekunde, mit denen die Zeiger vorlaufen (15 Minuten in 6 s)

export function bauZeiger(radius, opt = {}) {
  const gruppe = new THREE.Group(); gruppe.name = "uhr_zeiger";
  const stoff = new THREE.MeshBasicMaterial({ color: opt.farbe ?? 0x141210 });
  if (opt.blatt) {                                        // eigenes Zifferblatt mit zwölf Strichen (deckt eine fest eingezeichnete Zeit zu)
    const blatt = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), new THREE.MeshBasicMaterial({ color: opt.blatt })); blatt.position.z = -0.012 * radius; gruppe.add(blatt);
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6, gross = k % 3 === 0, lang = radius * (gross ? 0.25 : 0.15);
      const strich = new THREE.Mesh(new THREE.PlaneGeometry(radius * (gross ? 0.065 : 0.04), lang), stoff);
      strich.position.set(Math.sin(a) * radius * 0.81, Math.cos(a) * radius * 0.81, -0.006 * radius); strich.rotation.z = -a; gruppe.add(strich);
    }
  }
  const zeiger = (lang, dick, vorn) => {
    const z = new THREE.Mesh(new THREE.PlaneGeometry(dick, lang), stoff); z.geometry.translate(0, lang / 2 - dick / 2, 0);
    const dreh = new THREE.Group(); dreh.position.z = vorn; dreh.add(z); gruppe.add(dreh); return dreh;
  };
  const stunde = zeiger(radius * 0.5, radius * 0.1, radius * 0.008), minute = zeiger(radius * 0.76, radius * 0.07, radius * 0.016);
  const nabe = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.07, 16), new THREE.MeshBasicMaterial({ color: opt.nabe ?? 0x8a6a2a })); nabe.position.z = radius * 0.024; gruppe.add(nabe);
  let zeigt = null, soll = 0;
  const drehe = () => { minute.rotation.z = -((zeigt % 60) / 60) * 2 * Math.PI; stunde.rotation.z = -((zeigt % 720) / 720) * 2 * Math.PI; };
  return {
    gruppe,
    stelle(minuten, sofort) {                             // Zeit vorgeben; beim ersten Mal, bei „sofort“ und rückwärts (Sprung beim Bauen) ohne Lauf
      soll = minuten; if (zeigt === null || sofort || minuten < zeigt) { zeigt = minuten; drehe(); }
    },
    bewege(dt) { if (zeigt !== null && zeigt < soll) { zeigt = Math.min(soll, zeigt + TEMPO * dt); drehe(); } },
    zeigt: () => zeigt, soll: () => soll, laeuft: () => zeigt !== null && zeigt < soll,
  };
}
