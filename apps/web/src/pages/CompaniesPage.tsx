import { useEffect, useMemo, useState } from 'react';
import { Building2, Globe2, Mail, MapPin, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanies, useContacts, useCreateCompany, useDeals, useDeleteCompany, useUpdateCompany } from '@/hooks/useCrm';
import { avatarColor, formatCurrency, initials } from '@/lib/utils';
import type { Company, CompanyInput } from '@/types';

export function CompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyInput>({ name: '' });

  const { data: companies, isLoading } = useCompanies();
  const { data: contacts } = useContacts();
  const { data: deals } = useDeals();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return companies ?? [];
    return (companies ?? []).filter((company) =>
      [company.name, company.industry, company.website].filter(Boolean).some((value) => value!.toLowerCase().includes(keyword)),
    );
  }, [companies, search]);

  const stats = useMemo(() => {
    const map = new Map<number, { contacts: number; deals: number; value: number }>();
    for (const company of companies ?? []) map.set(company.id, { contacts: 0, deals: 0, value: 0 });
    for (const contact of contacts ?? []) {
      if (contact.companyId && map.has(contact.companyId)) map.get(contact.companyId)!.contacts += 1;
    }
    for (const deal of deals ?? []) {
      if (deal.companyId && map.has(deal.companyId)) {
        const entry = map.get(deal.companyId)!;
        entry.deals += 1;
        entry.value += deal.value;
      }
    }
    return map;
  }, [companies, contacts, deals]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', industry: '', website: '', phone: '', address: '' });
    setFormOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditing(company);
    setForm({
      name: company.name,
      industry: company.industry ?? '',
      website: company.website ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
    });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.name?.trim()) {
      toast.error('请填写公司名称');
      return;
    }
    const payload = { ...form, name: form.name.trim() };
    if (editing) {
      updateCompany.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createCompany.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">客户公司</h2>
          <p className="text-xs text-muted-foreground">共 {companies?.length ?? 0} 家公司</p>
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索公司、行业..." className="pl-9" />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> 新公司</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-52 rounded-xl" />)}
        {filtered.map((company) => {
          const stat = stats.get(company.id);
          return (
            <Card key={company.id} className="group transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold ${avatarColor(company.name)}`}>
                    {initials(company.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{company.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{company.industry ?? '未填写行业'}</p>
                  </div>
                  <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(company)} title="编辑">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (window.confirm(`确定删除公司「${company.name}」吗？`)) deleteCompany.mutate(company.id);
                      }}
                      title="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted/60 p-2.5">
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Users className="h-3 w-3" />联系人</p>
                    <p className="mt-0.5 text-lg font-semibold">{stat?.contacts ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-2.5">
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Building2 className="h-3 w-3" />交易</p>
                    <p className="mt-0.5 text-lg font-semibold">{stat?.deals ?? 0}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 truncate"><Globe2 className="h-3.5 w-3.5 shrink-0" />{company.website ?? '未填写网站'}</div>
                  <div className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{company.phone ?? '未填写电话'}</div>
                  <div className="flex items-center gap-2 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" />{company.address ?? '未填写地址'}</div>
                </div>

                {!!stat?.value && (
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="success">交易金额</Badge>
                    <span className="text-sm font-semibold">{formatCurrency(stat.value, true)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
            没有找到公司，点击「新公司」添加一家吧。
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑公司' : '新建公司'}</DialogTitle>
            <DialogDescription>记录客户公司的基本信息。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="company-name">公司名称 *</Label>
              <Input id="company-name" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-industry">行业</Label>
              <Input id="company-industry" value={form.industry ?? ''} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-phone">电话</Label>
              <Input id="company-phone" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="company-website">网站</Label>
              <Input id="company-website" value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="example.com" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="company-address">地址</Label>
              <Input id="company-address" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={submit} disabled={createCompany.isPending || updateCompany.isPending}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
