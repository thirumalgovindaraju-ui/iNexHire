// src/utils/pdfExport.ts
// PDF report export — uses browser's print-to-PDF (no library needed)
// Opens a styled print window that the user saves as PDF

import type { Report } from '../types';

export function exportReportAsPDF(report: Report) {
  const scoreColor = (s: number) =>
    s >= 80 ? '#16a34a' : s >= 60 ? '#2563eb' : s >= 40 ? '#d97706' : '#dc2626';

  const recColor = (r: string) =>
    r === 'STRONG_HIRE' ? '#16a34a' :
    r === 'HIRE'        ? '#2563eb' :
    r === 'NEUTRAL'     ? '#d97706' : '#dc2626';

  const recLabel = (r: string) =>
    r === 'STRONG_HIRE' ? 'Strong Hire' :
    r === 'HIRE'        ? 'Hire' :
    r === 'NEUTRAL'     ? 'Neutral' : 'Reject';

  const skillBars = Object.entries(report.skillScores ?? {})
    .map(([skill, score]) => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span>${skill}</span>
          <span style="font-weight:600;color:${scoreColor(score as number)}">${score}/100</span>
        </div>
        <div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${score}%;background:${scoreColor(score as number)};border-radius:3px"></div>
        </div>
      </div>`)
    .join('');

  const responses = (report.responses ?? [])
    .map((r, i) => `
      <div style="margin-bottom:20px;padding:14px;border:1px solid #e5e7eb;border-radius:8px;page-break-inside:avoid">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
          <div style="font-weight:600;font-size:13px;flex:1;padding-right:12px">Q${i + 1}. ${r.question}</div>
          <div style="font-weight:700;font-size:14px;color:${scoreColor(r.score ?? 0)};white-space:nowrap">${r.score ?? 0}/100</div>
        </div>
        ${r.transcript ? `
          <div style="font-size:12px;color:#374151;margin-bottom:8px;padding:8px;background:#f9fafb;border-radius:4px;line-height:1.5">
            <strong>Answer:</strong> ${r.transcript}
          </div>` : '<div style="font-size:12px;color:#9ca3af;margin-bottom:8px;font-style:italic">No answer provided</div>'}
        ${r.feedback ? `
          <div style="font-size:12px;color:#6b7280;font-style:italic">
            <strong style="color:#374151">AI Feedback:</strong> ${r.feedback}
          </div>` : ''}
      </div>`)
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Interview Report — ${report.candidate?.name ?? 'Candidate'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; padding: 40px; max-width: 800px; margin: 0 auto; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #111827">
    <div>
      <div style="font-size:22px;font-weight:700">${report.candidate?.name ?? 'Candidate'}</div>
      <div style="font-size:14px;color:#6b7280;margin-top:2px">${report.candidate?.email ?? ''}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">Applied for: <strong style="color:#111827">${report.opening?.title ?? 'N/A'}</strong></div>
    </div>
    <div style="text-align:right">
      <div style="font-size:36px;font-weight:800;color:${scoreColor(report.overallScore)}">${report.overallScore}</div>
      <div style="font-size:11px;color:#6b7280">Overall Score</div>
      <div style="margin-top:6px;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700;background:${recColor(report.recommendation)}15;color:${recColor(report.recommendation)};border:1px solid ${recColor(report.recommendation)}40;display:inline-block">
        ${recLabel(report.recommendation)}
      </div>
    </div>
  </div>

  <!-- Summary -->
  <div style="margin-bottom:24px">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:8px">Executive Summary</div>
    <div style="font-size:14px;line-height:1.6;color:#374151;padding:14px;background:#f9fafb;border-radius:8px;border-left:3px solid #3b82f6">${report.summary}</div>
  </div>

  <!-- Strengths & Weaknesses -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
    <div style="padding:16px;border:1px solid #d1fae5;border-radius:8px;background:#f0fdf4">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#16a34a;margin-bottom:10px">Strengths</div>
      ${(report.strengths ?? []).map(s => `<div style="font-size:13px;color:#374151;margin-bottom:6px;display:flex;gap:6px"><span style="color:#16a34a">✓</span>${s}</div>`).join('')}
    </div>
    <div style="padding:16px;border:1px solid #fee2e2;border-radius:8px;background:#fff5f5">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#dc2626;margin-bottom:10px">Areas to Improve</div>
      ${(report.weaknesses ?? []).map(w => `<div style="font-size:13px;color:#374151;margin-bottom:6px;display:flex;gap:6px"><span style="color:#dc2626">△</span>${w}</div>`).join('')}
    </div>
  </div>

  <!-- Skill Scores -->
  ${Object.keys(report.skillScores ?? {}).length > 0 ? `
  <div style="margin-bottom:24px">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:12px">Skill Scores</div>
    ${skillBars}
  </div>` : ''}

  <!-- Interview Stats -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px">
    <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center">
      <div style="font-size:20px;font-weight:700;color:#111827">${(report.responses ?? []).length}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px">Questions Answered</div>
    </div>
    <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center">
      <div style="font-size:20px;font-weight:700;color:#111827">${report.proctorSummary?.totalEvents ?? 0}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px">Proctor Events</div>
    </div>
    <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;text-align:center">
      <div style="font-size:20px;font-weight:700;color:${recColor(report.recommendation)}">${recLabel(report.recommendation)}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px">Recommendation</div>
    </div>
  </div>

  <!-- Q&A Detail -->
  ${responses ? `
  <div>
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:14px">Question-by-Question Detail</div>
    ${responses}
  </div>` : ''}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between">
    <span>Generated by NexHire AI Interview Platform</span>
    <span>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  </div>

  <div class="no-print" style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="padding:10px 24px;background:#111827;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow popups to download the PDF report.');
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
