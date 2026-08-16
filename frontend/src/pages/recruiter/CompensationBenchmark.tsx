// src/pages/recruiter/CompensationBenchmark.tsx
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Building2, Sparkles, Scale, AlertTriangle } from 'lucide-react';
import { Button, Card, Badge, Input, Select, Spinner, PageHeader, useToast } from '../../components/ui';
import { compensationApi, extractError } from '../../services/api';

const LOCATIONS = ['Bengaluru', 'Chennai', 'Hyderabad', 'Mumbai', 'Delhi NCR', 'Pune', 'Remote (India)'];

interface Benchmark {
  id: string;
  jobTitle: string;
  location: string;
  experienceMin: number;
  experienceMax: number;
  p25Salary: number;
  p50Salary: number;
  p75Salary: number;
  p90Salary: number;
  generatedAt: string;
  topCompanies?: string[];
  premiumSkills?: string[];
  trend?: 'rising' | 'stable' | 'declining';
  analysis?: string;
}

interface Comparison {
  expectedSalaryLakhs: number;
  percentile: number;
  competitive: 'BELOW_MARKET' | 'COMPETITIVE' | 'ABOVE_MARKET' | 'HIGH_RISK';
  suggestedRange: { min: number; max: number };
}

const COMPETITIVE_META: Record<string, { label: string; variant: 'red' | 'green' | 'yellow' | 'orange' }> = {
  BELOW_MARKET: { label: 'Below market — risk of decline or low retention', variant: 'yellow' },
  COMPETITIVE: { label: 'Competitive offer', variant: 'green' },
  ABOVE_MARKET: { label: 'Above market — justify with strong signal', variant: 'orange' },
  HIGH_RISK: { label: 'Well above market — budget risk', variant: 'red' },
};

const TREND_META: Record<string, { icon: any; color: string }> = {
  rising: { icon: TrendingUp, color: '#10b981' },
  stable: { icon: Minus, color: '#64748b' },
  declining: { icon: TrendingDown, color: '#f43f5e' },
};

