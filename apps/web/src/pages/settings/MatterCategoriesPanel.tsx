import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DragIndicator from '@mui/icons-material/DragIndicator';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
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
import type { MatterCategory, MatterCategoryInput, MatterCategoryStage, MatterStageTask } from '@/types';

type SystemStage = { name: string; color: string; probability: number; isFinal: boolean };

const emptyForm = { name: '', code: '', color: '#1b365d', description: '', enabled: true };

/** 兼容旧流程数据：补齐停留时长与阶段任务。 */
function normalizeStage(stage: MatterCategoryStage): MatterCategoryStage {
  return {
    name: stage.name ?? '',
    color: stage.color ?? '#94a3b8',
    probability: stage.probability ?? 0,
    isFinal: Boolean(stage.isFinal),
    durationDays: typeof stage.durationDays === 'number' && Number.isFinite(stage.durationDays) ? stage.durationDays : 7,
    tasks: Array.isArray(stage.tasks)
      ? stage.tasks.map((task) => ({
          name: task.name ?? '',
          dueDay: typeof task.dueDay === 'number' && Number.isFinite(task.dueDay) ? task.dueDay : 0,
          skippable: Boolean(task.skippable),
        }))
      : [],
  };
}

const fromSystemStages = (stages: SystemStage[]): MatterCategoryStage[] =>
  stages.map((stage) => ({
    ...stage,
    durationDays: 7,
    tasks: [{ name: `${stage.name}启动确认`, dueDay: 1, skippable: false }],
  }));

const newStage = (isFinal = false): MatterCategoryStage => ({
  name: '新阶段',
  color: '#94a3b8',
  probability: 0,
  isFinal,
  durationDays: 7,
  tasks: [],
});

const newTask = (): MatterStageTask => ({ name: '新任务', dueDay: 1, skippable: false });

const toInput = (category: MatterCategory): MatterCategoryInput => ({
  code: category.code,
  name: category.name,
  description: category.description ?? '',
  color: category.color,
  enabled: category.enabled,
  position: category.position,
  stages: (category.stages ?? []).map(normalizeStage),
});

