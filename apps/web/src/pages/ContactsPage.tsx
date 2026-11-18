import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Building2, Mail, Phone, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCompanies,
  useContacts,
  useCreateContact,
  useDeleteContact,
  useUpdateContact,
} from '@/hooks/useCrm';
import { avatarColor, initials } from '@/lib/utils';
import type { Contact, ContactInput } from '@/types';

export function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactInput>({ name: '' });

  const { data: contacts, isLoading } = useContacts();
  const { data: companies } = useCompanies();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), companies]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return contacts ?? [];
    return (contacts ?? []).filter((contact) =>
      [contact.name, contact.email, contact.phone, contact.company?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword)),
    );
  }, [contacts, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', position: '', companyId: null, owner: '销售团队' });
    setFormOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setSelected(null);
    setEditing(contact);
    setForm({
      name: contact.name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      position: contact.position ?? '',
      companyId: contact.companyId,
      owner: contact.owner,
    });
    setFormOpen(true);
  };

  const submit = () => {
    if (!form.name?.trim()) {
      toast.error('请填写联系人姓名');
      return;
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email || null,
      phone: form.phone || null,
      position: form.position || null,
    };
    if (editing) {
      updateContact.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) });
    } else {
      createContact.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">全部联系人</h2>
          <p className="text-xs text-muted-foreground">共 {contacts?.length ?? 0} 位联系人</p>
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索姓名、邮箱、公司..." className="pl-9" />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> 新联系人</Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">联系人</th>
              <th className="px-4 py-3 text-left font-medium">职位</th>
              <th className="px-4 py-3 text-left font-medium">公司</th>
              <th className="px-4 py-3 text-left font-medium">联系方式</th>
              <th className="px-4 py-3 text-left font-medium">负责人</th>
              <th className="px-4 py-3 text-left font-medium">添加时间</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-8 w-full" /></td></tr>
              ))}
            {filtered.map((contact) => (
              <tr key={contact.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(contact)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className={avatarColor(contact.name)}>{initials(contact.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{contact.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{contact.position ?? '-'}</td>
                <td className="px-4 py-3">
                  {contact.company ? <Badge variant="outline">{contact.company.name}</Badge> : <span className="text-muted-foreground">-</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{contact.email ?? '-'}</div>
                    <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{contact.phone ?? '-'}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{contact.owner}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{format(parseISO(contact.createdAt), 'yyyy-MM-dd')}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (window.confirm(`确定删除联系人「${contact.name}」吗？`)) deleteContact.mutate(contact.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">没有找到联系人</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑联系人' : '新建联系人'}</DialogTitle>
            <DialogDescription>完善联系人信息，方便后续跟进。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">姓名 *</Label>
              <Input id="contact-name" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-position">职位</Label>
              <Input id="contact-position" value={form.position ?? ''} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">邮箱</Label>
              <Input id="contact-email" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">电话</Label>
              <Input id="contact-phone" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>所属公司</Label>
              <Select value={form.companyId ? String(form.companyId) : 'none'} onValueChange={(value) => setForm({ ...form, companyId: value === 'none' ? null : Number(value) })}>
                <SelectTrigger><SelectValue placeholder="选择公司" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未关联</SelectItem>
                  {companies?.map((company) => <SelectItem key={company.id} value={String(company.id)}>{company.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={submit} disabled={createContact.isPending || updateContact.isPending}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={avatarColor(selected.name)}>{initials(selected.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selected.name}</DialogTitle>
                    <DialogDescription>{selected.position ?? '联系人'} · {selected.company?.name ?? '未关联公司'}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-3 rounded-lg border p-4 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selected.email ?? '-'}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selected.phone ?? '-'}</div>
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{selected.company?.industry ?? '未填写行业'}</div>
                <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-muted-foreground" />负责人：{selected.owner}</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>关闭</Button>
                <Button onClick={() => openEdit(selected)}>编辑资料</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
