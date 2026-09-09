const ALL_VARS = PILLARS.flatMap(p => p.vars.map(v => ({...v, pillar: p.title})));
const MAX_SCORE = ALL_VARS.reduce((s, v) => s + v.weight * 5, 0); // 321.5 (formula bertingkat: X=30%, Y1+Y2=40% dari Y, Y3=60% dari Y, Y=70% dari total)
{
  const scoreMaxEl = document.getElementById('scoreMax');
  if (scoreMaxEl) scoreMaxEl.textContent = `dari maksimum ${Math.round(MAX_SCORE * 10) / 10}`;
}

function classify(total) {
  if (total > 300) return { key: 'strong', label: 'Strong Partner', fee: 'Rekomendasi fee flat 0.5%' };
  if (total >= 250) return { key: 'good', label: 'Good Partner', fee: 'Dapat diberikan 0.3 % sd 0.4 %' };
  return { key: 'potential', label: 'Potential Partner', fee: 'Rekomendasi fee flat 0.1% – 0.2%' };
}



function getTierSchedule(classKey) {
  return TIER_SCHEDULES[classKey] || null;
}

function pillarWeight(pillar) { return pillar.vars.reduce((s, v) => s + v.weight, 0); }
function variablePct(v) { return ((v.weight * 5 / MAX_SCORE) * 100).toFixed(1) + '%'; }

// Bulatkan persentase tiap pilar sedemikian rupa sehingga totalnya selalu tepat 100%
// (pembulatan independen per pilar bisa menghasilkan total 99.9% atau 100.1%).
const PILLAR_PCTS = (() => {
  const raw = PILLARS.map(p => (pillarWeight(p) * 5 / MAX_SCORE) * 100);
  const rounded = raw.map(x => Math.round(x * 10) / 10);
  const diff = Math.round((100 - rounded.reduce((a, b) => a + b, 0)) * 10) / 10;
  rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + diff) * 10) / 10;
  return rounded;
})();
function pillarPct(pillar) { return PILLAR_PCTS[PILLARS.indexOf(pillar)].toFixed(1) + '%'; }

// ---------- render form ----------
const pillarsEl = document.getElementById('pillars');
PILLARS.forEach(pillar => {
  const card = document.createElement('div');
  card.className = 'card pillar';
  const head = document.createElement('div');
  head.className = 'pillar-head';
  head.innerHTML = `<h2>${pillar.title}</h2><span class="w">${pillarPct(pillar)}</span>`;
  card.appendChild(head);

  pillar.vars.forEach(v => {
    const row = document.createElement('div');
    row.className = 'variable';
    const opts = '<option value="" disabled selected hidden>Pilih kriteria…</option>' +
      v.options.map((o, i) => `<option value="${i}">${o.label}</option>`).join('');
    row.innerHTML = `
      <div class="variable-top">
        <span class="vlabel">${v.label}</span>
        <span class="vweight">bobot ${v.bobot}</span>
      </div>
      <select data-varid="${v.id}">${opts}</select>
    `;
    card.appendChild(row);
  });
  pillarsEl.appendChild(card);
});

const selects = Array.from(document.querySelectorAll('select[data-varid]'));

function currentAnswers() {
  const answers = {};
  // stores option INDEX (0-4), atau null jika belum dipilih (dropdown masih placeholder)
  selects.forEach(s => { answers[s.dataset.varid] = s.value === '' ? null : parseInt(s.value, 10); });
  return answers;
}

function computeScore(answers) {
  const round1 = (n) => Math.round(n * 10) / 10;
  const perVar = ALL_VARS.map(v => {
    const idx = answers[v.id];
    const opt = (idx !== null && idx !== undefined) ? v.options[idx] : null;
    const poin = opt ? opt.poin : 0;
    return {
      id: v.id, label: v.label, pillar: v.pillar, weight: v.weight, bobot: v.bobot,
      poin, criteriaLabel: opt ? opt.label : '(belum dipilih)',
      score: round1(poin * v.weight),
    };
  });
  const total = round1(perVar.reduce((s, x) => s + x.score, 0));
  return { perVar, total };
}

