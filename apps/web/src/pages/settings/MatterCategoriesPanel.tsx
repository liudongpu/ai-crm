import { useEffect, useMemo, useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState, ErrorState, LoadingPanel } from '@/components/common/States';
import {
  useCreateMatterCategory,
  useDeleteMatterCategory,
  useMatterCategories,
  useMatterStages,
  useMatters,
  useUpdateMatterCategory,
} from '@/hooks/useCrm';
import type { MatterCategory, MatterCategoryInput, MatterCategoryStage } from '@/types';

const toInput = (category: MatterCategory): MatterCategoryInput => ({
  code: category.code,
  name: category.name,
  description: category.description ?? '',
  color: category.color,
  enabled: category.enabled,
  position: category.position,
  stages: category.stages.map((stage) => ({ ...stage })),
});

const emptyForm = { name: '', code: '', color: '#1b365d', description: '', enabled: true };

export function MatterCategoriesPanel() {
  const { data: categories = [], isLoading, isError, error, refetch } = useMatterCategories();
  const { data: matters = [] } = useMatters();
  const { data: systemStages = [] } = useMatterStages();
  const createCategory = useCreateMatterCategory();
  const updateCategory = useUpdateMatterCategory();
  const deleteCategory = useDeleteMatterCategory();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [draft, setDraft] = useState<MatterCategoryInput | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const selected = categories.find((category) => category.id === selectedId) ?? categories[0] ?? null;

  useEffect(() => {
    if (!selected) return;
    setDraft(toInput(selected));
  }, [selected?.id, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(
    () => Boolean(selected && draft && JSON.stringify(draft) !== JSON.stringify(toInput(selected))),
    [selected, draft],
  );
  const stageError = Boolean(draft && (draft.stages.length < 2 || draft.stages.some((stage) => !stage.name.trim())));

  const countOf = (category: MatterCategory) => matters.filter((matter) => matter.practiceArea === category.name).length;

  const select = (category: MatterCategory) => {
    if (category.id === selected?.id) return;
    if (dirty && !window.confirm('当前分类有未保存的改动，确定放弃并切换吗？')) return;
    setSelectedId(category.id);
    setDraft(toInput(category));
  };

  const patchDraft = (patch: Partial<MatterCategoryInput>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const patchStage = (index: number, patch: Partial<MatterCategoryStage>) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        stages: current.stages.map((stage, position) => (position === index ? { ...stage, ...patch } : stage)),
      };
    });
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.stages.length) return current;
      const stages = [...current.stages];
      [stages[index], stages[target]] = [stages[target], stages[index]];
      return { ...current, stages };
    });
  };

  const addStage = () => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        stages: [
          ...current.stages.map((stage) => ({ ...stage, isFinal: false })),
          { name: '新阶段', color: '#94a3b8', probability: 100, isFinal: true },
        ],
      };
    });
  };

  const save = () => {
    if (!selected || !draft || stageError) return;
    updateCategory.mutate(
      { id: selected.id, data: draft },
      { onSuccess: () => { setReloadKey((value) => value + 1); void refetch(); } },
    );
  };

  const submitCreate = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    const payload: MatterCategoryInput = {
      name: form.name.trim(),
      code: form.code.trim().toLowerCase().replace(/\s+/g, '-'),
      color: form.color,
      description: form.description.trim(),
      enabled: form.enabled,
      stages: systemStages.length
        ? systemStages.map((stage) => ({ name: stage.name, color: stage.color, probability: stage.probability, isFinal: stage.isFinal }))
        : [
            { name: '咨询评估', color: '#94a3b8', probability: 10, isFinal: false },
            { name: '办理中', color: '#3b82f6', probability: 60, isFinal: false },
            { name: '已归档', color: '#22c55e', probability: 100, isFinal: true },
          ],
    };
    createCategory.mutate(payload, {
      onSuccess: (created) => {
        const id = (created as MatterCategory | undefined)?.id;
        if (id) setSelectedId(id);
        setFormOpen(false);
        setForm(emptyForm);
        setReloadKey((value) => value + 1);
      },
    });
  };

  const remove = () => {
    if (confirmId === null) return;
    deleteCategory.mutate(confirmId, {
      onSuccess: () => {
        if (selectedId === confirmId) {
          setSelectedId(null);
          setDraft(null);
        }
        setConfirmId(null);
      },
    });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="text.secondary">
          共 {categories.length} 个分类 · 分类名称与案件「业务领域」对应，阶段模板用于新案件的办理流程
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={() => setFormOpen(true)}>新建分类</Button>
      </Stack>

      {isError && <ErrorState message={error?.message ?? '案例分类加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingPanel height={360} />}

      {!isLoading && !isError && categories.length === 0 && (
        <EmptyState title="暂无案例分类" description="点击「新建分类」添加第一个案件分类" />
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
          <Paper variant="outlined" sx={{ width: { xs: '100%', md: 248 }, flexShrink: 0, overflow: 'hidden' }}>
            <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700}>分类列表</Typography>
            </Box>
            <List dense disablePadding>
              {categories.map((category) => (
                <ListItemButton
                  key={category.id}
                  selected={category.id === selected?.id}
                  onClick={() => select(category)}
                  sx={{ borderRadius: 0, '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.main' } }}
                >
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: category.color, mr: 1.25, flexShrink: 0 }} />
                  <ListItemText
                    primary={category.name}
                    secondary={`${countOf(category)} 件案件 · ${category.stages.length} 个阶段`}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  {!category.enabled && <Chip size="small" label="停用" sx={{ ml: 0.5, height: 18, '& .MuiChip-label': { px: 0.5, fontSize: 10 } }} />}
                </ListItemButton>
              ))}
            </List>
          </Paper>

          <Paper variant="outlined" sx={{ flexGrow: 1, minWidth: 0, p: 2 }}>
            {selected && draft && (
              <>
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{selected.name}</Typography>
                  <Chip size="small" variant="outlined" label={`${draft.stages.length} 个阶段`} />
                  {dirty && <Chip size="small" color="warning" variant="outlined" label="未保存" />}
                  <Box sx={{ flexGrow: 1 }} />
                  <Tooltip title="使用系统预置阶段重建流程">
                    <Button
                      size="small"
                      startIcon={<RestartAltOutlined />}
                      onClick={() => patchDraft({ stages: systemStages.map((stage) => ({ name: stage.name, color: stage.color, probability: stage.probability, isFinal: stage.isFinal })) })}
                      disabled={systemStages.length === 0}
                    >
                      使用系统模板
                    </Button>
                  </Tooltip>
                  <Tooltip title="删除该分类">
                    <IconButton size="small" color="error" onClick={() => setConfirmId(selected.id)} aria-label="删除分类"><DeleteOutline fontSize="small" /></IconButton>
                  </Tooltip>
                  <Button size="small" color="inherit" disabled={!dirty} onClick={() => setDraft(toInput(selected))}>取消</Button>
                  <Button size="small" variant="contained" startIcon={<SaveOutlined />} disabled={!dirty || stageError} onClick={save}>保存更改</Button>
                </Stack>

                {stageError && (
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    流程至少需要 2 个阶段，且每个阶段都必须填写名称。
                  </Alert>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2, mb: 2 }}>
                  <TextField label="分类名称" value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} fullWidth size="small" />
                  <TextField label="标识代码" value={draft.code} onChange={(event) => patchDraft({ code: event.target.value })} fullWidth size="small" helperText="英文标识，用于区分分类" />
                  <TextField label="颜色" type="color" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value })} fullWidth size="small" sx={{ '& input': { p: 0.5, height: 34 } }} />
                  <FormControlLabel control={<Switch size="small" checked={draft.enabled !== false} onChange={(event) => patchDraft({ enabled: event.target.checked })} />} label="启用该分类" sx={{ m: 0, alignSelf: 'center' }} />
                  <TextField
                    label="说明"
                    value={draft.description ?? ''}
                    onChange={(event) => patchDraft({ description: event.target.value })}
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    sx={{ gridColumn: { lg: '1 / -1' } }}
                  />
                </Box>

                <Divider sx={{ mb: 1.5 }} />
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>办理流程</Typography>
                  <Typography variant="caption" color="text.secondary">按顺序执行，标记为「结案」的阶段为最后一步</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button size="small" startIcon={<AddOutlined />} onClick={addStage}>新增阶段</Button>
                </Stack>

                <Box sx={{ overflowX: 'auto' }}>
                  <Box sx={{ minWidth: 640 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '68px minmax(160px, 1fr) 64px 80px 80px 40px', gap: 1, px: 0.5, pb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">顺序</Typography>
                      <Typography variant="caption" color="text.secondary">阶段名称</Typography>
                      <Typography variant="caption" color="text.secondary">颜色</Typography>
                      <Typography variant="caption" color="text.secondary">成交概率</Typography>
                      <Typography variant="caption" color="text.secondary">结案阶段</Typography>
                      <Typography variant="caption" color="text.secondary">操作</Typography>
                    </Box>
                    {draft.stages.map((stage, index) => (
                      <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '68px minmax(160px, 1fr) 64px 80px 80px 40px', gap: 1, alignItems: 'center', py: 0.5, borderTop: 1, borderColor: 'divider' }}>
                        <Stack direction="row" spacing={0}>
                          <Tooltip title="上移"><span><IconButton size="small" disabled={index === 0} onClick={() => moveStage(index, -1)} aria-label="上移阶段"><ArrowUpward fontSize="small" /></IconButton></span></Tooltip>
                          <Tooltip title="下移"><span><IconButton size="small" disabled={index === draft.stages.length - 1} onClick={() => moveStage(index, 1)} aria-label="下移阶段"><ArrowDownward fontSize="small" /></IconButton></span></Tooltip>
                        </Stack>
                        <TextField size="small" value={stage.name} onChange={(event) => patchStage(index, { name: event.target.value })} inputProps={{ 'aria-label': `阶段 ${index + 1} 名称` }} />
                        <TextField size="small" type="color" value={stage.color} onChange={(event) => patchStage(index, { color: event.target.value })} sx={{ '& input': { p: 0.5, height: 30 } }} />
                        <TextField
                          size="small"
                          type="number"
                          value={stage.probability}
                          onChange={(event) => patchStage(index, { probability: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })}
                          inputProps={{ min: 0, max: 100, 'aria-label': `阶段 ${index + 1} 成交概率` }}
                        />
                        <Switch
                          size="small"
                          checked={stage.isFinal}
                          onChange={(event) => patchDraft({
                            stages: draft.stages.map((item, position) => ({ ...item, isFinal: position === index ? event.target.checked : false })),
                          })}
                          inputProps={{ 'aria-label': `阶段 ${index + 1} 结案阶段` }}
                        />
                        <Tooltip title="删除阶段">
                          <span>
                            <IconButton size="small" color="error" disabled={draft.stages.length <= 2} onClick={() => patchDraft({ stages: draft.stages.filter((_, position) => position !== index) })} aria-label="删除阶段">
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    ))}
                    {draft.stages.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>暂无阶段，请点击「新增阶段」。</Typography>
                    )}
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  流程模板只影响之后新建的案件；已有案件的阶段与业务领域保持原样。停用分类不会删除历史数据。
                </Alert>
              </>
            )}
          </Paper>
        </Stack>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>新建案例分类</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="分类名称 *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus fullWidth />
          <TextField label="标识代码 *" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} fullWidth helperText="例如 contract / ip / labor" />
          <TextField label="颜色" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} fullWidth sx={{ '& input': { p: 0.5, height: 34 } }} />
          <TextField label="说明" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} fullWidth multiline minRows={2} />
          <FormControlLabel control={<Switch size="small" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />} label="启用该分类" />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setFormOpen(false)}>取消</Button>
          <Button variant="contained" disabled={!form.name.trim() || !form.code.trim() || createCategory.isPending} onClick={submitCreate}>创建</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除案例分类"
        message="确定删除该分类吗？已有案件不会被删除，但会失去分类对应关系。"
        onClose={() => setConfirmId(null)}
        onConfirm={remove}
      />

    </Box>
  );
}
