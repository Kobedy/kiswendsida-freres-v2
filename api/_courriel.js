/* Mise en page de l'e-mail « demande de devis », aux couleurs du site.
 * Tableaux et styles en ligne : seule façon fiable d'être lu partout (Roundcube, Outlook, Gmail, téléphone).
 * Le logo est joint au message (cid) : aucune image distante, donc rien à débloquer.
 */
import { LOGO } from './_logo.js';

const C = { nuit: '#1B2C3E', cuivre: '#DB7624', cuivreBtn: '#B8652C', cuivreTxt: '#9E5522', encre: '#141E2E',
  gris: '#5B677B', trait: '#DDE2EA', fond: '#F0F2F6', carte: '#F7F8FB', vert: '#0F7A3D' };
const TITRE = "Montserrat,'Segoe UI',Helvetica,Arial,sans-serif";
const CORPS = "Inter,'Segoe UI',Helvetica,Arial,sans-serif";

const echap = (s) => String(s).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';');

// 06… / 00212… / +212… → numéro international ; null si la saisie n'est pas un numéro exploitable
export function numero(tel) {
  let n = tel.replace(/[^\d+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  else if (n.startsWith('00')) n = n.slice(2);
  else if (/^0[5-8]\d{8}$/.test(n)) n = '212' + n.slice(1);
  else return null;
  return /^[1-9]\d{7,14}$/.test(n) ? n : null;
}

function bouton(href, libelle, fond, texte = '#FFFFFF', bord = fond) {
  return `<td class="btn" style="padding:0 8px 8px 0"><a href="${echap(href)}" target="_blank" style="display:block;background:${fond};`
    + `border:1px solid ${bord};border-radius:8px;color:${texte};font:600 14px/20px ${CORPS};padding:11px 18px;text-align:center;`
    + `text-decoration:none;white-space:nowrap">${libelle}</a></td>`;
}

function reperes(v) {
  return [['Matière', v.matiere], ['Tonnage estimé', v.tonnage || 'À préciser'], ['Ville / Zone', v.zone]].map(([l, t], i) =>
    `<td class="col" width="33%" valign="top" style="padding:0 ${i < 2 ? 10 : 0}px 10px 0">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate"><tr>`
    + `<td style="background:${C.carte};border:1px solid ${C.trait};border-top:3px solid ${C.cuivre};border-radius:8px;padding:14px 16px">`
    + `<div style="font:600 11px/16px ${CORPS};letter-spacing:.06em;text-transform:uppercase;color:${C.gris}">${l}</div>`
    + `<div style="font:700 16px/22px ${TITRE};color:${C.encre};padding-top:4px;word-break:break-word">${echap(t)}</div>`
    + `</td></tr></table></td>`).join('');
}

function ligne(libelle, html, derniere) {
  const b = derniere ? '' : `border-bottom:1px solid ${C.trait};`;
  return `<tr><td class="lib" width="150" valign="top" style="${b}padding:11px 12px 11px 0;font:14px/20px ${CORPS};color:${C.gris}">${libelle}</td>`
    + `<td class="val" valign="top" style="${b}padding:11px 0;font:600 15px/20px ${CORPS};color:${C.encre};word-break:break-word">${html}</td></tr>`;
}

const titre = (t) => `<h2 style="margin:0 0 8px;font:700 16px/22px ${TITRE};color:${C.nuit}">${t}</h2>`;

export function courriel(v, date = new Date()) {
  const recu = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Casablanca' }).format(date);
  const n = numero(v.tel);
  const lien = (href, t) => `<a href="${echap(href)}" style="color:${C.cuivreTxt};text-decoration:underline">${echap(t)}</a>`;
  const reponse = `mailto:${encodeURIComponent(v.email).replace('%40', '@')}?subject=${encodeURIComponent('Votre demande de devis — Kiswendsida & Frères')}`;
  const salut = `Bonjour *${v.nom.replace(/[*~`]/g, '').trim()}*,\n\nNous avons bien reçu votre demande de devis :\n`
    + `• Matière : *${v.matiere}*\n` + (v.tonnage ? `• Tonnage estimé : *${v.tonnage}*\n` : '') + `• Ville / Zone : *${v.zone}*\n\n— *Kiswendsida & Frères*`;
  const boutons = (v.email ? bouton(reponse, 'Répondre par e-mail', C.cuivreBtn) : '')
    + (n ? bouton('tel:+' + n, 'Appeler', '#FFFFFF', C.nuit, C.nuit)
      + bouton(`https://wa.me/${n}?text=${encodeURIComponent(salut)}`, 'WhatsApp', C.vert) : '');
  const resume = [v.nom + ' — ' + v.matiere, v.tonnage, v.zone].filter(Boolean).join(', ');
  const qui = v.societe || v.nom;

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Nouvelle demande de devis</title>
<style>@media (max-width:600px){.pad{padding-left:20px!important;padding-right:20px!important}.col,.btn{display:block!important;width:100%!important;padding-right:0!important;box-sizing:border-box}.btns,.btns tbody,.btns tr{display:block!important;width:100%!important}.lib{width:104px!important}.h1{font-size:22px!important;line-height:28px!important}.date{display:none!important}}</style></head>
<body style="margin:0;padding:0;background:${C.fond}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.fond}">${echap(resume)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.fond}" style="background:${C.fond}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid ${C.trait}">
<tr><td class="pad" bgcolor="${C.nuit}" style="background:${C.nuit};padding:22px 32px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="${LOGO.largeur}"><img src="cid:logo-kf" width="${LOGO.largeur}" height="${LOGO.hauteur}" alt="Kiswendsida &amp; Frères" style="display:block;border:0;color:#FFFFFF;font:700 15px ${TITRE}"></td>
<td class="date" align="right" valign="middle" style="font:13px/18px ${CORPS};color:#C9D3DC">Reçue le<br><span style="color:#FFFFFF;font-weight:600">${echap(recu)}</span></td>
</tr></table></td></tr>
<tr><td height="4" bgcolor="${C.cuivre}" style="height:4px;line-height:4px;font-size:0;background:${C.cuivre};background:linear-gradient(90deg,${C.cuivre},#EBA23E)">&nbsp;</td></tr>
<tr><td class="pad" style="padding:30px 32px 6px">
<div style="font:700 12px/16px ${CORPS};letter-spacing:.08em;text-transform:uppercase;color:${C.cuivreTxt}">Nouvelle demande de devis</div>
<h1 class="h1" style="margin:8px 0 4px;font:800 26px/32px ${TITRE};color:${C.encre};word-break:break-word">${echap(qui)}</h1>
<div style="font:15px/22px ${CORPS};color:${C.gris}">Envoyée par <strong style="color:${C.encre}">${echap(v.nom)}</strong> depuis le site</div>
</td></tr>
<tr><td class="pad" style="padding:18px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${reperes(v)}</tr></table></td></tr>
${v.message ? `<tr><td class="pad" style="padding:16px 32px 0">${titre('La demande')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${C.carte};border-left:4px solid ${C.cuivre};border-radius:0 8px 8px 0;padding:16px 18px;font:15px/24px ${CORPS};color:${C.encre};word-break:break-word">${echap(v.message).replace(/\n/g, '<br>')}</td></tr></table></td></tr>` : ''}
<tr><td class="pad" style="padding:24px 32px 0">${titre('Le demandeur')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${
  ligne('Nom', echap(v.nom)) + (v.societe ? ligne('Société', echap(v.societe)) : '') + (v.email ? ligne('E-mail', lien(reponse, v.email)) : '')
  + ligne('Téléphone', n ? lien('tel:+' + n, v.tel) : echap(v.tel))
  + (v.source ? ligne('Provenance', echap(v.source)) : '')
  + ligne('Bordereau (BSD)', v.bsd === 'oui' ? `<span style="display:inline-block;background:#FBEADB;color:${C.cuivreTxt};border-radius:999px;padding:2px 12px">Demandé</span>` : 'Non demandé', true)
}</table></td></tr>
<tr><td class="pad" style="padding:22px 32px 22px"><table role="presentation" cellpadding="0" cellspacing="0" class="btns"><tr>${boutons}</tr></table></td></tr>
<tr><td class="pad" bgcolor="${C.nuit}" style="background:${C.nuit};padding:20px 32px;font:13px/20px ${CORPS};color:#C9D3DC">
<strong style="color:#FFFFFF">Kiswendsida &amp; Frères</strong> — 265, Boulevard Zerktouni, Anfa, Casablanca<br>
Message envoyé par le formulaire de <a href="https://kiswendsida-freres.com/contact/" style="color:#F0B878;text-decoration:underline">kiswendsida-freres.com</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [`NOUVELLE DEMANDE DE DEVIS — ${qui}`, `Reçue le ${recu}`, '',
    `Matière : ${v.matiere}`, `Tonnage estimé : ${v.tonnage || 'à préciser'}`, `Ville / Zone : ${v.zone}`, '',
    ...(v.message ? ['LA DEMANDE', v.message, ''] : []),
    'LE DEMANDEUR', `Nom : ${v.nom}`, ...(v.societe ? [`Société : ${v.societe}`] : []), ...(v.email ? [`E-mail : ${v.email}`] : []),
    `Téléphone : ${v.tel}`, `Bordereau (BSD) : ${v.bsd === 'oui' ? 'demandé' : 'non demandé'}`,
    ...(v.source ? [`Provenance : ${v.source}`] : []), '',
    '— Formulaire de kiswendsida-freres.com'].join('\n');

  return { html, text, attachments: [{ filename: 'logo.png', content: Buffer.from(LOGO.png, 'base64'), contentType: 'image/png',
    cid: 'logo-kf', contentDisposition: 'inline' }] };
}