const scoreTotalEl = document.getElementById('scoreTotal');
let wasEmpty = null;
const scoreBadgeEl = document.getElementById('scoreBadge');
const feeNoteEl = document.getElementById('feeNote');
const breakdownEl = document.getElementById('breakdown');

function renderScore() {
  const { perVar, total } = computeScore(currentAnswers());
  scoreTotalEl.textContent = total;

  const isEmpty = total === 0;
  const resultBlockEl = document.getElementById('resultBlock');
  const emptyStateEl = document.getElementById('emptyResultState');
  if (isEmpty !== wasEmpty) {
    const shown = isEmpty ? emptyStateEl : resultBlockEl;
    resultBlockEl.style.display = isEmpty ? 'none' : '';
    emptyStateEl.style.display = isEmpty ? '' : 'none';
    shown.classList.remove('pop-in');
    void shown.offsetWidth; // force reflow so the animation restarts
    shown.classList.add('pop-in');
    wasEmpty = isEmpty;
  }

  if (isEmpty) {
    breakdownEl.innerHTML = '';
    return { perVar, total, classification: null };
  }

  const c = classify(total);
  scoreBadgeEl.innerHTML = `<span class="badge ${c.key}">${c.label}</span>`;
  feeNoteEl.textContent = c.fee;

  const tierBlockEl = document.getElementById('tierScheduleBlock');
  const schedule = getTierSchedule(c.key);
  if (schedule) {
    const rows = schedule.map(t => `
      <tr><td>Tier ${t.tier}</td><td>${t.range}</td><td class="fee-col">${t.fee}</td></tr>
    `).join('');
    tierBlockEl.innerHTML = `
      <div class="tier-block">
        <div class="tier-block-title">Skema tiering — ${c.label}</div>
        <table class="tier-table">
          <thead><tr><th>Tier</th><th>Volume transaksi / bulan</th><th style="text-align:right">Fee</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="tier-note">Fee berjenjang sesuai realisasi volume transaksi setelah channel live.</div>
      </div>
    `;
  } else {
    tierBlockEl.innerHTML = '';
  }

  breakdownEl.innerHTML = '';
  perVar.forEach(x => {
    const pct = (x.score / (x.weight * 5)) * 100;
    const item = document.createElement('div');
    item.className = 'breakdown-item';
    item.innerHTML = `
      <div class="bi-top"><span>${x.label}</span><span>${x.score}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    `;
    breakdownEl.appendChild(item);
  });
  return { perVar, total, classification: c };
}

selects.forEach(s => s.addEventListener('change', renderScore));
document.getElementById('assessDate').valueAsDate = new Date();
renderScore();

// ---------- reset ----------
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('partnerName').value = '';
  document.getElementById('partnerType').value = '';
  document.getElementById('assessDate').valueAsDate = new Date();
  selects.forEach(s => s.selectedIndex = 0); // kembali ke placeholder "Pilih kriteria…"
  renderScore();
  document.getElementById('saveMsg').textContent = '';
});

// ---------- db persistence ----------
let dbRef = null;
let assessments = [];

function initDb() {
  if (!FIREBASE_CONFIG.apiKey) {
    document.getElementById('historyBody').innerHTML = '<div class="empty-state">Konfigurasi Firebase belum diisi di data.js — riwayat tidak dapat disimpan/dimuat. Lihat komentar di bagian atas data.js.</div>';
    return;
  }
  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.firestore();
  dbRef = db.collection('assessments');
  dbRef.orderBy('createdAt', 'desc').limit(200).onSnapshot(
    snap => {
      assessments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderHistory();
      if (document.getElementById('dashboardOverlay').classList.contains('open')) renderDashboardContent();
    },
    err => {
      document.getElementById('historyBody').innerHTML = '<div class="empty-state">Gagal memuat riwayat. Cek konfigurasi Firebase &amp; Firestore security rules Anda.</div>';
    }
  );
}
initDb();

