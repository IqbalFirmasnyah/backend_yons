// src/services/report.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookingService, BookingWithRelations } from './booking.service';



type Period = { from?: Date; to?: Date };

type ReportRow = {
  kode: string;
  tanggalBooking: Date | string | null;
  produk: string;
  lokasiAtauTujuan: string;
  tMulai: Date | string | null;
  tSelesai: Date | string | null;
  durasi: number;
  peserta: number;
  supir: string;
  armada: string;
  status: string;
  estimasi: number;
  customer: string;
  email: string;
};
type ReportSummary = {
  totalBooking: number;
  totalEstimasi: number;
  byStatus: Record<string, number>;
  byProduk: Record<string, number>;
  period: { from: Date | null; to: Date | null };
  generatedAt: Date;
};

// ===== Normalisasi & mapping =====
function normalizeStatus(input?: string | null): string | undefined {
  if (!input) return undefined;
  return input.trim().toUpperCase().replace(/[\s-]+/g, '_').replace(/[^A-Z0-9_]/g, '');
}

// FE → nilai string di DB (sesuaikan MILIKMU)
const FE_TO_DB: Record<string, string> = {
  // penting: kasus kamu
  WAITING: 'waiting approve admin',
  WAITING_APPROVE_ADMIN: 'waiting approve admin',
  WAIT: 'waiting approve admin',

  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  CANCELED: 'cancelled',
};

function feToDbStatus(input?: string | null) {
  const n = normalizeStatus(input);
  return (n && FE_TO_DB[n]) || undefined;
}
function toNormFromDb(dbVal?: string | null) {
  return normalizeStatus(dbVal); // "waiting approve admin" => "WAITING_APPROVE_ADMIN"
}



