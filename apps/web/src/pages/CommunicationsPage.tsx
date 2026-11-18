import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ChatOutlined from '@mui/icons-material/ChatOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import ReplyOutlined from '@mui/icons-material/ReplyOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/States';
import {
  useAiDraft,
  useArchiveConversation,
  useClients,
  useCommunications,
  useCreateCommunication,
  useCreateMessageTemplate,
  useDeleteMessageTemplate,
  useInbox,
  useMarkCommunicationRead,
  useMarkCommunicationReplied,
  useMatters,
  useMessageTemplates,
  useToggleCommunicationFollowUp,
  useUpdateMessageTemplate,
  useUsers,
} from '@/hooks/useCrm';
import { avatarColor, formatDateTime, formatShortDate, initials } from '@/lib/format';
import { communicationTypeMeta } from '@/lib/meta';
import type {
  Communication,
  CommunicationDirection,
  CommunicationInput,
  CommunicationType,
  MessageTemplate,
} from '@/types';

type InboxFilter = 'all' | 'unread' | 'unreplied' | 'follow_up';

const CHANNEL_TYPES = Object.keys(communicationTypeMeta) as CommunicationType[];

export function CommunicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const { data: inbox = [], isLoading: inboxLoading } = useInbox();
  const { data: matters = [] } = useMatters();
  const { data: clients = [] } = useClients();
  const { data: users = [] } = useUsers();
  const { data: templates = [] } = useMessageTemplates();
  const { data: thread = [], isLoading: threadLoading } = useCommunications({
    conversationKey: selectedKey ?? '__none__',
  });

  const archiveConversation = useArchiveConversation();
  const markRead = useMarkCommunicationRead();
  const markReplied = useMarkCommunicationReplied();
  const toggleFollowUp = useToggleCommunicationFollowUp();
  const aiDraft = useAiDraft();
  const createCommunication = useCreateCommunication();
  const createTemplate = useCreateMessageTemplate();
  const updateTemplate = useUpdateMessageTemplate();
  const deleteTemplate = useDeleteMessageTemplate();

  // 打开 ?new=1 时弹出新建沟通窗口。
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setNewOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const totalUnread = useMemo(() => inbox.reduce((sum, c) => sum + c.unread, 0), [inbox]);
  const totalUnreplied = useMemo(() => inbox.reduce((sum, c) => sum + c.unreplied, 0), [inbox]);
  const totalFollowUp = useMemo(() => inbox.reduce((sum, c) => sum + c.needsFollowUp, 0), [inbox]);

  const filteredInbox = useMemo(() => {
    let list = inbox;
    if (filter === 'unread') list = list.filter((c) => c.unread > 0);
    if (filter === 'unreplied') list = list.filter((c) => c.unreplied > 0);
    if (filter === 'follow_up') list = list.filter((c) => c.needsFollowUp > 0);
    if (search.trim()) {
      const keyword = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.clientName ?? '').toLowerCase().includes(keyword) ||
          (c.matterTitle ?? '').toLowerCase().includes(keyword) ||
          c.lastMessage.toLowerCase().includes(keyword),
      );
    }
    return list;
  }, [inbox, filter, search]);

  const selected = useMemo(() => inbox.find((c) => c.key === selectedKey) ?? null, [inbox, selectedKey]);

  // 选中会话后自动将未读消息标记为已读（用 ref 防止重复触发）。
  const markedRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const unread = thread.filter((m) => m.direction === 'inbound' && m.unread && !markedRef.current.has(m.id));
    for (const message of unread) {
      markedRef.current.add(message.id);
      markRead.mutate(message.id);
    }
  }, [thread, markRead]);

  const handleSelect = (key: string) => {
    setSelectedKey(key);
  };

  return (
    <Box>
      <PageHeader
        title="沟通中心"
        subtitle={`统一收件箱 · ${inbox.length} 个会话 · ${totalUnread} 条未读 · ${totalUnreplied} 条 24 小时未回复 · ${totalFollowUp} 条需跟进`}
        actions={
          <>
            <Button size="small" variant="outlined" startIcon={<DescriptionOutlined />} onClick={() => setTemplatesOpen(true)}>
              消息模板
            </Button>
            <Button size="small" variant="contained" startIcon={<AddOutlined />} onClick={() => setNewOpen(true)}>
              新建沟通
            </Button>
          </>
        }
      />

      <Tabs value={filter} onChange={(_, value) => setFilter(value as InboxFilter)} sx={{ mb: 2, minHeight: 40 }}>
        <Tab value="all" label={`全部 ${inbox.length}`} />
        <Tab value="unread" label={`未读 ${totalUnread}`} />
        <Tab value="unreplied" label={`24h 未回复 ${totalUnreplied}`} />
        <Tab value="follow_up" label={`需跟进 ${totalFollowUp}`} />
      </Tabs>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '320px 1fr' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        {/* 左：会话列表 */}
        <Paper variant="outlined" sx={{ minHeight: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="搜索客户 / 案件 / 消息"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            />
          </Box>
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            {inboxLoading && (
              <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>
            )}
            {!inboxLoading && filteredInbox.length === 0 && (
              <Box sx={{ p: 2 }}><EmptyState title="暂无会话" description="初次使用请新建一条沟通记录。" /></Box>
            )}
            {filteredInbox.map((conversation) => (
              <Box
                key={conversation.key}
                onClick={() => handleSelect(conversation.key)}
                sx={{
                  px: 1.5,
                  py: 1.25,
                  cursor: 'pointer',
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: selectedKey === conversation.key ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Badge color="error" badgeContent={conversation.unread} max={9}>
                    <Avatar sx={{ width: 38, height: 38, bgcolor: avatarColor(conversation.clientName), fontSize: 14 }}>
                      {initials(conversation.clientName ?? '未')}
                    </Avatar>
                  </Badge>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={0.5}>
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: conversation.unread ? 700 : 500 }}>
                        {conversation.clientName ?? '未分配客户'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {formatShortDate(conversation.lastAt)}
                      </Typography>
                    </Stack>
                    {conversation.matterTitle && (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {conversation.matterTitle}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {conversation.lastMessage}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                      {conversation.channels.map((channel) => (
                        <Chip
                          key={channel}
                          size="small"
                          variant="outlined"
                          label={communicationTypeMeta[channel as CommunicationType]?.label ?? channel}
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      ))}
                      {conversation.needsFollowUp > 0 && <Chip size="small" color="warning" label="需跟进" sx={{ height: 18, fontSize: 10 }} />}
                      {conversation.unreplied > 0 && <Chip size="small" color="error" label="未回复" sx={{ height: 18, fontSize: 10 }} />}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* 右：会话详情 + 回复 */}
        <Paper variant="outlined" sx={{ minHeight: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                title="选择一个会话"
                description="从左侧会话列表选择客户，查看完整沟通记录并回复。"
                action={<Button variant="outlined" startIcon={<ChatOutlined />} onClick={() => setNewOpen(true)}>新建沟通</Button>}
              />
            </Box>
          ) : (
            <>
              <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{selected.clientName ?? '未分配客户'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selected.matterTitle ? `案件：${selected.matterTitle} · ` : ''}共 {selected.count} 条消息
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  {!selected.matterId && (
                    <Tooltip title="归档到案件">
                      <Button size="small" variant="outlined" startIcon={<ArchiveOutlined />} onClick={() => setArchiveOpen(true)}>
                        归档到案件
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip title="标记需跟进">
                    <IconButton size="small" color={selected.needsFollowUp ? 'warning' : 'default'} onClick={() => thread[0] && toggleFollowUp.mutate(thread[0].id)}>
                      <FlagOutlined />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#fafbfc' }}>
                {threadLoading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></Box>}
                <Stack spacing={1.5}>
                  {[...thread].reverse().map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      users={users}
                      onMarkReplied={() => markReplied.mutate(message.id)}
                      onToggleFollowUp={() => toggleFollowUp.mutate(message.id)}
                    />
                  ))}
                </Stack>
              </Box>

              <ReplyComposer
                selectedKey={selected.key}
                matterId={selected.matterId}
                clientId={selected.clientId}
                clientName={selected.clientName}
                templates={templates}
                users={users}
                aiDraft={aiDraft}
                onSubmit={(input) => createCommunication.mutate(input)}
                submitting={createCommunication.isPending}
              />
            </>
          )}
        </Paper>
      </Box>

      <TemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        templates={templates}
        onCreate={(data) => createTemplate.mutate(data)}
        onUpdate={(id, data) => updateTemplate.mutate({ id, data })}
        onDelete={(id) => deleteTemplate.mutate(id)}
      />
      <ArchiveDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        conversationKey={selectedKey}
        matters={matters}
        onArchive={(matterId, clientId) => {
          if (selectedKey) {
            archiveConversation.mutate(
              { conversationKey: selectedKey, matterId, clientId },
              { onSuccess: () => setArchiveOpen(false) },
            );
          }
        }}
      />
      <NewCommunicationDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        clients={clients}
        matters={matters}
        users={users}
        templates={templates}
        onSubmit={(input) => createCommunication.mutate(input, { onSuccess: () => setNewOpen(false) })}
        submitting={createCommunication.isPending}
      />
    </Box>
  );
}

/* ------------------------------ 消息气泡 ------------------------------ */

function MessageBubble({
  message,
  users,
  onMarkReplied,
  onToggleFollowUp,
}: {
  message: Communication;
  users: Array<{ id: number; name: string }>;
  onMarkReplied: () => void;
  onToggleFollowUp: () => void;
}) {
  const outbound = message.direction === 'outbound';
  const isInternal = message.internal || message.type === 'internal';
  const author = users.find((user) => user.id === message.userId)?.name;
  return (
    <Box sx={{ display: 'flex', justifyContent: outbound ? 'flex-end' : 'flex-start' }}>
      <Box
        sx={{
          maxWidth: { xs: '92%', sm: '72%' },
          px: 1.5,
          py: 1,
          borderRadius: 2,
          borderTopLeftRadius: outbound ? 16 : 4,
          borderTopRightRadius: outbound ? 4 : 16,
          bgcolor: isInternal ? '#fff4e5' : outbound ? '#1b365d' : '#fff',
          color: isInternal ? 'text.primary' : outbound ? '#fff' : 'text.primary',
          border: isInternal || outbound ? 'none' : '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={communicationTypeMeta[message.type]?.label ?? message.type}
            sx={{ height: 18, fontSize: 10, bgcolor: isInternal || outbound ? 'rgba(255,255,255,.2)' : undefined, color: isInternal || outbound ? 'inherit' : undefined }}
          />
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {message.senderName ?? author ?? (outbound ? '我方' : '客户')} · {formatDateTime(message.occurredAt)}
          </Typography>
          {message.unread && !outbound && <Chip size="small" color="error" label="未读" sx={{ height: 18, fontSize: 10 }} />}
          {message.aiDraft && <Chip size="small" color="info" label="AI 草稿" sx={{ height: 18, fontSize: 10 }} />}
          {message.needsFollowUp && <Chip size="small" color="warning" label="需跟进" sx={{ height: 18, fontSize: 10 }} />}
        </Stack>
        {message.subject && (
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>{message.subject}</Typography>
        )}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} justifyContent={outbound ? 'flex-end' : 'flex-start'}>
          {!outbound && !message.replied && !isInternal && (
            <Button size="small" startIcon={<ReplyOutlined />} onClick={onMarkReplied} sx={{ minWidth: 0, color: 'inherit' }}>
              标记已回复
            </Button>
          )}
          <Button size="small" startIcon={<FlagOutlined />} onClick={onToggleFollowUp} sx={{ minWidth: 0, color: 'inherit' }}>
            {message.needsFollowUp ? '取消跟进' : '需跟进'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

/* ------------------------------ 回复输入 ------------------------------ */

function ReplyComposer({
  selectedKey,
  matterId,
  clientId,
  clientName,
  templates,
  users,
  aiDraft,
  onSubmit,
  submitting,
}: {
  selectedKey: string;
  matterId: number | null;
  clientId: number | null;
  clientName: string | null;
  templates: MessageTemplate[];
  users: Array<{ id: number; name: string }>;
  aiDraft: ReturnType<typeof useAiDraft>;
  onSubmit: (input: CommunicationInput) => void;
  submitting: boolean;
}) {
  const [mode, setMode] = useState<'reply' | 'internal'>('reply');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [channel, setChannel] = useState<CommunicationType>('email');
  const [templateId, setTemplateId] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiConfirmed, setAiConfirmed] = useState(false);

  useEffect(() => {
    setContent('');
    setSubject('');
    setAiGenerated(false);
    setAiConfirmed(false);
    setTemplateId('');
  }, [selectedKey]);

  const currentUserId = users[0]?.id ?? null;

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const template = templates.find((item) => String(item.id) === id);
    if (template) setContent(template.content);
  };

  const generateDraft = () => {
    aiDraft.mutate(
      { matterId: matterId ?? undefined, intent: subject || '案件进展' },
      {
        onSuccess: (data) => {
          setContent(data.content);
          setAiGenerated(true);
          setAiConfirmed(false);
        },
      },
    );
  };

  const submit = () => {
    // AI 草稿必须人工确认后才允许发送（AT-08）。
    if (!content.trim() || (aiGenerated && !aiConfirmed)) return;
    const payload: CommunicationInput = {
      matterId: matterId ?? null,
      clientId: clientId ?? null,
      type: mode === 'internal' ? 'internal' : channel,
      direction: 'outbound',
      subject: subject.trim() || null,
      content: content.trim(),
      occurredAt: new Date().toISOString(),
      userId: currentUserId,
      conversationKey: selectedKey,
      internal: mode === 'internal',
      replied: mode !== 'internal',
      unread: false,
      aiDraft: aiGenerated,
      approved: aiGenerated ? aiConfirmed : true,
      templateId: templateId ? Number(templateId) : null,
    };
    onSubmit(payload);
    setContent('');
    setSubject('');
    setAiGenerated(false);
    setAiConfirmed(false);
    setTemplateId('');
  };

  return (
    <Box sx={{ borderTop: 1, borderColor: 'divider', p: 1.5 }}>
      {aiGenerated && (
        <Alert
          severity={aiConfirmed ? 'success' : 'info'}
          sx={{ mb: 1 }}
          action={
            <Button size="small" color="inherit" onClick={() => setAiConfirmed(true)} disabled={aiConfirmed}>
              {aiConfirmed ? '已确认' : '我已核对内容'}
            </Button>
          }
        >
          {aiConfirmed ? 'AI 草稿已人工确认，可以发送。' : 'AI 草稿仅供参考，请人工核对内容并点击确认后再发送。'}
        </Alert>
      )}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, value) => value && setMode(value)}>
          <ToggleButton value="reply">回复客户</ToggleButton>
          <ToggleButton value="internal">内部备注</ToggleButton>
        </ToggleButtonGroup>
        {mode === 'reply' && (
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel id="reply-channel">渠道</InputLabel>
            <Select labelId="reply-channel" label="渠道" value={channel} onChange={(event) => setChannel(event.target.value as CommunicationType)}>
              {CHANNEL_TYPES.filter((type) => type !== 'internal').map((type) => (
                <MenuItem key={type} value={type}>{communicationTypeMeta[type].label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {mode === 'reply' && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="reply-template">模板</InputLabel>
            <Select labelId="reply-template" label="模板" value={templateId} onChange={(event) => applyTemplate(event.target.value)}>
              <MenuItem value="">不使用模板</MenuItem>
              {templates.filter((item) => item.enabled).map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {mode === 'reply' && (
          <Button size="small" startIcon={<AutoAwesomeOutlined />} onClick={generateDraft} disabled={aiDraft.isPending}>
            {aiDraft.isPending ? '起草中…' : 'AI 起草'}
          </Button>
        )}
      </Stack>
      <TextField
        size="small"
        fullWidth
        placeholder="主题（可选）"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        sx={{ mb: 1 }}
      />
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={2}
        placeholder={mode === 'internal' ? '输入团队内部备注（客户不可见）…' : `回复 ${clientName ?? '客户'}…`}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendOutlined />}
          onClick={submit}
          disabled={!content.trim() || submitting || (aiGenerated && !aiConfirmed)}
        >
          {mode === 'internal' ? '保存备注' : '发送回复'}
        </Button>
      </Stack>
    </Box>
  );
}

/* ------------------------------ 模板管理 ------------------------------ */

function TemplatesDialog({
  open,
  onClose,
  templates,
  onCreate,
  onUpdate,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  templates: MessageTemplate[];
  onCreate: (data: Partial<MessageTemplate>) => void;
  onUpdate: (id: number, data: Partial<MessageTemplate>) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState({ code: '', name: '', category: '通用', content: '', enabled: true });

  useEffect(() => {
    if (!open) return;
    setEditing(null);
    setForm({ code: '', name: '', category: '通用', content: '', enabled: true });
  }, [open]);

  const openEdit = (template: MessageTemplate) => {
    setEditing(template);
    setForm({ code: template.code, name: template.name, category: template.category, content: template.content, enabled: template.enabled });
  };

  const submit = () => {
    if (!form.name.trim() || !form.content.trim()) return;
    const payload: Partial<MessageTemplate> = { ...form, code: form.code.trim() || `custom_${Date.now()}` };
    if (editing) onUpdate(editing.id, payload);
    else onCreate(payload);
    setEditing(null);
    setForm({ code: '', name: '', category: '通用', content: '', enabled: true });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>消息模板管理</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>已有模板（{templates.length}）</Typography>
            <Stack spacing={1}>
              {templates.map((template) => (
                <Paper key={template.id} variant="outlined" sx={{ p: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{template.name} <Chip size="small" label={template.category} sx={{ height: 18, fontSize: 10 }} /></Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">{template.content}</Typography>
                    </Box>
                    <Stack direction="row">
                      <Tooltip title="编辑"><IconButton size="small" onClick={() => openEdit(template)}><DescriptionOutlined fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="删除"><IconButton size="small" color="error" onClick={() => onDelete(template.id)}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle2">{editing ? '编辑模板' : '新增模板'}</Typography>
            <TextField size="small" label="名称" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} fullWidth />
            <TextField size="small" label="标识（英文，可选）" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} fullWidth disabled={!!editing} />
            <TextField size="small" label="分类" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} fullWidth />
            <TextField size="small" label="内容（可用 {案件名称} 等占位符）" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} multiline minRows={4} fullWidth />
            <FormControlLabelSwitch checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {editing && <Button size="small" color="inherit" onClick={() => setEditing(null)}>取消编辑</Button>}
              <Button size="small" variant="contained" onClick={submit} disabled={!form.name.trim() || !form.content.trim()}>保存模板</Button>
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions><Button onClick={onClose} color="inherit">关闭</Button></DialogActions>
    </Dialog>
  );
}

function FormControlLabelSwitch({ checked, onChange }: { checked: boolean; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <input type="checkbox" checked={checked} onChange={onChange} aria-label="启用模板" />
      <Typography variant="body2">启用该模板</Typography>
    </Stack>
  );
}

/* ------------------------------ 归档对话框 ------------------------------ */

function ArchiveDialog({
  open,
  onClose,
  conversationKey,
  matters,
  onArchive,
}: {
  open: boolean;
  onClose: () => void;
  conversationKey: string | null;
  matters: Array<{ id: number; title: string; clientId?: number }>;
  onArchive: (matterId: number, clientId?: number) => void;
}) {
  const [matterId, setMatterId] = useState('');
  useEffect(() => { if (open) setMatterId(''); }, [open]);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>归档到案件</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          选择会话（{conversationKey ?? '—'}）要归档到的案件，之后可在案件详情中查看完整沟通记录。
        </Typography>
        <FormControl fullWidth>
          <InputLabel id="archive-matter">目标案件</InputLabel>
          <Select labelId="archive-matter" label="目标案件" value={matterId} onChange={(event) => setMatterId(event.target.value)}>
            {matters.map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button variant="contained" onClick={() => matterId && onArchive(Number(matterId))} disabled={!matterId}>归档</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ------------------------------ 新建沟通 ------------------------------ */

function NewCommunicationDialog({
  open,
  onClose,
  clients,
  matters,
  users,
  templates,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  clients: Array<{ id: number; name: string; contactName?: string | null }>;
  matters: Array<{ id: number; title: string; clientId?: number }>;
  users: Array<{ id: number; name: string }>;
  templates: MessageTemplate[];
  onSubmit: (input: CommunicationInput) => void;
  submitting: boolean;
}) {
  const empty = {
    clientId: '', matterId: '', type: 'email' as CommunicationType, direction: 'outbound' as CommunicationDirection,
    subject: '', content: '', templateId: '', userId: '',
  };
  const [form, setForm] = useState(empty);
  useEffect(() => { if (open) setForm(empty); }, [open]);

  const filteredMatters = form.clientId ? matters.filter((m) => m.clientId === Number(form.clientId)) : matters;

  const submit = () => {
    if (!form.content.trim() || !form.clientId) return;
    const clientId = Number(form.clientId);
    onSubmit({
      matterId: form.matterId ? Number(form.matterId) : null,
      clientId,
      type: form.type,
      direction: form.direction,
      subject: form.subject.trim() || null,
      content: form.content.trim(),
      occurredAt: new Date().toISOString(),
      userId: form.userId ? Number(form.userId) : (users[0]?.id ?? null),
      conversationKey: form.matterId ? `matter:${form.matterId}` : `client:${clientId}`,
      unread: false,
      replied: form.direction === 'outbound',
      templateId: form.templateId ? Number(form.templateId) : null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新建沟通记录</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <FormControl fullWidth>
          <InputLabel id="new-client">客户 *</InputLabel>
          <Select labelId="new-client" label="客户 *" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value, matterId: '' })}>
            {clients.map((client) => <MenuItem key={client.id} value={String(client.id)}>{client.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="new-matter">关联案件</InputLabel>
          <Select labelId="new-matter" label="关联案件" value={form.matterId} onChange={(event) => setForm({ ...form, matterId: event.target.value })}>
            <MenuItem value="">不关联案件</MenuItem>
            {filteredMatters.map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="new-type">类型</InputLabel>
            <Select labelId="new-type" label="类型" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CommunicationType })}>
              {CHANNEL_TYPES.map((type) => <MenuItem key={type} value={type}>{communicationTypeMeta[type].label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="new-direction">方向</InputLabel>
            <Select labelId="new-direction" label="方向" value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value as CommunicationDirection })}>
              <MenuItem value="outbound">发出</MenuItem>
              <MenuItem value="inbound">收到</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <FormControl fullWidth>
          <InputLabel id="new-template">使用模板</InputLabel>
          <Select labelId="new-template" label="使用模板" value={form.templateId} onChange={(event) => {
            const id = event.target.value;
            const template = templates.find((item) => String(item.id) === id);
            setForm({ ...form, templateId: id, content: template ? template.content : form.content });
          }}>
            <MenuItem value="">不使用模板</MenuItem>
            {templates.filter((item) => item.enabled).map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="主题" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} fullWidth />
        <TextField size="small" label="内容 *" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} multiline minRows={3} fullWidth />
        <FormControl fullWidth>
          <InputLabel id="new-user">记录人</InputLabel>
          <Select labelId="new-user" label="记录人" value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })}>
            <MenuItem value="">默认（当前用户）</MenuItem>
            {users.map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button variant="contained" onClick={submit} disabled={!form.content.trim() || !form.clientId || submitting}>保存</Button>
      </DialogActions>
    </Dialog>
  );
}
