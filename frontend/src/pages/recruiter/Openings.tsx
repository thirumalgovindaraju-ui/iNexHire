// src/pages/recruiter/Openings.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Briefcase, Users, ChevronRight } from 'lucide-react';
import { openingsApi } from '../../services/api';
import { Button, Card, Badge, StatusBadge, EmptyState, Spinner, PageHeader, Input } from '../../components/ui';
import type { Opening } from '../../types';

export default function Openings() {
  const navigate = useNavigate();
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load(s = '') {
    setLoading(true);
    try {
      const data = await openingsApi.list({ search: s || undefined });
      setOpenings(data.openings);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title={`Job Openings (${total})`}
        description="Manage roles and AI-generated interview questions"
        action={
          <Button icon={<Plus size={16} />} onClick={() => navigate('/openings/new')}>
            New Opening
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Search openings..."
          icon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : openings.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<Briefcase size={24} />}
            title="No openings yet"
            description="Create your first job opening and let AI generate interview questions."
            action={
              <Button icon={<Plus size={16} />} onClick={() => navigate('/openings/new')}>
                Create Opening
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {openings.map((o) => (
            <Card key={o.id} className="p-5 cursor-pointer" onClick={() => navigate(`/openings/${o.id}`)}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={18} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-surface-900">{o.title}</h3>
                    <StatusBadge status={o.difficulty} />
                    {!o.isActive && <Badge variant="gray">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-500 flex-wrap">
                    {o.department && <span>{o.department}</span>}
                    {o.location && <span>· {o.location}</span>}
                    <span>· {o._count?.questions ?? 0} questions</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {o.skills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="blue">{skill}</Badge>
                    ))}
                    {o.skills.length > 5 && (
                      <Badge variant="gray">+{o.skills.length - 5}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center hidden sm:block">
                    <div className="flex items-center gap-1 text-surface-600 text-sm font-medium">
                      <Users size={14} />
                      {o._count?.candidates ?? 0}
                    </div>
                    <p className="text-xs text-surface-400">candidates</p>
                  </div>
                  <ChevronRight size={18} className="text-surface-300" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