/** 任务编辑器：拖拽手柄只作用于手柄本身，避免干扰输入框。 */
function TaskEditor({
  task,
  index,
  stageIndex,
  onPatch,
  onRemove,
}: {
  task: MatterStageTask;
  index: number;
  stageIndex: number;
  onPatch: (patch: Partial<MatterStageTask>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${stageIndex}-${index}`,
  });
  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 2 : undefined }}
      sx={{ display: 'grid', gridTemplateColumns: '28px minmax(140px, 1fr) 92px 76px 32px', gap: 1, alignItems: 'center', py: 0.5, borderTop: 1, borderColor: 'divider', bgcolor: isDragging ? 'action.hover' : 'transparent' }}
    >
      <Tooltip title="拖动调整任务顺序">
        <IconButton
          size="small"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`拖动任务 ${index + 1}`}
          sx={{ cursor: 'grab', touchAction: 'none' }}
        >
          <DragIndicator fontSize="small" />
        </IconButton>
      </Tooltip>
      <TextField
        size="small"
        value={task.name}
        onChange={(event) => onPatch({ name: event.target.value })}
        inputProps={{ 'aria-label': `任务 ${index + 1} 名称` }}
        placeholder="任务名称"
      />
      <TextField
        size="small"
        type="number"
        value={task.dueDay}
        onChange={(event) => onPatch({ dueDay: Math.max(0, Number(event.target.value) || 0) })}
        inputProps={{ min: 0, 'aria-label': `任务 ${index + 1} 到期天数` }}
        label="第几天"
      />
      <FormControlLabel
        control={<Switch size="small" checked={task.skippable} onChange={(event) => onPatch({ skippable: event.target.checked })} />}
        label="可跳过"
        sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 12 } }}
      />
      <Tooltip title="删除任务">
        <IconButton size="small" color="error" onClick={onRemove} aria-label={`删除任务 ${index + 1}`}>
          <DeleteOutline fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

/** 阶段编辑器：包含阶段字段与可折叠的任务列表。 */
function StageEditor({
  stage,
  index,
  total,
  expanded,
  onToggle,
  onPatch,
  onFinalChange,
  onRemove,
  onAddTask,
  onPatchTask,
  onRemoveTask,
  onTaskDragEnd,
}: {
  stage: MatterCategoryStage;
  index: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onPatch: (patch: Partial<MatterCategoryStage>) => void;
  onFinalChange: (checked: boolean) => void;
  onRemove: () => void;
  onAddTask: () => void;
  onPatchTask: (taskIndex: number, patch: Partial<MatterStageTask>) => void;
  onRemoveTask: (taskIndex: number) => void;
  onTaskDragEnd: (event: DragEndEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: `stage-${index}`,
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      style={{ transform: CSS.Transform.toString(transform), transition, position: 'relative', zIndex: isDragging ? 3 : undefined }}
      sx={{ p: 1.25, bgcolor: isDragging ? 'action.hover' : 'background.paper' }}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: '28px minmax(140px, 1.4fr) 100px 56px 76px 28px 28px 28px', gap: 1, alignItems: 'center' }}>
        <Tooltip title="拖动调整阶段顺序">
          <IconButton
            size="small"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`拖动阶段 ${index + 1}`}
            sx={{ cursor: 'grab', touchAction: 'none' }}
          >
            <DragIndicator fontSize="small" />
          </IconButton>
        </Tooltip>
        <TextField
          size="small"
          value={stage.name}
          onChange={(event) => onPatch({ name: event.target.value })}
          inputProps={{ 'aria-label': `阶段 ${index + 1} 名称` }}
          label={`阶段 ${index + 1}`}
        />
        <TextField
          size="small"
          type="number"
          value={stage.durationDays}
          onChange={(event) => onPatch({ durationDays: Math.max(0, Number(event.target.value) || 0) })}
          inputProps={{ min: 0, 'aria-label': `阶段 ${index + 1} 停留天数` }}
          label="停留天数"
        />
        <TextField
          size="small"
          type="color"
          value={stage.color}
          onChange={(event) => onPatch({ color: event.target.value })}
          sx={{ '& input': { p: 0.5, height: 30 } }}
          inputProps={{ 'aria-label': `阶段 ${index + 1} 颜色` }}
        />
        <FormControlLabel
          control={<Switch size="small" checked={stage.isFinal} onChange={(event) => onFinalChange(event.target.checked)} />}
          label="结案"
          sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 12 } }}
        />
        <Tooltip title={expanded ? '收起任务' : `展开任务（${stage.tasks.length}）`}>
          <IconButton size="small" onClick={onToggle} aria-label={expanded ? '收起任务' : '展开任务'}>
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="删除阶段">
          <span>
            <IconButton size="small" color="error" disabled={total <= 2} onClick={onRemove} aria-label={`删除阶段 ${index + 1}`}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ fontSize: 12, color: 'text.secondary', textAlign: 'right' }} aria-hidden="true">{index + 1}</Box>
      </Box>

      {expanded && (
        <Box sx={{ pl: 3.5, pr: 0.5, pb: 0.5, pt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              阶段任务 · 进入阶段后第 N 天到期
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button size="small" startIcon={<AddOutlined />} onClick={onAddTask}>新增任务</Button>
          </Stack>
          <DndContext id={`tasks-${index}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onTaskDragEnd}>
            <SortableContext items={stage.tasks.map((_, taskIndex) => `task-${index}-${taskIndex}`)} strategy={verticalListSortingStrategy}>
              {stage.tasks.map((task, taskIndex) => (
                <TaskEditor
                  key={taskIndex}
                  task={task}
                  index={taskIndex}
                  stageIndex={index}
                  onPatch={(patch) => onPatchTask(taskIndex, patch)}
                  onRemove={() => onRemoveTask(taskIndex)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {stage.tasks.length === 0 && (
            <Typography variant="caption" color="text.secondary">暂无任务，点击「新增任务」添加。</Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}

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
  const [expandedStages, setExpandedStages] = useState<number[]>([0]);

  const selected = categories.find((category) => category.id === selectedId) ?? categories[0] ?? null;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft(toInput(selected));
    setExpandedStages([0]);
  }, [selected?.id, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(
    () => Boolean(selected && draft && JSON.stringify(draft) !== JSON.stringify(toInput(selected))),
    [selected, draft],
  );
  const flowError = Boolean(
    draft &&
      (draft.stages.length < 2 ||
        !draft.stages.some((stage) => stage.isFinal) ||
        draft.stages.some(
          (stage) =>
            !stage.name.trim() ||
            stage.durationDays < 1 ||
            stage.tasks.some((task) => !task.name.trim() || task.dueDay < 0),
        )),
  );

  const countOf = (category: MatterCategory) => matters.filter((matter) => matter.practiceArea === category.name).length;

  const select = (category: MatterCategory) => {
    if (category.id === selected?.id) return;
    if (dirty && !window.confirm('当前分类有未保存的改动，确定放弃并切换吗？')) return;
    setSelectedId(category.id);
    setDraft(toInput(category));
    setExpandedStages([0]);
  };

  const patchDraft = (patch: Partial<MatterCategoryInput>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const patchStage = (index: number, patch: Partial<MatterCategoryStage>) => {
    setDraft((current) =>
      current
        ? { ...current, stages: current.stages.map((stage, position) => (position === index ? { ...stage, ...patch } : stage)) }
        : current,
    );
  };

  const setFinalStage = (index: number) => {
    setDraft((current) =>
      current
        ? { ...current, stages: current.stages.map((stage, position) => ({ ...stage, isFinal: position === index })) }
        : current,
    );
  };

  const addStage = () => {
    setDraft((current) =>
      current
        ? {
            ...current,
            stages: [...current.stages.map((stage) => ({ ...stage, isFinal: false })), newStage(true)],
          }
        : current,
    );
    if (draft) setExpandedStages((current) => [...current, draft.stages.length]);
  };

  const removeStage = (index: number) => {
    setDraft((current) => {
      if (!current || current.stages.length <= 2) return current;
      const stages = current.stages.filter((_, position) => position !== index);
      if (!stages.some((stage) => stage.isFinal)) stages[stages.length - 1] = { ...stages[stages.length - 1], isFinal: true };
      return { ...current, stages };
    });
    setExpandedStages([]);
  };

  const patchTask = (stageIndex: number, taskIndex: number, patch: Partial<MatterStageTask>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            stages: current.stages.map((stage, position) =>
              position === stageIndex
                ? { ...stage, tasks: stage.tasks.map((task, taskPosition) => (taskPosition === taskIndex ? { ...task, ...patch } : task)) }
                : stage,
            ),
          }
        : current,
    );
  };

  const addTask = (stageIndex: number) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            stages: current.stages.map((stage, position) =>
              position === stageIndex ? { ...stage, tasks: [...stage.tasks, newTask()] } : stage,
            ),
          }
        : current,
    );
  };

  const removeTask = (stageIndex: number, taskIndex: number) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            stages: current.stages.map((stage, position) =>
              position === stageIndex ? { ...stage, tasks: stage.tasks.filter((_, taskPosition) => taskPosition !== taskIndex) } : stage,
            ),
          }
        : current,
    );
  };

  const endIndex = (id: string | number) => {
    const parts = String(id).split('-');
    return Number(parts[parts.length - 1]);
  };

  const moveStage = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = endIndex(active.id);
    const to = endIndex(over.id);
    if (!Number.isInteger(from) || !Number.isInteger(to)) return;
    setDraft((current) => (current ? { ...current, stages: arrayMove(current.stages, from, to) } : current));
    setExpandedStages([]);
  };

  const moveTask = (stageIndex: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = endIndex(active.id);
    const to = endIndex(over.id);
    if (!Number.isInteger(from) || !Number.isInteger(to)) return;
    setDraft((current) =>
      current
        ? {
            ...current,
            stages: current.stages.map((stage, position) =>
              position === stageIndex ? { ...stage, tasks: arrayMove(stage.tasks, from, to) } : stage,
            ),
          }
        : current,
    );
  };

  const save = () => {
    if (!selected || !draft || flowError) return;
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
        ? fromSystemStages(systemStages)
        : fromSystemStages([
            { name: '咨询评估', color: '#94a3b8', probability: 10, isFinal: false },
            { name: '办理中', color: '#3b82f6', probability: 60, isFinal: false },
            { name: '已归档', color: '#22c55e', probability: 100, isFinal: true },
          ]),
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
          共 {categories.length} 个案件类型 · 类型名称与案件「业务领域」对应，流程配置仅用于之后新建的案件
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={() => setFormOpen(true)}>新建类型</Button>
      </Stack>

      {isError && <ErrorState message={error?.message ?? '案件类型加载失败'} onRetry={() => void refetch()} />}
      {isLoading && <LoadingPanel height={360} />}

      {!isLoading && !isError && categories.length === 0 && (
        <EmptyState title="暂无案件类型" description="点击「新建类型」添加第一个案件类型" />
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
          <Paper variant="outlined" sx={{ width: { xs: '100%', lg: 240 }, flexShrink: 0, overflow: 'hidden' }}>
            <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={700}>案件类型</Typography>
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
                  <Tooltip title="使用系统预置阶段重建流程（会覆盖当前阶段与任务）">
                    <Button
                      size="small"
                      startIcon={<RestartAltOutlined />}
                      onClick={() => {
                        patchDraft({ stages: fromSystemStages(systemStages) });
                        setExpandedStages([0]);
                      }}
                      disabled={systemStages.length === 0}
                    >
                      使用系统模板
                    </Button>
                  </Tooltip>
                  <Tooltip title="删除该类型">
                    <IconButton size="small" color="error" onClick={() => setConfirmId(selected.id)} aria-label="删除类型"><DeleteOutline fontSize="small" /></IconButton>
                  </Tooltip>
                  <Button size="small" color="inherit" disabled={!dirty} onClick={() => setDraft(toInput(selected))}>取消</Button>
                  <Button size="small" variant="contained" startIcon={<SaveOutlined />} disabled={!dirty || flowError} onClick={save}>保存更改</Button>
                </Stack>

                {flowError && (
                  <Alert severity="warning" sx={{ mb: 1.5 }}>
                    流程至少需要 2 个阶段且必须指定结案阶段；阶段名称、停留时长（≥1 天）与任务名称、到期天数都需填写。
                  </Alert>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2, mb: 2 }}>
                  <TextField label="类型名称" value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} fullWidth size="small" />
                  <TextField label="标识代码" value={draft.code} onChange={(event) => patchDraft({ code: event.target.value })} fullWidth size="small" helperText="英文标识，用于区分类型" />
                  <TextField label="颜色" type="color" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value })} fullWidth size="small" sx={{ '& input': { p: 0.5, height: 34 } }} />
                  <FormControlLabel control={<Switch size="small" checked={draft.enabled !== false} onChange={(event) => patchDraft({ enabled: event.target.checked })} />} label="启用该类型" sx={{ m: 0, alignSelf: 'center' }} />
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
                  <Typography variant="caption" color="text.secondary">拖动左侧手柄调整顺序；展开阶段可配置任务</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button size="small" startIcon={<AddOutlined />} onClick={addStage}>新增阶段</Button>
                </Stack>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={moveStage}>
                  <SortableContext items={draft.stages.map((_, index) => `stage-${index}`)} strategy={verticalListSortingStrategy}>
                    <Stack spacing={1}>
                      {draft.stages.map((stage, index) => (
                        <StageEditor
                          key={index}
                          stage={stage}
                          index={index}
                          total={draft.stages.length}
                          expanded={expandedStages.includes(index)}
                          onToggle={() =>
                            setExpandedStages((current) =>
                              current.includes(index) ? current.filter((value) => value !== index) : [...current, index],
                            )
                          }
                          onPatch={(patch) => patchStage(index, patch)}
                          onFinalChange={(checked) => {
                            if (checked) setFinalStage(index);
                            else patchStage(index, { isFinal: false });
                          }}
                          onRemove={() => removeStage(index)}
                          onAddTask={() => addTask(index)}
                          onPatchTask={(taskIndex, patch) => patchTask(index, taskIndex, patch)}
                          onRemoveTask={(taskIndex) => removeTask(index, taskIndex)}
                          onTaskDragEnd={(event) => moveTask(index, event)}
                        />
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>

                {draft.stages.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>暂无阶段，请点击「新增阶段」。</Typography>
                )}

                <Alert severity="info" sx={{ mt: 2 }}>
                  阶段可配置名称、停留天数与结案标记；任务可配置名称、进入阶段后第几天到期及是否可跳过。配置仅影响之后新建的案件，已有案件保持原样。
                </Alert>
              </>
            )}
          </Paper>
        </Stack>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>新建案件类型</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="类型名称 *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus fullWidth />
          <TextField label="标识代码 *" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} fullWidth helperText="例如 contract / ip / labor" />
          <TextField label="颜色" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} fullWidth sx={{ '& input': { p: 0.5, height: 34 } }} />
          <TextField label="说明" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} fullWidth multiline minRows={2} />
          <FormControlLabel control={<Switch size="small" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />} label="启用该类型" />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setFormOpen(false)}>取消</Button>
          <Button variant="contained" disabled={!form.name.trim() || !form.code.trim() || createCategory.isPending} onClick={submitCreate}>创建</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmId !== null}
        title="删除案件类型"
        message="确定删除该类型吗？已有案件不会被删除，但会失去类型对应关系。"
        onClose={() => setConfirmId(null)}
        onConfirm={remove}
      />
    </Box>
  );
}
