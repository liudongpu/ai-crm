import { useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/common/States';
import { useToast } from '@/components/common/ToastProvider';
import {
  useCalculateDeadline,
  useCourtHolidays,
  useCourtRules,
  useCreateCourtHoliday,
  useCreateCourtRule,
  useDeadlines,
  useDeleteCourtHoliday,
  useDeleteDeadline,
  useGenerateDeadlineEvents,
  useMatters,
  useUpdateDeadlineStatus,
  useUpdateDeadlineTrigger,
  useUsers,
} from '@/hooks/useCrm';
import { formatDateTime, toDateInput } from '@/lib/format';
import type { CourtRuleStep, DeadlineCalculation, DeadlineStatus } from '@/types';

const statusMeta: Record<DeadlineStatus, { label: string; color: 'default' | 'primary' | 'success' }> = {
  draft: { label: '草稿', color: 'default' },
  confirmed: { label: '已确认', color: 'primary' },
  archived: { label: '已归档', color: 'success' },
};

const isoFromDate = (value: string, endOfDay = false) =>
  value ? new Date(`${value}T${endOfDay ? '23:59:00' : '00:00:00'}`).toISOString() : new Date().toISOString();
const todayInput = () => format(new Date(), 'yyyy-MM-dd');

const defaultSteps: CourtRuleStep[] = [
  { code: 'notice', label: '通知/送达', offsetDays: 0, base: 'trigger' },
  { code: 'reply', label: '答辩期', offsetDays: 15, base: 'notice', businessDays: true },
  { code: 'appeal', label: '上诉期', offsetDays: 10, base: 'reply', businessDays: true },
];

export function DeadlinesPage() {
  const toast = useToast();
  const [status, setStatus] = useState('all');
  const [createMatterId, setCreateMatterId] = useState('');
  const [filterMatterId, setFilterMatterId] = useState('');
  const [ruleId, setRuleId] = useState('');
  const [triggerDate, setTriggerDate] = useState(todayInput);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [expanded, setExpanded] = useState<number[]>([]);
  const [triggerEdits, setTriggerEdits] = useState<Record<number, string>>({});
  const [ruleDialog, setRuleDialog] = useState(false);
  const [holidayDialog, setHolidayDialog] = useState(false);
  const [ruleForm, setRuleForm] = useState({ code: '', name: '', jurisdiction: 'CN', description: '', steps: JSON.stringify(defaultSteps, null, 2) });
  const [holidayForm, setHolidayForm] = useState({ date: todayInput(), name: '' });
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleteHolidayId, setDeleteHolidayId] = useState<number | null>(null);

  const { data: rules, isLoading: rulesLoading } = useCourtRules();
  const { data: holidays } = useCourtHolidays();
  const { data: matters } = useMatters();
  const { data: users } = useUsers();
  const { data: deadlines, isLoading, isError, error, refetch } = useDeadlines({
    status: status === 'all' ? undefined : status,
    matterId: filterMatterId || undefined,
  });

  const calculate = useCalculateDeadline();
  const recalc = useUpdateDeadlineTrigger();
  const updateStatus = useUpdateDeadlineStatus();
  const removeDeadline = useDeleteDeadline();
  const toEvents = useGenerateDeadlineEvents();
  const createRule = useCreateCourtRule();
  const createHoliday = useCreateCourtHoliday();
  const removeHoliday = useDeleteCourtHoliday();

  const submitCalculate = () => {
    if (!ruleId || !triggerDate) {
      toast.warning('请选择规则和触发日期');
      return;
    }
    calculate.mutate(
      {
        ruleId: Number(ruleId),
        triggerDate: isoFromDate(triggerDate),
        matterId: createMatterId ? Number(createMatterId) : null,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        ownerId: ownerId ? Number(ownerId) : null,
      },
      {
        onSuccess: (record) => {
          setExpanded((prev) => [...new Set([...prev, record.id])]);
          setTitle('');
          setNote('');
        },
      },
    );
  };

  const submitRule = () => {
    let steps: CourtRuleStep[];
    try {
      const parsed: unknown = JSON.parse(ruleForm.steps);
      if (!Array.isArray(parsed) || parsed.some((item) => !item || typeof item.code !== 'string' || typeof item.label !== 'string' || typeof item.offsetDays !== 'number')) {
        throw new Error('invalid steps');
      }
      steps = parsed as CourtRuleStep[];
    } catch {
      toast.error('步骤 JSON 格式不正确：需要包含 code、label、offsetDays 的数组');
      return;
    }
    if (!ruleForm.code.trim() || !ruleForm.name.trim()) {
      toast.warning('请填写规则编码和名称');
      return;
    }
    createRule.mutate(
      {
        code: ruleForm.code.trim(),
        name: ruleForm.name.trim(),
        jurisdiction: ruleForm.jurisdiction.trim() || 'CN',
        description: ruleForm.description.trim() || null,
        steps,
      },
      { onSuccess: () => { setRuleDialog(false); setRuleForm({ ...ruleForm, code: '', name: '', description: '' }); } },
    );
  };

  const submitHoliday = () => {
    if (!holidayForm.date || !holidayForm.name.trim()) {
      toast.warning('请填写假期日期和名称');
      return;
    }
    createHoliday.mutate(holidayForm, {
      onSuccess: () => setHolidayForm({ date: todayInput(), name: '' }),
    });
  };

  const toggleExpanded = (id: number) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  const renderRecord = (record: DeadlineCalculation) => {
    const isOpen = expanded.includes(record.id);
    const editValue = triggerEdits[record.id] ?? toDateInput(record.triggerDate);
    return (
      <Card key={record.id} variant="outlined">
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" color="inherit" onClick={() => toggleExpanded(record.id)} startIcon={isOpen ? <ExpandLess /> : <ExpandMore />} />
            <Box sx={{ flex: 1, minWidth: 180 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" fontWeight={700}>{record.title}</Typography>
                <Chip size="small" label={statusMeta[record.status]?.label ?? record.status} color={statusMeta[record.status]?.color ?? 'default'} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {rules?.find((rule) => rule.id === record.ruleId)?.name ?? `规则 #${record.ruleId}`}
                {' · '}触发日 {formatDateTime(record.triggerDate)}
                {record.matterId && ` · ${matters?.find((matter) => matter.id === record.matterId)?.title ?? `案件 #${record.matterId}`}`}
              </Typography>
            </Box>
            <Chip size="small" variant="outlined" label={`${record.items?.length ?? 0} 个节点`} />
          </Stack>

          {isOpen && (
            <Box sx={{ mt: 2 }}>
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                  <TextField
                    size="small"
                    label="触发日期"
                    type="date"
                    value={editValue}
                    onChange={(event) => setTriggerEdits((prev) => ({ ...prev, [record.id]: event.target.value }))}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 180 }}
                  />
                  <Button
                    size="small"
                    startIcon={<RefreshOutlined />}
                    disabled={!editValue || recalc.isPending}
                    onClick={() => recalc.mutate({ id: record.id, triggerDate: isoFromDate(editValue) })}
                  >
                    重新计算
                  </Button>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  {record.status !== 'confirmed' && (
                    <Button size="small" onClick={() => updateStatus.mutate({ id: record.id, status: 'confirmed' })}>确认</Button>
                  )}
                  {record.status !== 'archived' && (
                    <Button size="small" onClick={() => updateStatus.mutate({ id: record.id, status: 'archived' })}>归档</Button>
                  )}
                  {record.status !== 'draft' && (
                    <Button size="small" onClick={() => updateStatus.mutate({ id: record.id, status: 'draft' })}>退回草稿</Button>
                  )}
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<EventAvailableOutlined />}
                    disabled={toEvents.isPending}
                    onClick={() => toEvents.mutate(record.id, { onSuccess: (result) => toast.success(`已生成 ${result.created} 项日程`) })}
                  >
                    生成日程
                  </Button>
                  <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => setConfirmId(record.id)}>删除</Button>
                </Stack>
                {record.note && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>备注：{record.note}</Typography>}
              </Paper>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>节点</TableCell>
                      <TableCell>基准</TableCell>
                      <TableCell align="right">偏移天数</TableCell>
                      <TableCell>计算日期</TableCell>
                      <TableCell>截止日期</TableCell>
                      <TableCell>调整</TableCell>
                      <TableCell>日程状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(record.items ?? []).map((item, index) => (
                      <TableRow key={`${item.code}-${index}`} hover>
                        <TableCell>{item.label}</TableCell>
                        <TableCell>{item.base === 'trigger' ? '触发日' : (record.items?.find((entry) => entry.code === item.base)?.label ?? item.base)}</TableCell>
                        <TableCell align="right">{item.offsetDays}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(item.rawDate)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{formatDateTime(item.dueDate)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {item.adjusted && <Chip size="small" color="warning" variant="outlined" label="已顺延" />}
                            {item.holidayAdjusted && <Chip size="small" color="error" variant="outlined" label="节假日顺延" />}
                            {!item.adjusted && !item.holidayAdjusted && <Typography variant="caption" color="text.secondary">无</Typography>}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {item.taskId
                            ? <Chip size="small" color="success" variant="outlined" label={`已生成 #${item.taskId}`} />
                            : <Typography variant="caption" color="text.secondary">未生成</Typography>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(record.items ?? []).length === 0 && (
                      <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>暂无期限节点</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <PageHeader
        title="期限计算"
        subtitle="按法院规则生成期限链，修改触发日期后重算，并自动跳过周末与法院假期"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setRuleDialog(true)}>规则管理</Button>
            <Button variant="outlined" onClick={() => setHolidayDialog(true)}>节假日管理</Button>
          </Stack>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '340px minmax(0, 1fr)' }, gap: 2, alignItems: 'start' }}>
        <Card>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>新建期限计算</Typography>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="deadline-rule">法院规则 *</InputLabel>
                <Select labelId="deadline-rule" label="法院规则 *" value={ruleId} onChange={(event) => setRuleId(event.target.value)}>
                  <MenuItem value="">请选择规则</MenuItem>
                  {(rules ?? []).filter((rule) => rule.active).map((rule) => (
                    <MenuItem key={rule.id} value={String(rule.id)}>{rule.name}（{rule.code}）</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="触发日期 *"
                type="date"
                value={triggerDate}
                onChange={(event) => setTriggerDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
              />
              <FormControl fullWidth size="small">
                <InputLabel id="deadline-matter">关联案件</InputLabel>
                <Select labelId="deadline-matter" label="关联案件" value={createMatterId} onChange={(event) => setCreateMatterId(event.target.value)}>
                  <MenuItem value="">不关联</MenuItem>
                  {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" label="标题" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="留空则使用规则名称" fullWidth />
              <FormControl fullWidth size="small">
                <InputLabel id="deadline-owner">负责人</InputLabel>
                <Select labelId="deadline-owner" label="负责人" value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
                  <MenuItem value="">未指派</MenuItem>
                  {(users ?? []).map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" label="备注" value={note} onChange={(event) => setNote(event.target.value)} multiline minRows={2} fullWidth />
              <Button variant="contained" startIcon={<AddOutlined />} onClick={submitCalculate} disabled={!ruleId || !triggerDate || calculate.isPending || rulesLoading}>
                计算期限链
              </Button>
              <Typography variant="caption" color="text.secondary">
                当前启用法规则 {rules?.filter((rule) => rule.active).length ?? 0} 条，已登记法院假期 {holidays?.length ?? 0} 天。
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="deadline-status-filter">状态</InputLabel>
              <Select labelId="deadline-status-filter" label="状态" value={status} onChange={(event) => setStatus(event.target.value)}>
                <MenuItem value="all">全部</MenuItem>
                <MenuItem value="draft">草稿</MenuItem>
                <MenuItem value="confirmed">已确认</MenuItem>
                <MenuItem value="archived">已归档</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="deadline-matter-filter">案件</InputLabel>
              <Select labelId="deadline-matter-filter" label="案件" value={filterMatterId} onChange={(event) => setFilterMatterId(event.target.value)}>
                <MenuItem value="">全部案件</MenuItem>
                {(matters ?? []).map((matter) => <MenuItem key={matter.id} value={String(matter.id)}>{matter.title}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

          {isError && <ErrorState message={error?.message ?? '期限记录加载失败'} onRetry={() => void refetch()} />}
          {isLoading && <LoadingPanel height={320} />}
          {!isLoading && !isError && (deadlines ?? []).length === 0 && (
            <EmptyState title="暂无期限计算记录" description="选择规则和触发日期，生成完整的期限链" />
          )}
          <Stack spacing={1.5}>{(deadlines ?? []).map(renderRecord)}</Stack>
        </Box>
      </Box>

      <Dialog open={ruleDialog} onClose={() => setRuleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>法院规则管理</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>编码</TableCell><TableCell>名称</TableCell><TableCell>辖区</TableCell><TableCell align="right">节点数</TableCell><TableCell>启用</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rules ?? []).map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.code}</TableCell>
                    <TableCell>{rule.name}</TableCell>
                    <TableCell>{rule.jurisdiction}</TableCell>
                    <TableCell align="right">{rule.steps?.length ?? 0}</TableCell>
                    <TableCell>{rule.active ? '是' : '否'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider />
          <Typography variant="subtitle2">新增规则</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField size="small" label="编码 *" value={ruleForm.code} onChange={(event) => setRuleForm({ ...ruleForm, code: event.target.value })} />
            <TextField size="small" label="名称 *" value={ruleForm.name} onChange={(event) => setRuleForm({ ...ruleForm, name: event.target.value })} />
            <TextField size="small" label="辖区" value={ruleForm.jurisdiction} onChange={(event) => setRuleForm({ ...ruleForm, jurisdiction: event.target.value })} />
            <TextField size="small" label="说明" value={ruleForm.description} onChange={(event) => setRuleForm({ ...ruleForm, description: event.target.value })} />
          </Box>
          <TextField
            size="small"
            label="期限节点 steps（JSON 数组）"
            value={ruleForm.steps}
            onChange={(event) => setRuleForm({ ...ruleForm, steps: event.target.value })}
            multiline
            minRows={7}
            helperText="字段：code、label、offsetDays、base（trigger 或其他节点 code）、businessDays（是否跳过周末与假期）"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialog(false)}>关闭</Button>
          <Button variant="contained" onClick={submitRule} disabled={createRule.isPending}>保存规则</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={holidayDialog} onClose={() => setHolidayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>法院假期管理</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>日期</TableCell><TableCell>名称</TableCell><TableCell>辖区</TableCell><TableCell align="right">操作</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {(holidays ?? []).map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>{holiday.date}</TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell>{holiday.jurisdiction}</TableCell>
                    <TableCell align="right">
                      <Button size="small" color="error" onClick={() => setDeleteHolidayId(holiday.id)}>删除</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(holidays ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>暂无假期记录</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider />
          <Typography variant="subtitle2">新增假期</Typography>
          <TextField
            size="small"
            label="日期 *"
            type="date"
            value={holidayForm.date}
            onChange={(event) => setHolidayForm({ ...holidayForm, date: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />
          <TextField size="small" label="名称 *" value={holidayForm.name} onChange={(event) => setHolidayForm({ ...holidayForm, name: event.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHolidayDialog(false)}>关闭</Button>
          <Button variant="contained" onClick={submitHoliday} disabled={createHoliday.isPending}>新增假期</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除期限计算记录"
        message="确定删除该期限计算记录吗？已生成的日程不会被删除。"
        onClose={() => setConfirmId(null)}
        onConfirm={() => { if (confirmId !== null) removeDeadline.mutate(confirmId, { onSuccess: () => setConfirmId(null) }); }}
      />
      <ConfirmDialog
        open={deleteHolidayId !== null}
        title="删除法院假期"
        message="确定删除该假期吗？删除后期限计算将不再跳过此日期。"
        onClose={() => setDeleteHolidayId(null)}
        onConfirm={() => { if (deleteHolidayId !== null) removeHoliday.mutate(deleteHolidayId, { onSuccess: () => setDeleteHolidayId(null) }); }}
      />
    </Box>
  );
}
