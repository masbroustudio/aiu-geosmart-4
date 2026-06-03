import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CreditReportData {
  bands: { rating: string; scoreRange: string; count: number; pctPortfolio: string; defaultRate: string; meanPD: string }[];
  pdBuckets: { bucket: string; count: number; pctPortfolio: string; defaultRate: string; avgPD: string; expectedLoss: string }[];
}

interface GovReportData {
  govPriority: { rank: number; cluster: string; n_umkm: number; priority_score: number; budget_pct: number }[];
  priorityKecamatan: { kecamatan: string; kabupaten: string; avg_skor: number; rank: number; factor: string; recommendation: string }[];
}

interface InvestmentReportData {
  investment: { rank: number; cluster: string; n_umkm: number; investment_score: number; market_size_juta: number }[];
  profiles: { name: string; n_umkm: number; avg_score: number; digital_pct: number; survival_rate: number }[];
}

function addHeader(doc: jsPDF, reportType: string) {
  doc.setFontSize(18);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('GeoUMKM Intelligence v4.0', 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // slate
  doc.text(reportType, 14, 28);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 34);
  doc.setDrawColor(51, 65, 85);
  doc.line(14, 37, 196, 37);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${pageCount}`, 14, 287);
    doc.text('GeoUMKM Intelligence v4.0 - Confidential', 196, 287, { align: 'right' });
  }
}

export function generateCreditReport(data: CreditReportData) {
  const doc = new jsPDF();
  addHeader(doc, 'Credit Risk Summary Report');

  // KPI Section
  const totalUmkm = data.bands.reduce((sum, b) => sum + b.count, 0);
  const highRiskCount = data.bands.filter(b => b.rating.includes('Weak') || b.rating.includes('Below')).reduce((sum, b) => sum + b.count, 0);

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Key Performance Indicators', 14, 45);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total UMKMs Scored: ${totalUmkm.toLocaleString()}`, 14, 53);
  doc.text(`High Risk (BB and below): ${highRiskCount.toLocaleString()} (${((highRiskCount / totalUmkm) * 100).toFixed(1)}%)`, 14, 59);
  doc.text(`Low Risk (A and above): ${data.bands.slice(0, 3).reduce((s, b) => s + b.count, 0).toLocaleString()}`, 14, 65);

  // Credit Bands Table
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Credit Score Bands', 14, 75);

  (doc as unknown as { autoTable: (options: Record<string, unknown>) => void }).autoTable({
    startY: 79,
    head: [['Rating', 'Score Range', 'Count', 'Portfolio %', 'Default Rate', 'Mean PD']],
    body: data.bands.map(b => [b.rating, b.scoreRange, b.count.toLocaleString(), b.pctPortfolio, b.defaultRate, b.meanPD]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // PD Buckets Table
  doc.addPage();
  addHeader(doc, 'Credit Risk Summary Report');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('PD Regulatory Buckets', 14, 45);

  (doc as unknown as { autoTable: (options: Record<string, unknown>) => void }).autoTable({
    startY: 49,
    head: [['Bucket', 'Count', 'Portfolio %', 'Default Rate', 'Avg PD', 'Expected Loss']],
    body: data.pdBuckets.map(b => [b.bucket, b.count.toLocaleString(), b.pctPortfolio, b.defaultRate, b.avgPD, b.expectedLoss]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save('credit-risk-report.pdf');
}

export function generateGovernmentReport(data: GovReportData) {
  const doc = new jsPDF();
  addHeader(doc, 'Government Priority Report');

  // KPI Section
  const totalUmkm = data.govPriority.reduce((sum, g) => sum + g.n_umkm, 0);
  const topPriority = data.govPriority[0];

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Key Performance Indicators', 14, 45);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total UMKMs Covered: ${totalUmkm.toLocaleString()}`, 14, 53);
  doc.text(`Highest Priority Cluster: ${topPriority.cluster} (Score: ${topPriority.priority_score.toFixed(3)})`, 14, 59);
  doc.text(`Priority Kecamatan Identified: ${data.priorityKecamatan.length}`, 14, 65);

  // Gov Priority Table
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Government Priority Ranking', 14, 75);

  (doc as unknown as { autoTable: (options: Record<string, unknown>) => void }).autoTable({
    startY: 79,
    head: [['Rank', 'Cluster', 'UMKM Count', 'Priority Score', 'Budget %']],
    body: data.govPriority.map(g => [`#${g.rank}`, g.cluster, g.n_umkm.toLocaleString(), g.priority_score.toFixed(3), `${g.budget_pct}%`]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Priority Kecamatan Table
  doc.addPage();
  addHeader(doc, 'Government Priority Report');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Priority Kecamatan', 14, 45);

  (doc as unknown as { autoTable: (options: Record<string, unknown>) => void }).autoTable({
    startY: 49,
    head: [['Rank', 'Kecamatan', 'Kabupaten', 'Avg Score', 'Factor', 'Recommendation']],
    body: data.priorityKecamatan.map(k => [`#${k.rank}`, k.kecamatan, k.kabupaten, k.avg_skor.toFixed(2), k.factor, k.recommendation]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 5: { cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save('government-priority-report.pdf');
}

export function generateInvestmentReport(data: InvestmentReportData) {
  const doc = new jsPDF();
  addHeader(doc, 'Investment Opportunity Brief');

  // KPI Section
  const totalMarket = data.investment.reduce((sum, inv) => sum + inv.market_size_juta, 0);
  const topOpp = data.investment[0];

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Key Performance Indicators', 14, 45);

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Market Size: Rp ${totalMarket.toLocaleString()} Juta`, 14, 53);
  doc.text(`Top Opportunity: ${topOpp.cluster} (Score: ${topOpp.investment_score.toFixed(3)})`, 14, 59);
  doc.text(`Total Segments: ${data.investment.length}`, 14, 65);

  // Investment Table
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Investment Opportunity Matrix', 14, 75);

  (doc as unknown as { autoTable: (options: Record<string, unknown>) => void }).autoTable({
    startY: 79,
    head: [['Rank', 'Cluster', 'UMKM Count', 'Investment Score', 'Market Size (Juta)']],
    body: data.investment.map(inv => [`#${inv.rank}`, inv.cluster, inv.n_umkm.toLocaleString(), inv.investment_score.toFixed(3), inv.market_size_juta.toLocaleString()]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  // Cluster Profiles
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  const lastTableY = 79 + (data.investment.length + 2) * 10 + 10;
  doc.text('Cluster Profiles', 14, lastTableY);

  (doc as unknown as { autoTable: (options: Record<string, unknown>) => void }).autoTable({
    startY: lastTableY + 4,
    head: [['Cluster', 'UMKM Count', 'Avg Score', 'Digital %', 'Survival Rate']],
    body: data.profiles.map(p => [p.name, p.n_umkm.toLocaleString(), p.avg_score.toFixed(1), `${p.digital_pct}%`, `${p.survival_rate}%`]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save('investment-opportunity-report.pdf');
}