function renderHistory() {
  const q = (document.getElementById('searchHistory').value || '').toLowerCase();
  const filtered = assessments.filter(a => (a.partnerName || '').toLowerCase().includes(q));
  const body = document.getElementById('historyBody');
  if (filtered.length === 0) {
    body.innerHTML = `<div class="empty-state">${assessments.length === 0 ? 'Belum ada penilaian tersimpan. Isi formulir di atas lalu klik "Simpan penilaian".' : 'Tidak ada partner yang cocok dengan pencarian.'}</div>`;
    return;
  }
  const rows = filtered.map(a => {
    const c = classify(a.total || 0);
    return `
      <tr>
        <td>${escapeHtml(a.partnerName || '(tanpa nama)')}</td>
        <td>${escapeHtml(a.partnerType || '—')}</td>
        <td>${escapeHtml(a.assessDate || '—')}</td>
        <td>${a.total}</td>
        <td><span class="small-class-badge ${c.key}">${c.label}</span></td>
        <td class="row-actions">
          <button data-action="load" data-id="${a.id}">Muat</button>
          <button data-action="pdf" data-id="${a.id}">PDF</button>
          <button data-action="delete" data-id="${a.id}" class="danger">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
  body.innerHTML = `
    <div class="table-scroll">
    <table>
      <thead><tr><th>Partner</th><th>Jenis</th><th>Tanggal</th><th>Skor</th><th>Klasifikasi</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
  `;
  body.querySelectorAll('button[data-action="load"]').forEach(btn => {
    btn.addEventListener('click', () => loadAssessment(btn.dataset.id));
  });
  body.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteAssessment(btn.dataset.id));
  });
  body.querySelectorAll('button[data-action="pdf"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = assessments.find(x => x.id === btn.dataset.id);
      if (a) generatePdf(a.partnerName, a.partnerType, a.assessDate, computeScore(a.answers || {}));
    });
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function loadAssessment(id) {
  const a = assessments.find(x => x.id === id);
  if (!a) return;
  document.getElementById('partnerName').value = a.partnerName || '';
  document.getElementById('partnerType').value = a.partnerType || '';
  if (a.assessDate) document.getElementById('assessDate').value = a.assessDate;
  selects.forEach(s => {
    const v = a.answers ? a.answers[s.dataset.varid] : undefined;
    if (v !== undefined && v !== null) s.value = String(v);
  });
  renderScore();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteAssessment(id) {
  if (!dbRef) return;
  try {
    await dbRef.doc(id).delete();
  } catch (e) {
    alert('Gagal menghapus data. Coba lagi.');
  }
}

document.getElementById('searchHistory').addEventListener('input', renderHistory);

// ---------- save ----------
document.getElementById('saveBtn').addEventListener('click', async () => {
  const saveMsg = document.getElementById('saveMsg');
  const partnerName = document.getElementById('partnerName').value.trim();
  if (!partnerName) {
    saveMsg.textContent = 'Isi nama partner terlebih dahulu.';
    saveMsg.className = 'save-msg err';
    return;
  }
  if (computeScore(currentAnswers()).total === 0) {
    saveMsg.textContent = 'Isi minimal satu kriteria penilaian terlebih dahulu.';
    saveMsg.className = 'save-msg err';
    return;
  }
  if (!dbRef) {
    saveMsg.textContent = 'Penyimpanan tidak tersedia saat ini.';
    saveMsg.className = 'save-msg err';
    return;
  }
  const { total } = renderScore();
  const record = {
    partnerName,
    partnerType: document.getElementById('partnerType').value.trim(),
    assessDate: document.getElementById('assessDate').value,
    answers: currentAnswers(),
    total,
    createdAt: new Date().toISOString(),
  };
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  try {
    await dbRef.add(record);
    saveMsg.textContent = 'Penilaian tersimpan.';
    saveMsg.className = 'save-msg ok';
  } catch (e) {
    saveMsg.textContent = 'Gagal menyimpan. Coba lagi.';
    saveMsg.className = 'save-msg err';
  } finally {
    btn.disabled = false;
  }
});

// ---------- PDF export (report-style, mirrors internal scoring sheet) ----------
const BRAND_DARK = [4, 79, 69];
const BRAND_GREEN = [15, 171, 77];
const BRAND_LIME = [192, 215, 50];
const BRAND_BAD = [169, 74, 63];

function classColorRgb(key) {
  if (key === 'strong') return BRAND_LIME;
  if (key === 'good') return BRAND_GREEN;
  if (key === 'potential') return [214, 224, 210];
  return BRAND_BAD;
}

function generatePdf(partnerName, partnerType, assessDate, scoreData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 40;

  // header band
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 0, pageW, 64, 'F');
  doc.setFillColor(...BRAND_LIME);
  doc.circle(margin + 10, 32, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('PEGADAIAN', margin + 28, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('KYB PARTNER SCORING — BUSINESS DEVELOPMENT & PRODUCT MANAGEMENT', margin + 28, 42);
  y = 90;

  // channel / result bar
  const c = scoreData.classification || classify(scoreData.total);
  doc.setFillColor(...BRAND_DARK);
  doc.rect(margin, y, pageW - margin * 2, 22, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('CHANNEL', margin + 10, y + 15);
  doc.text('HASIL', pageW - margin - 110, y + 15);
  y += 22;
  doc.setDrawColor(...BRAND_DARK);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, pageW - margin * 2 - 120, 28, 'FD');
  doc.rect(pageW - margin - 120, y, 120, 28, 'FD');
  doc.setTextColor(...BRAND_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(partnerName || '(Tanpa Nama)', margin + 10, y + 19);
  doc.setFillColor(...classColorRgb(c.key));
  doc.rect(pageW - margin - 120, y, 120, 28, 'F');
  doc.setTextColor(...BRAND_DARK);
  doc.setFontSize(9.5);
  doc.text(c.label.toUpperCase(), pageW - margin - 110, y + 18);
  y += 40;

  if (partnerType || assessDate) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 100, 95);
    doc.text(`Jenis channel: ${partnerType || '—'}    |    Tanggal penilaian: ${assessDate || '—'}`, margin, y);
    y += 14;
  }

  // build table body grouped by pillar with subtotal rows
  const body = [];
  let no = 1;
  const pillarOrder = ['Industri', 'Financial', 'Non-Financial', 'Market Validation'];
  pillarOrder.forEach(pillarName => {
    const rows = scoreData.perVar.filter(v => v.pillar === pillarName);
    if (rows.length === 0) return;
    let subtotalScore = 0;
    rows.forEach(v => {
      subtotalScore += v.score;
      body.push([
        String(no++), pillarName, v.label, v.criteriaLabel, String(v.poin), String(v.bobot), String(v.score),
        { type: 'data' }
      ]);
    });
    body.push([
      '', '', `Subtotal ${pillarName}`, '', '', '', String(Math.round(subtotalScore * 10) / 10),
      { type: 'subtotal' }
    ]);
  });
  body.push(['', '', 'TOTAL SKOR', '', '', '', String(scoreData.total), { type: 'total' }]);

  doc.autoTable({
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [['No', 'Pilar', 'Indikator', 'Kriteria Terpilih', 'Poin', 'Bobot', 'Skor']],
    body: body.map(r => r.slice(0, 7)),
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, textColor: [16, 32, 27], lineColor: [220, 231, 219], lineWidth: 0.5 },
    headStyles: { fillColor: BRAND_DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 62 },
      2: { cellWidth: 130 },
      3: { cellWidth: 145 },
      4: { cellWidth: 32, halign: 'center' },
      5: { cellWidth: 40, halign: 'center' },
      6: { cellWidth: 40, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const meta = body[data.row.index][7];
      if (meta && meta.type === 'subtotal') {
        data.cell.styles.fillColor = [238, 245, 237];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = BRAND_DARK;
      }
      if (meta && meta.type === 'total') {
        data.cell.styles.fillColor = BRAND_DARK;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [255, 255, 255];
      }
    },
  });

  let finalY = doc.lastAutoTable.finalY + 18;
  if (finalY > doc.internal.pageSize.getHeight() - 110) {
    doc.addPage();
    finalY = 40;
  }

  // summary box
  doc.setFillColor(...classColorRgb(c.key));
  doc.rect(margin, finalY, pageW - margin * 2, 54, 'F');
  doc.setTextColor(...BRAND_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${partnerName || 'Partner ini'} memiliki skor keseluruhan ${scoreData.total} dari 500,`, margin + 12, finalY + 20);
  doc.text(`sehingga masuk kategori "${c.label}".`, margin + 12, finalY + 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(c.fee, margin + 12, finalY + 48);

  finalY += 68;

  const schedule = getTierSchedule(c.key);
  if (schedule) {
    if (finalY > doc.internal.pageSize.getHeight() - 140) {
      doc.addPage();
      finalY = 40;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_DARK);
    doc.text(`Skema Tiering — ${c.label}`, margin, finalY);
    finalY += 6;
    doc.autoTable({
      startY: finalY,
      margin: { left: margin, right: margin },
      head: [['Tier', 'Volume Transaksi / Bulan', 'Fee']],
      body: schedule.map(t => [`Tier ${t.tier}`, t.range, t.fee]),
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, textColor: [16, 32, 27], lineColor: [220, 231, 219], lineWidth: 0.5 },
      headStyles: { fillColor: BRAND_DARK, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 220 },
        2: { cellWidth: 60, halign: 'right', fontStyle: 'bold', textColor: BRAND_GREEN },
      },
    });
    finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 125);
    doc.text('Fee berjenjang sesuai realisasi volume transaksi per bulan setelah channel live.', margin, finalY);
    finalY += 16;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 125);
  doc.text('Dokumen internal Pegadaian — hasil penilaian awal, bukan keputusan final onboarding.', margin, finalY);

  const safeName = (partnerName || 'partner').replace(/[^a-z0-9]+/gi, '_');
  doc.save(`KYB-Scoring-${safeName}.pdf`);
}