export default function CompensationBenchmark() {
  const { show, ToastContainer } = useToast();

  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [minExp, setMinExp] = useState('2');
  const [maxExp, setMaxExp] = useState('5');
  const [generating, setGenerating] = useState(false);

  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [history, setHistory] = useState<Benchmark[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [expectedSalary, setExpectedSalary] = useState('');
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<Comparison | null>(null);

  useEffect(() => {
    compensationApi.list()
      .then(setHistory)
      .catch((err) => show(extractError(err), 'error'))
      .finally(() => setLoadingHistory(false));
  }, [show]);

  async function getBenchmark() {
    if (!jobTitle.trim()) { show('Enter a job title', 'error'); return; }
    if (Number(maxExp) < Number(minExp)) { show('Max experience must be >= min experience', 'error'); return; }
    setGenerating(true);
    setComparison(null);
    try {
      const data = await compensationApi.generate({
        jobTitle: jobTitle.trim(),
        location,
        minExp: Number(minExp),
        maxExp: Number(maxExp),
      });
      setBenchmark(data);
      setHistory((prev) => [data, ...prev]);
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function compareOffer() {
    if (!benchmark || !expectedSalary) return;
    setComparing(true);
    try {
      const data = await compensationApi.compare(benchmark.id, Number(expectedSalary));
      setComparison(data);
    } catch (err) {
      show(extractError(err), 'error');
    } finally {
      setComparing(false);
    }
  }

  const chartData = benchmark ? [
    { percentile: 'P25', lakhs: benchmark.p25Salary },
    { percentile: 'P50', lakhs: benchmark.p50Salary },
    { percentile: 'P75', lakhs: benchmark.p75Salary },
    { percentile: 'P90', lakhs: benchmark.p90Salary },
  ] : [];

  const TrendIcon = benchmark?.trend ? TREND_META[benchmark.trend].icon : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ToastContainer />
      <PageHeader
        title="Compensation Benchmarking"
        description="AI-estimated Indian market salary ranges — not a licensed compensation survey"
      />

      <div className="flex items-start gap-2.5 bg-surface-100 border border-surface-200 rounded-xl px-4 py-3 mb-6">
        <AlertTriangle size={16} className="text-surface-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-surface-600 font-medium">
          Benchmarks are Claude's estimate of 2026 Indian market rates, not sourced from a licensed compensation survey. Use as directional guidance, not a contractual figure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form + history */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-surface-900">Get Benchmark</h3>
            <Input label="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" />
            <Select label="Location" value={location} onChange={(e) => setLocation(e.target.value)} options={LOCATIONS.map((l) => ({ value: l, label: l }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Min Exp (yrs)" type="number" min={0} value={minExp} onChange={(e) => setMinExp(e.target.value)} />
              <Input label="Max Exp (yrs)" type="number" min={0} value={maxExp} onChange={(e) => setMaxExp(e.target.value)} />
            </div>
            <Button className="w-full" icon={<Sparkles size={14} />} loading={generating} onClick={getBenchmark}>
              Get Benchmark
            </Button>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-surface-100">
              <h3 className="font-semibold text-surface-900">History</h3>
            </div>
            {loadingHistory ? (
              <div className="flex justify-center py-8"><Spinner size={20} /></div>
            ) : history.length === 0 ? (
              <div className="p-5 text-center text-sm text-surface-400">No benchmarks generated yet.</div>
            ) : (
              <div className="divide-y divide-surface-50 max-h-72 overflow-y-auto">
                {history.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { setBenchmark(b); setComparison(null); }}
                    className={`w-full text-left px-5 py-3 hover:bg-surface-50 transition-colors ${benchmark?.id === b.id ? 'bg-brand-50' : ''}`}
                  >
                    <p className="text-sm font-medium text-surface-900 truncate">{b.jobTitle}</p>
                    <p className="text-xs text-surface-400">{b.location} · {b.experienceMin}-{b.experienceMax}y · ₹{b.p50Salary}L median</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {!benchmark ? (
            <Card className="p-10 text-center text-sm text-surface-400">
              Generate a benchmark to see salary ranges, top paying companies, and premium skills.
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-surface-900">{benchmark.jobTitle}</h3>
                    <p className="text-xs text-surface-400">{benchmark.location} · {benchmark.experienceMin}-{benchmark.experienceMax} years</p>
                  </div>
                  {benchmark.trend && TrendIcon && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: TREND_META[benchmark.trend].color }}>
                      <TrendIcon size={14} /> {benchmark.trend.toUpperCase()}
                    </span>
                  )}
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="percentile" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: '₹ lakhs/yr', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip formatter={(v: number) => [`₹${v}L`, 'Salary']} />
                    <Bar dataKey="lakhs" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {benchmark.analysis && (
                  <p className="text-sm text-surface-600 mt-3 leading-relaxed">{benchmark.analysis}</p>
                )}
              </Card>

              {(benchmark.topCompanies?.length || benchmark.premiumSkills?.length) ? (
                <div className="grid grid-cols-2 gap-4">
                  {benchmark.topCompanies && benchmark.topCompanies.length > 0 && (
                    <Card className="p-5">
                      <h4 className="font-semibold text-surface-900 mb-3 flex items-center gap-2 text-sm">
                        <Building2 size={14} className="text-brand-600" /> Top Paying Companies
                      </h4>
                      <ul className="space-y-1.5">
                        {benchmark.topCompanies.map((c) => (
                          <li key={c} className="text-sm text-surface-700">{c}</li>
                        ))}
                      </ul>
                    </Card>
                  )}
                  {benchmark.premiumSkills && benchmark.premiumSkills.length > 0 && (
                    <Card className="p-5">
                      <h4 className="font-semibold text-surface-900 mb-3 text-sm">Premium Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {benchmark.premiumSkills.map((s) => (
                          <Badge key={s} variant="purple">{s}</Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : null}

              {/* Offer comparison */}
              <Card className="p-5">
                <h3 className="font-semibold text-surface-900 mb-3 flex items-center gap-2">
                  <Scale size={16} className="text-brand-600" /> Is This Offer Competitive?
                </h3>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Candidate's expected salary (₹ lakhs/yr)"
                    type="number"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    className="flex-1"
                  />
                  <Button loading={comparing} onClick={compareOffer} disabled={!expectedSalary}>Compare</Button>
                </div>

                {comparison && (
                  <div className="bg-surface-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-600">Percentile position</span>
                      <span className="text-sm font-bold text-surface-900">{comparison.percentile}th</span>
                    </div>
                    <Badge variant={COMPETITIVE_META[comparison.competitive].variant}>
                      {COMPETITIVE_META[comparison.competitive].label}
                    </Badge>
                    <div className="flex items-center justify-between pt-2 border-t border-surface-200">
                      <span className="text-sm text-surface-600">Suggested negotiation range</span>
                      <span className="text-sm font-bold text-surface-900">
                        ₹{comparison.suggestedRange.min}L – ₹{comparison.suggestedRange.max}L
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
