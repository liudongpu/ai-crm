import { useState } from 'react';
import { useParams } from 'react-router-dom';
import EditOutlined from '@mui/icons-material/EditOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { CommunicationsPanel } from '@/components/common/CommunicationsPanel';
import { Field, FieldGrid } from '@/components/common/Field';
import { NotesPanel } from '@/components/common/NotesPanel';
import { RecordLayout } from '@/components/common/RecordLayout';
import { ErrorState } from '@/components/common/States';
import { useClient, useContact, useContacts } from '@/hooks/useCrm';
import { useTrackVisit } from '@/hooks/useRecent';
import { avatarColor, formatDate, initials } from '@/lib/format';
import { ContactFormDialog } from './ContactsPage';

const tabs = [
  { label: '概览', value: 'overview' },
  { label: '备注', value: 'notes' },
  { label: '沟通记录', value: 'communications' },
];

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const contactId = Number(id);
  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);
  const { data: contact, isLoading, isError, error, refetch } = useContact(contactId);
  const { data: contacts } = useContacts();
  const clientId = contact?.clientId ?? (contacts ?? []).find((item) => item.id === contactId)?.clientId;
  const { data: client } = useClient(clientId ?? undefined);
  useTrackVisit('contact', contactId, contact?.name);

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={220} height={36} />
        <Skeleton variant="rounded" height={160} sx={{ mt: 2 }} />
        <Skeleton variant="rounded" height={280} sx={{ mt: 2 }} />
      </Box>
    );
  }
  if (isError || !contact) {
    return <ErrorState message={error?.message ?? '联系人不存在或加载失败'} onRetry={() => void refetch()} />;
  }

  return (
    <Box>
      <RecordLayout
        crumbs={[{ label: '联系人', to: '/contacts' }, { label: contact.name }]}
        title={contact.name}
        subtitle={contact.position ? `${contact.position} · ${client?.name ?? '未关联客户'}` : client?.name ?? '未关联客户'}
        icon={
          <Avatar sx={{ width: 40, height: 40, fontSize: 13, bgcolor: avatarColor(contact.name) }}>
            {initials(contact.name)}
          </Avatar>
        }
        chips={contact.isPrimary ? <Chip size="small" color="primary" variant="outlined" label="主要联系人" /> : undefined}
        actions={<Button size="small" variant="outlined" startIcon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑联系人</Button>}
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
      >
        {tab === 'overview' && (
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>联系人信息</Typography>
              <FieldGrid columns={3}>
                <Field label="姓名">{contact.name}</Field>
                <Field label="所属客户">{client?.name}</Field>
                <Field label="职位">{contact.position}</Field>
                <Field label="邮箱">{contact.email}</Field>
                <Field label="电话">{contact.phone}</Field>
                <Field label="手机">{contact.mobile}</Field>
                <Field label="主要联系人">{contact.isPrimary ? '是' : '否'}</Field>
                <Field label="创建时间">{formatDate(contact.createdAt)}</Field>
                <Field label="备注" span={3}>{contact.notes}</Field>
              </FieldGrid>
            </CardContent>
          </Card>
        )}
        {tab === 'notes' && <NotesPanel targetType="contact" targetId={contactId} />}
        {tab === 'communications' && <CommunicationsPanel contactId={contactId} clientId={clientId ?? undefined} />}
      </RecordLayout>

      <ContactFormDialog open={editOpen} onClose={() => setEditOpen(false)} contact={contact} />
    </Box>
  );
}
