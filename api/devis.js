/* Demande de devis : reçoit le formulaire du site et l'envoie dans la boîte e-mail de
 * l'entreprise. Rien n'est enregistré : le message part par le SMTP de la boîte elle-même.
 *
 * Réglages (variables d'environnement Vercel) :
 *   SMTP_PASS   mot de passe de la boîte — le seul réglage obligatoire (secret)
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, DEVIS_TO   facultatifs, valeurs par défaut ci-dessous
 */
import nodemailer from 'nodemailer';
import { courriel } from './_courriel.js';

const BOITE = 'contact@kiswendsida-freres.com';

// nom du champ, longueur maximale, obligatoire
const CHAMPS = [
  ['nom', 120, true],
  ['societe', 160, false],
  ['email', 160, false],
  ['tel', 40, true],
  ['zone', 200, true],
  ['matiere', 80, true],
  ['tonnage', 80, false],
  ['bsd', 5, false],
  ['message', 4000, false],
  ['source', 40, false],          // provenance (FB-P05, META-ANNONCE-A…), posée par site.js
];

// frein simple par adresse IP (par instance) : 5 envois par tranche de 10 minutes
const FENETRE = 10 * 60 * 1000, MAX = 5, envois = new Map();
function tropDEnvois(ip) {
  const t = Date.now();
  if (envois.size > 2000) envois.clear();
  const recents = (envois.get(ip) || []).filter((x) => t - x < FENETRE);
  recents.push(t);
  envois.set(ip, recents);
  return recents.length > MAX;
}

const uneLigne = (s) => s.replace(/[\x00-\x1f\x7f\s]+/g, ' ').trim();   // \s couvre aussi les fins de ligne Unicode
const texte = (s) => s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim();

function memeOrigine(req) {
  try {
    const hote = req.headers['x-forwarded-host'] || req.headers.host;
    return new URL(req.headers.origin).host === hote;
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const rep = (code, erreur) => res.status(code).json(erreur ? { ok: false, erreur } : { ok: true });

  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return rep(405, 'methode'); }
  if (!memeOrigine(req)) return rep(403, 'origine');
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) return rep(415, 'format');

  let corps;
  try { corps = req.body; } catch { return rep(400, 'json'); }
  if (!corps || typeof corps !== 'object' || Array.isArray(corps)) return rep(400, 'json');

  // champ piège, invisible à l'écran : un humain ne le remplit jamais
  if (corps.site_web) return rep(200);

  const v = {};
  for (const [cle, max, requis] of CHAMPS) {
    const brut = typeof corps[cle] === 'string' ? corps[cle].slice(0, max).toWellFormed() : '';
    v[cle] = cle === 'message' ? texte(brut) : uneLigne(brut);
    if (requis && !v[cle]) return rep(422, 'champ_' + cle);
  }
  v.source = v.source.replace(/[^A-Za-z0-9_-]/g, '');
  if (v.email && !/^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(v.email)) return rep(422, 'champ_email');

  if (!process.env.SMTP_PASS) return rep(503, 'non_configure');

  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '?').split(',')[0].trim();
  if (tropDEnvois(ip)) return rep(429, 'trop_d_envois');

  const port = Number(process.env.SMTP_PORT || 465);
  const compte = process.env.SMTP_USER || BOITE;

  try {
    await nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.kiswendsida-freres.com',
      port, secure: port === 465, requireTLS: port !== 465,
      auth: { user: compte, pass: process.env.SMTP_PASS },
      connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000,
    }).sendMail({
      from: { name: 'Site Kiswendsida & Frères', address: compte },
      to: process.env.DEVIS_TO || BOITE,
      ...(v.email ? { replyTo: { name: v.nom, address: v.email } } : {}),   // « Répondre » écrit au demandeur
      subject: `Demande de devis — ${v.societe || v.nom} — ${v.matiere} (${v.zone})`.slice(0, 180).toWellFormed(),
      ...courriel(v),
    });
    return rep(200);
  } catch (e) {
    // jamais de données du demandeur dans les journaux
    console.error('devis: envoi impossible', e && e.code, e && e.responseCode);
    return rep(502, 'envoi');
  }
}
