import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { CommunicationsPanel } from '@/components/common/CommunicationsPanel';
import { PageHeader } from '@/components/common/PageHeader';
import { useClients, useCommunications, useMatters } from '@/hooks/useCrm';
import { communicationTypeMeta } from '@/lib/meta';
import type { CommunicationType } from '@/types';

export function CommunicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState<CommunicationType | ''>('');
  const [matterId, setMatterId] = useState('');
  const [clientId, setClientId] = useState('');
  const [autoOpen, setAutoOpen] = useState(false);
  const { data: matters } = useMatters();
  const { data: clients } = useClients();
  const { data: records } = useCommunications();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setAutoOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <Box>
      <PageHeader title="沟通记录" subtitle={`共 ${records?.length ?? 0} 条沟通记录（邮件、电话、会议、函件等）`} />
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="comm-filter-type">类型</InputLabel>
              <Select labelId="comm-filter-type" label="类型" value={type} onChange={(event) => setType(event.target.value as CommunicationType | '')}>
                <MenuItem value="">全部类型</MenuItem>
                {(Object.keys(communicationTypeMeta) as CommunicationType[]).map((key) => (
                  <MenuItem key={key} value={key}>{communicationTypeMeta[key].label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="comm-filter-matter">关联案件</InputLabel>
              <Select labelId="comm-filter-matter" label="关联案件" value={matterId} onChange={(event) => setMatterId(event.target.value)}>
                <MenuItem value="">全部案件</MenuItem>
                {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="comm-filter-client">关联客户</InputLabel>
              <Select labelId="comm-filter-client" label="关联客户" value={clientId} onChange={(event) => setClientId(event.target.value)}>
                <MenuItem value="">全部客户</MenuItem>
                {(clients ?? []).map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <CommunicationsPanel
            matterId={matterId ? Number(matterId) : undefined}
            clientId={clientId ? Number(clientId) : undefined}
            type={type || undefined}
            autoOpen={autoOpen}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
