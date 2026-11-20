import { useState } from 'react';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import GavelOutlined from '@mui/icons-material/GavelOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Field, FieldGrid } from '@/components/common/Field';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/components/common/ToastProvider';
import {
  useAddMatterParty,
  useCompanyCheck,
  useCreateClient,
  useMatters,
  useToolboxMeta,
} from '@/hooks/useCrm';
import type { CompanyCheckResponse, CompanyRecord } from '@/types';
import {
  MatterPicker,
  Panel,
  ResultPlaceholder,
  SaveToMatterButton,
  TOOLBOX_COLOR,
  ToolboxBanner,
} from './LegalToolboxShared';

const RISK_COLOR: Record<string, 'success' | 'warning' | 'error'> = {
  低: 'success',
  中: 'warning',
  高: 'error',
};

/** 用本地 SVG 画出股权穿透层级，不引入图库。 */
function EquityGraph({ company }: { company: CompanyRecord }) {
  const width = 640;
  const height = 250;
  const level1 = company.equityEdges.filter((e) => e.to === 'c0').map((e) => e.from);
  const level2 = company.shareholders
    .map((s) => s.id)
    .filter((id) => id !== 'c0' && !level1.includes(id));
  const pos: Record<string, { x: number; y: number }> = { c0: { x: width / 2, y: 36 } };
  level1.forEach((id, i) => {
    pos[id] = { x: (width * (i + 1)) / (level1.length + 1), y: 125 };
  });
  level2.forEach((id, i) => {
    pos[id] = { x: (width * (i + 1)) / (level2.length + 1), y: 212 };
  });

  return (
    <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.default' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="股权穿透图（演示）">
        {company.equityEdges.map((edge, i) => {
          const from = pos[edge.from];
          const to = pos[edge.to];
          if (!from || !to) return null;
          return (
            <g key={i}>
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 3" />
              <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 4} textAnchor="middle" fontSize="10" fill="#64748b">
                {edge.label}
              </text>
            </g>
          );
        })}
        {company.shareholders.map((node) => {
          const p = pos[node.id];
          if (!p) return null;
          return (
            <g key={node.id}>
              <rect x={p.x - 78} y={p.y - 18} width={156} height={36} rx={6} fill={node.id === 'c0' ? TOOLBOX_COLOR : '#fff'} stroke={node.id === 'c0' ? TOOLBOX_COLOR : '#cbd5e1'} />
              <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="11" fontWeight={600} fill={node.id === 'c0' ? '#fff' : '#1e293b'}>
                {node.name.length > 12 ? `${node.name.slice(0, 12)}…` : node.name}
              </text>
              <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize="10" fill={node.id === 'c0' ? '#d1fae5' : '#64748b'}>
                {node.type === 'person' ? '自然人' : '企业'} · {node.ratio}%
              </text>
            </g>
          );
        })}
      </svg>
      <Typography variant="caption" color="text.secondary">
        演示股权结构（{company.shareholders.length} 个节点），不代表真实工商登记信息。
      </Typography>
    </Paper>
  );
}

