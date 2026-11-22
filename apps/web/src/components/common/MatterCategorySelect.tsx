import { useId } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useMatterCategories } from '@/hooks/useCrm';

/**
 * 案件类型选择器：选项来自已启用的 MatterCategory，选中值仍保存在 practiceArea 字段中。
 * 历史数据若已不在启用列表中，会作为额外选项保留，避免编辑时静默丢失原值。
 */
export function MatterCategorySelect({
  value,
  onChange,
  label = '案件类型',
  allowEmpty = false,
  emptyLabel = '请选择',
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const labelId = useId();
  const { data: categories } = useMatterCategories();
  const names = (categories ?? []).filter((category) => category.enabled).map((category) => category.name);
  const options = value && !names.includes(value) ? [value, ...names] : names;

  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {allowEmpty && <MenuItem value="">{emptyLabel}</MenuItem>}
        {options.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
      </Select>
    </FormControl>
  );
}