// Jika perlu alias, mapping di sini:
const STATUS_MAP: Record<string, string> = {
  WAITING: 'waiting approve admin',
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

function mapToDbStatus(input?: string | null): string | undefined {
  const n = normalizeStatus(input);
  if (!n) return undefined;
  return STATUS_MAP[n] ?? n;
}

/* ===================== REFUND TYPES ===================== */
type RefundReportRow = {
  kodeRefund: string;
  tanggalPengajuan: Date | string | null;
  kodeBooking: string | null;
  produk: string;
  customer: string;
  email: string;
  status: string;
  metode: string;
  potonganAdmin: number;
  bruto: number;   // jumlahRefund (sebelum potongan)
  final: number;   // jumlahRefundFinal (setelah potongan)
  tanggalDisetujui?: Date | string | null;
  tanggalSelesai?: Date | string | null;
};

type RefundReportSummary = {
  totalPengajuan: number;
  totalFinal: number;
  byStatus: Record<string, number>;
  byMetode: Record<string, number>;
  period: { from: Date | null; to: Date | null };
  generatedAt: Date;
};


@Injectable()
export class ReportService {
  constructor(
    private readonly bookingService: BookingService,
    private readonly prisma: PrismaService,
  ) {}

// helper kecil: normalisasi status dari query (ui biasanya kirim lowercase)

async generateBookingsReport(
  period: Period,
  opts?: { status?: string }
): Promise<{ summary: ReportSummary; rows: ReportRow[] }> {
  // FE token -> STRING DB
  const dbStatusForQuery = feToDbStatus(opts?.status);

  // 1) Query ke service (sudah memfilter di Prisma)
  const list = await this.bookingService.findAllBookingsForReport({
    from: period.from,
    to: period.to,
    status: dbStatusForQuery,
  });

  // 2) Filter waktu (jaga-jaga kalau kolom tanggal beda)
  const timeFiltered = list.filter((b: any) => {
    const t = b.tanggalBooking ?? b.tanggalMulaiWisata ?? new Date();
    const time = new Date(t).getTime();
    const okFrom = period.from ? time >= period.from.getTime() : true;
    const okTo = period.to ? time <= period.to.getTime() : true;
    return okFrom && okTo;
  });

  // 3) Pagar-betis status in-memory (bandingkan bentuk normalized)
  const targetNorm = toNormFromDb(dbStatusForQuery);
  const statusFiltered = targetNorm
    ? timeFiltered.filter((b: any) => toNormFromDb(b.statusBooking) === targetNorm)
    : timeFiltered;

  // 4) Map rows
  let rows: ReportRow[] = statusFiltered.map((b: any) => {
    const produk =
      b.paket?.namaPaket ??
      b.paketLuarKota?.namaPaket ??
      b.fasilitas?.namaFasilitas ??
      '-';

    const lokasiAtauTujuan =
      b.paket?.lokasi ??
      b.paketLuarKota?.tujuanUtama ??
      b.fasilitas?.jenisFasilitas ??
      '-';

    const durasi = calcDuration(b.tanggalMulaiWisata, b.tanggalSelesaiWisata);
    const nominal = Number(b.pembayaran?.jumlahBayar ?? b.estimasiHarga ?? 0) || 0;

    return {
      kode: b.kodeBooking,
      tanggalBooking: b.tanggalBooking ?? null,
      produk,
      lokasiAtauTujuan,
      tMulai: b.tanggalMulaiWisata ?? null,
      tSelesai: b.tanggalSelesaiWisata ?? null,
      durasi,
      peserta: b.jumlahPeserta,
      supir: b.supir?.nama || '-',
      armada: b.armada?.platNomor || '-',
      status: b.statusBooking,
      estimasi: nominal,
      customer: b.user?.namaLengkap || '-',
      email: b.user?.email || '-',
    };
  });

  // 5) Final guard: kalau masih ada status lain, filter lagi di rows
  if (targetNorm) {
    rows = rows.filter((r) => toNormFromDb(r.status) === targetNorm);
  }

  const summary: ReportSummary = {
    totalBooking: rows.length,
    totalEstimasi: rows.reduce((s, r) => s + (r.estimasi || 0), 0),
    byStatus: groupCount(rows, (r) => r.status || '-'),
    byProduk: groupCount(rows, (r) => r.produk || '-'),
    period: { from: period.from ?? null, to: period.to ?? null },
    generatedAt: new Date(),
  };

  // Debug yang memudahkan
  console.log('[ReportService] FE status =', opts?.status,
    '| DB status =', dbStatusForQuery,
    '| raw=', list.length, '| afterTime=', timeFiltered.length, '| afterStatus=', rows.length);

  return { summary, rows };
}

renderBookingsHtml(payload: { summary: ReportSummary; rows: ReportRow[] }, opts?: { status?: string }) {
  const s = payload.summary;
  const statusBadges = Object.entries(s.byStatus)
    .map(([k, v]) => `<span class="badge">${escapeHtml(k)} : ${v}</span>`)
    .join('');
  const produkBadges = Object.entries(s.byProduk)
    .map(([k, v]) => `<span class="badge">${escapeHtml(k)} : ${v}</span>`)
    .join('');

  const rowsHtml = payload.rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${fmtDate(r.tanggalBooking)}<br/><small>${escapeHtml(r.kode)}</small></td>
      <td><b>${escapeHtml(r.produk)}</b><br/><small>${escapeHtml(r.lokasiAtauTujuan)}</small></td>
      <td>${fmtDate(r.tMulai)} – ${fmtDate(r.tSelesai)}<br/><small>${r.durasi} hari</small></td>
      <td style="text-align:center">${r.peserta}</td>
      <td>${escapeHtml(r.supir)}<br/><small>${escapeHtml(r.armada)}</small></td>
      <td>${escapeHtml(r.customer)}<br/><small>${escapeHtml(r.email)}</small></td>
      <td>${escapeHtml(r.status)}</td>
      <td style="text-align:right">${formatIDR(r.estimasi)}</td>
    </tr>
  `).join('');

  const from = s.period.from ? fmtDate(s.period.from) : '-';
  const to   = s.period.to   ? fmtDate(s.period.to)   : '-';
  const periodText = (from === '-' && to === '-') ? 'Semua Periode' : `${from} s.d. ${to}`;
  const chosen = opts?.status ? opts.status.replace(/_/g, ' ') : undefined;
  const statusInfo = chosen ? ` • Status: ${escapeHtml(chosen)}` : '';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Laporan Booking</title>
<style>
* { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
body { color: #1f2937; }
h1 { margin: 0 0 6px; font-size: 22px; }
.muted { color: #6b7280; font-size: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0 16px; }
.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
.badge { display:inline-block; padding:2px 8px; background:#f3f4f6; border:1px solid #e5e7eb; border-radius: 12px; margin:2px; font-size: 11px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
th { background: #f9fafb; text-align: left; }
.right { text-align: right; }
</style>
</head>
<body>
<h1>Laporan Booking</h1>
<div class="muted">Periode: ${periodText}${statusInfo}</div>
<div class="muted">Dibuat: ${fmtDateTime(s.generatedAt)}</div>

<div class="grid">
  <div class="card">
    <b>Ringkasan</b>
    <div>Total Booking: <b>${s.totalBooking}</b></div>
    <div>Estimasi Omzet: <b>${formatIDR(s.totalEstimasi)}</b></div>
  </div>
  <div class="card">
    <b>Distribusi Status</b>
    <div>${statusBadges || '-'}</div>
    <b style="display:block; margin-top:6px;">Distribusi Produk</b>
    <div>${produkBadges || '-'}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Tgl Booking / Kode</th>
      <th>Produk / Lokasi</th>
      <th>Jadwal</th>
      <th>Peserta</th>
      <th>Supir / Armada</th>
      <th>Customer</th>
      <th>Status</th>
      <th class="right">Estimasi</th>
    </tr>
  </thead>
  <tbody>
    ${rowsHtml}
  </tbody>
</table>
</body>
</html>`;
}



  /* =========================================================
   * REFUND REPORT
   * =======================================================*/
  async generateRefundsReport(period: Period, opts?: { status?: string }): Promise<{
    summary: RefundReportSummary;
    rows: RefundReportRow[];
  }> {
    const where: any = {};
    if (period.from || period.to) {
      where.tanggalPengajuan = {};
      if (period.from) where.tanggalPengajuan.gte = period.from;
      if (period.to)   where.tanggalPengajuan.lte = period.to;
    }
    if (opts?.status) where.statusRefund = opts.status as any;

    const list = await this.prisma.refund.findMany({
      where,
      include: {
        user: { select: { namaLengkap: true, email: true } },
        pembayaran: { select: { jumlahBayar: true } },
        booking: {
          select: {
            kodeBooking: true,
            paket: { select: { namaPaket: true, lokasi: true } },
            paketLuarKota: { select: { namaPaket: true, tujuanUtama: true } },
            fasilitas: { select: { namaFasilitas: true, jenisFasilitas: true } },
          },
        },
      },
      orderBy: { tanggalPengajuan: 'desc' },
    });

    const rows: RefundReportRow[] = list.map((r) => {
      const produk =
        r.booking?.paket?.namaPaket ??
        r.booking?.paketLuarKota?.namaPaket ??
        r.booking?.fasilitas?.namaFasilitas ??
        '-';

      return {
        kodeRefund: r.kodeRefund,
        tanggalPengajuan: r.tanggalPengajuan,
        kodeBooking: r.booking?.kodeBooking ?? null,
        produk,
        customer: r.user?.namaLengkap ?? '-',
        email: r.user?.email ?? '-',
        status: r.statusRefund,
        metode: r.metodeRefund ?? '-',
        potonganAdmin: toNumber(r.jumlahPotonganAdmin),
        bruto: toNumber(r.jumlahRefund),
        final: toNumber(r.jumlahRefundFinal),
        tanggalDisetujui: r.tanggalDisetujui ?? null,
        tanggalSelesai: r.tanggalRefundSelesai ?? null,
      };
    });

    const summary: RefundReportSummary = {
      totalPengajuan: rows.length,
      totalFinal: rows.reduce((s, x) => s + (x.final || 0), 0),
      byStatus: groupCount(rows, (x) => x.status || '-'),
      byMetode: groupCount(rows, (x) => x.metode || '-'),
      period: { from: period.from ?? null, to: period.to ?? null },
      generatedAt: new Date(),
    };

    return { summary, rows };
  }

  renderRefundsHtml(data: { summary: RefundReportSummary; rows: RefundReportRow[] }) {
    const s = data.summary;

    const statusBadges = Object.entries(s.byStatus)
      .map(([k, v]) => `<span class="badge">${escapeHtml(k)} : ${v}</span>`)
      .join('');
    const metodeBadges = Object.entries(s.byMetode)
      .map(([k, v]) => `<span class="badge">${escapeHtml(k)} : ${v}</span>`)
      .join('');

    const rowsHtml = data.rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${fmtDate(r.tanggalPengajuan)}<br/><small>${escapeHtml(r.kodeRefund)}</small></td>
        <td>${escapeHtml(r.kodeBooking ?? '-')}<br/><small>${escapeHtml(r.produk)}</small></td>
        <td>${escapeHtml(r.customer)}<br/><small>${escapeHtml(r.email)}</small></td>
        <td class="capitalize">${escapeHtml(r.status)}</td>
        <td>${escapeHtml(r.metode)}</td>
        <td class="right">${formatIDR(r.bruto)}</td>
        <td class="right">- ${formatIDR(r.potonganAdmin)}</td>
        <td class="right"><b>${formatIDR(r.final)}</b></td>
        <td>
          ${r.tanggalDisetujui ? `Disetujui: ${fmtDate(r.tanggalDisetujui)}<br/>` : ''}
          ${r.tanggalSelesai ? `<small>Selesai: ${fmtDate(r.tanggalSelesai)}</small>` : ''}
        </td>
      </tr>
    `).join('');

    const periodText = (() => {
      const from = s.period.from ? fmtDate(s.period.from) : '-';
      const to = s.period.to ? fmtDate(s.period.to) : '-';
      if (from === '-' && to === '-') return 'Semua Periode';
      return `${from} s.d. ${to}`;
    })();

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Laporan Refund</title>
  <style>
    * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
    body { color: #1f2937; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    .muted { color: #6b7280; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0 16px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
    .badge { display:inline-block; padding:2px 8px; background:#f3f4f6; border:1px solid #e5e7eb; border-radius: 12px; margin:2px; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
    th { background: #f9fafb; text-align: left; }
    .right { text-align: right; }
  </style>
</head>
<body>
  <h1>Laporan Refund</h1>
  <div class="muted">Periode: ${periodText}</div>
  <div class="muted">Dibuat: ${fmtDateTime(s.generatedAt)}</div>

  <div class="grid">
    <div class="card">
      <b>Ringkasan</b>
      <div>Total Pengajuan: <b>${s.totalPengajuan}</b></div>
      <div>Total Refund Final: <b>${formatIDR(s.totalFinal)}</b></div>
    </div>
    <div class="card">
      <b>Distribusi Status</b>
      <div>${statusBadges || '-'}</div>
      <b style="display:block; margin-top:6px;">Distribusi Metode</b>
      <div>${metodeBadges || '-'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Tgl/Kode Refund</th>
        <th>Kode Booking / Produk</th>
        <th>Customer</th>
        <th>Status</th>
        <th>Metode</th>
        <th class="right">Bruto</th>
        <th class="right">Potongan</th>
        <th class="right">Final</th>
        <th>Tgl Approval/Selesai</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>`;
  }
}

/* ================= Helpers ================= */
function calcDuration(start?: Date | string | null, end?: Date | string | null) {
  if (!start || !end) return 1;
  const s = new Date(start as any).getTime();
  const e = new Date(end as any).getTime();
  if (isNaN(s) || isNaN(e)) return 1;
  const days = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}
function pad(n: number) { return n.toString().padStart(2, '0'); }
function fmtDate(d?: Date | string | null) {
  if (!d) return '-';
  const x = new Date(d as any);
  if (isNaN(x.getTime())) return '-';
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`;
}
function fmtDateTime(d: Date) {
  return `${fmtDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n || 0)));
}
function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function groupCount<T>(arr: T[], keyFn: (x: T) => string) {
  return arr.reduce((acc, cur) => {
    const k = keyFn(cur) || '-';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
function toNumber(x: any): number {
  if (x == null) return 0;
  const n = Number((x as any).toString ? (x as any).toString() : x);
  return isNaN(n) ? 0 : n;
}