document.getElementById('exportBtn').addEventListener('click', () => {
  const scoreData = computeScore(currentAnswers());
  if (scoreData.total === 0) {
    alert('Isi minimal satu kriteria penilaian terlebih dahulu sebelum mengunduh laporan.');
    return;
  }
  const partnerName = document.getElementById('partnerName').value.trim();
  const partnerType = document.getElementById('partnerType').value.trim();
  const assessDate = document.getElementById('assessDate').value;
  generatePdf(partnerName, partnerType, assessDate, scoreData);
});

// ---------- Dashboard ringkasan ----------
const CLASS_COLOR_VAR = { strong: 'var(--brand-lime)', good: 'var(--brand-green)', potential: 'var(--brand-dark)' };
const CLASS_COLOR_HEX = { strong: '#C0D732', good: '#0FAB4D', potential: '#044F45' };

function renderDashboardContent() {
  const body = document.getElementById('dashboardBody');
  if (!assessments || assessments.length === 0) {
    body.innerHTML = `
      <div class="dash-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 21H3V3"/><path d="M7 14l4-4 3 3 5-6"/></svg>
        <div>Belum ada riwayat penilaian yang tersimpan.<br>Simpan minimal satu penilaian untuk melihat dashboard.</div>
      </div>
    `;
    return;
  }

  const total = assessments.length;
  const counts = { strong: 0, good: 0, potential: 0 };
  let scoreSum = 0;
  const typeCounts = {};
  assessments.forEach(a => {
    const c = classify(a.total || 0);
    counts[c.key] = (counts[c.key] || 0) + 1;
    scoreSum += (a.total || 0);
    const t = (a.partnerType || 'Tidak diketahui').trim() || 'Tidak diketahui';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const avgScore = Math.round((scoreSum / total) * 10) / 10;

  // donut conic-gradient
  const order = ['strong', 'good', 'potential'];
  let acc = 0;
  const segments = order.map(key => {
    const pct = (counts[key] / total) * 100;
    const seg = `${CLASS_COLOR_HEX[key]} ${acc}% ${acc + pct}%`;
    acc += pct;
    return seg;
  }).join(', ');
  const donutBg = total > 0 ? `conic-gradient(${segments})` : 'var(--panel-sunken)';

  const labelMap = { strong: 'Strong Partner', good: 'Good Partner', potential: 'Potential Partner' };
  const legendHtml = order.map(key => `
    <div class="dash-legend-item">
      <span class="dash-legend-dot" style="background:${CLASS_COLOR_VAR[key]}"></span>
      <span class="lname">${labelMap[key]}</span>
      <span class="lval">${counts[key]} partner (${total > 0 ? Math.round((counts[key] / total) * 100) : 0}%)</span>
    </div>
  `).join('');

  // breakdown jenis channel
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxTypeCount = typeEntries.length ? typeEntries[0][1] : 1;
  const typeBarsHtml = typeEntries.map(([name, cnt], i) => {
    const pct = (cnt / maxTypeCount) * 100;
    const colors = ['var(--brand-dark)', 'var(--brand-green)', 'var(--brand-lime)'];
    const color = colors[i % colors.length];
    return `
      <div class="dash-bar-row">
        <span class="bname">${escapeHtml(name)}</span>
        <div class="dash-bar-track"><div class="dash-bar-fill" style="width:${pct}%;background:${color}"></div></div>
        <span class="bcount">${cnt}</span>
      </div>
    `;
  }).join('');

  // leaderboard top 5 by score
  const top5 = [...assessments].sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 5);
  const leaderboardRows = top5.map(a => {
    const c = classify(a.total || 0);
    return `
      <tr>
        <td>${escapeHtml(a.partnerName || '(tanpa nama)')}</td>
        <td><span class="small-class-badge ${c.key}">${c.label}</span></td>
        <td class="score-col">${a.total}</td>
      </tr>
    `;
  }).join('');

  body.innerHTML = `
    <div class="dash-kpi-row">
      <div class="dash-kpi">
        <div class="dash-kpi-label">Total Partner Dinilai</div>
        <div class="dash-kpi-value">${total}</div>
        <div class="dash-kpi-sub">seluruh riwayat tersimpan</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-label">Rata-rata Skor</div>
        <div class="dash-kpi-value">${avgScore}</div>
        <div class="dash-kpi-sub">dari maksimum ${Math.round(MAX_SCORE * 10) / 10}</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-label">Strong Partner</div>
        <div class="dash-kpi-value">${counts.strong || 0}</div>
        <div class="dash-kpi-sub">${total > 0 ? Math.round(((counts.strong || 0) / total) * 100) : 0}% dari total</div>
      </div>
      <div class="dash-kpi">
        <div class="dash-kpi-label">Good + Potential</div>
        <div class="dash-kpi-value">${(counts.good || 0) + (counts.potential || 0)}</div>
        <div class="dash-kpi-sub">kandidat untuk dikembangkan</div>
      </div>
    </div>

    <div class="dash-main-grid">
      <div class="donut-wrap">
        <div class="donut" style="background:${donutBg}">
          <div class="donut-center">
            <span class="n">${total}</span>
            <span class="lbl">partner dinilai</span>
          </div>
        </div>
      </div>
      <div>
        <div class="dash-section-title">Distribusi Klasifikasi Partner</div>
        <div class="dash-legend">${legendHtml}</div>
      </div>
    </div>

    ${typeEntries.length ? `
    <div style="margin-bottom:30px;">
      <div class="dash-section-title">Distribusi berdasarkan Jenis Channel</div>
      ${typeBarsHtml}
    </div>` : ''}

    <div>
      <div class="dash-section-title">5 Partner dengan Skor Tertinggi</div>
      <table class="dash-leaderboard">
        <thead><tr><th>Partner</th><th>Klasifikasi</th><th style="text-align:right">Skor</th></tr></thead>
        <tbody>${leaderboardRows}</tbody>
      </table>
    </div>
  `;
}

function openDashboard() {
  renderDashboardContent();
  document.getElementById('dashboardOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDashboard() {
  document.getElementById('dashboardOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('openDashboardBtn').addEventListener('click', openDashboard);
document.getElementById('closeDashboardBtn').addEventListener('click', closeDashboard);
document.getElementById('dashboardOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'dashboardOverlay') closeDashboard();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('dashboardOverlay').classList.contains('open')) closeDashboard();
});