export function CompanyPage() {
  const toast = useToast();
  const { data: matters } = useMatters();
  const { data: meta } = useToolboxMeta();
  const check = useCompanyCheck();
  const createClient = useCreateClient();
  const addParty = useAddMatterParty();
  const [matterId, setMatterId] = useState('');
  const [name, setName] = useState('华远建设工程有限公司');
  const [response, setResponse] = useState<CompanyCheckResponse | null>(null);

  const submit = () => {
    check.mutate(
      { name: name.trim() },
      {
        onSuccess: (data) => setResponse(data),
        onError: () => setResponse(null),
      },
    );
  };

  const company = response?.found ? response.result : null;

  const importClient = () => {
    if (!company) return;
    createClient.mutate(
      {
        name: company.name,
        type: 'company',
        contactName: company.legalRepresentative,
        address: company.address,
        notes: `由律师工具箱本地演示速查导入（非实时数据，风险等级：${company.riskLevel}）。正式使用须核验工商登记原始信息。`,
      },
      { onSuccess: () => toast.success('已导入为客户档案（演示数据）') },
    );
  };

  const importParty = () => {
    if (!company) return;
    if (!matterId) {
      toast.warning('请先选择要导入相对方的案件');
      return;
    }
    addParty.mutate(
      {
        matterId: Number(matterId),
        data: {
          matterId: Number(matterId),
          role: 'defendant',
          name: company.name,
          contact: company.legalRepresentative,
          note: `本地演示速查导入：${company.legalRepresentative} / ${company.creditCode}；非实时数据，请核验。`,
        },
      },
      { onSuccess: () => toast.success('已导入为当前案件相对方（演示数据）') },
    );
  };

  return (
    <>
      <PageHeader
        title="企业工商失信速查"
        subtitle="本地演示主体库查询股权穿透、涉诉、被执行与限高信息，可导入客户或相对方档案。"
        actions={
          <Button variant="contained" startIcon={<SearchOutlined />} onClick={submit} disabled={check.isPending}>
            {check.isPending ? '查询中…' : '速查主体'}
          </Button>
        }
      />
      <ToolboxBanner demo />

      <Panel title="查询条件" subtitle="本工具不连接实时工商/司法数据源，仅返回内置虚构演示主体。">
        <Stack spacing={2}>
          <MatterPicker matterId={matterId} setMatterId={setMatterId} matters={matters} />
          <TextField size="small" fullWidth label="主体名称" value={name} onChange={(e) => setName(e.target.value)} placeholder="输入演示主体名称或其简称" />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {(meta?.demoCompanies ?? []).map((demo) => (
              <Chip key={demo.name} label={`${demo.name}（${demo.riskLevel}风险）`} clickable onClick={() => setName(demo.name)} variant={name === demo.name ? 'filled' : 'outlined'} color={name === demo.name ? 'primary' : 'default'} />
            ))}
          </Stack>
        </Stack>
      </Panel>

      {!response && <Panel title="查询结果"><ResultPlaceholder text="输入主体名称后点击「速查主体」。" /></Panel>}

      {response && !response.found && (
        <Panel title="查询结果">
          <Alert severity="warning">{response.message}</Alert>
        </Panel>
      )}

      {company && (
        <>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {response?.message} 数据标识：{response?.dataSourceLabel ?? response?.dataSource}。不得作为尽调、授信或对外提交依据。
          </Alert>

          <Panel
            title={`主体档案 · ${company.name}`}
            action={<Chip label={`风险等级：${company.riskLevel}`} color={RISK_COLOR[company.riskLevel] ?? 'default'} />}
          >
            <FieldGrid columns={4}>
              <Field label="统一社会信用代码">{company.creditCode}</Field>
              <Field label="法定代表人">{company.legalRepresentative}</Field>
              <Field label="注册资本">{company.registeredCapital}</Field>
              <Field label="成立日期">{company.establishedAt}</Field>
              <Field label="登记状态">{company.status}</Field>
              <Field label="住所">{company.address}</Field>
              <Field label="风险提示">
                {company.executions.length > 0 ? `被执行 ${company.executions.length} 条` : '无被执行记录'}
                {company.restrictions.length > 0 ? ` · 限高 ${company.restrictions.length} 条` : ''}
              </Field>
              <Field label="经营范围">{company.businessScope}</Field>
            </FieldGrid>
          </Panel>

          <Panel title="股权穿透结构" subtitle="演示数据，节点层级按内置关系绘制。">
            <EquityGraph company={company} />
          </Panel>

          <Panel title={`涉诉记录（${company.lawsuits.length} 条）`}>
            {company.lawsuits.length === 0 ? (
              <Typography variant="body2" color="text.secondary">演示库未登记涉诉记录。</Typography>
            ) : (
              <Table size="small">
                <TableHead><TableRow><TableCell>案号</TableCell><TableCell>案由</TableCell><TableCell>身份</TableCell><TableCell align="right">标的金额</TableCell><TableCell>日期</TableCell><TableCell>状态</TableCell></TableRow></TableHead>
                <TableBody>
                  {company.lawsuits.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.caseNo}</TableCell><TableCell>{row.cause}</TableCell><TableCell>{row.role}</TableCell>
                      <TableCell align="right">{row.amount}</TableCell><TableCell>{row.date}</TableCell><TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>

          <Panel title={`被执行与限制高消费（${company.executions.length + company.restrictions.length} 条）`}>
            {company.executions.length === 0 && company.restrictions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">演示库未登记被执行或限高记录。</Typography>
            ) : (
              <Table size="small">
                <TableHead><TableRow><TableCell>类型</TableCell><TableCell>案号</TableCell><TableCell>日期</TableCell><TableCell>金额 / 事由</TableCell><TableCell>状态</TableCell></TableRow></TableHead>
                <TableBody>
                  {company.executions.map((row, i) => (
                    <TableRow key={`e${i}`}>
                      <TableCell>被执行人</TableCell><TableCell>{row.caseNo}</TableCell><TableCell>{row.date}</TableCell>
                      <TableCell>{row.amount}</TableCell><TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                  {company.restrictions.map((row, i) => (
                    <TableRow key={`r${i}`}>
                      <TableCell>限制高消费</TableCell><TableCell>{row.caseNo}</TableCell><TableCell>{row.date}</TableCell>
                      <TableCell colSpan={2}>{row.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" startIcon={<PersonAddAltOutlined />} onClick={importClient} disabled={createClient.isPending}>
              导入为客户档案
            </Button>
            <Button variant="outlined" startIcon={<GavelOutlined />} onClick={importParty} disabled={addParty.isPending}>
              导入为当前案件相对方
            </Button>
            <SaveToMatterButton
              matterId={matterId}
              toolCode="tool_company"
              toolName="企业工商失信速查"
              title={`企业速查 · ${company.name}（演示）`}
              input={{ name }}
              result={{ ...company } as unknown as Record<string, unknown>}
              summary={`演示速查：风险等级 ${company.riskLevel}，涉诉 ${company.lawsuits.length} 条，被执行 ${company.executions.length} 条`}
            />
          </Stack>
        </>
      )}
    </>
  );
}
