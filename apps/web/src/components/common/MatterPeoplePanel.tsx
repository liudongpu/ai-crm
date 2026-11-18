import { useState } from 'react';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  useAddMatterParty,
  useAddMatterTeamMember,
  useDeleteMatterParty,
  useDeleteMatterTeamMember,
  useMatterParties,
  useMatterTeam,
  useUsers,
} from '@/hooks/useCrm';
import type { MatterParty, MatterTeamRole, PartyRole } from '@/types';

const partyRoles: Array<{ value: PartyRole; label: string; color: 'primary' | 'error' | 'info' | 'default' }> = [
  { value: 'plaintiff', label: '原告', color: 'primary' },
  { value: 'defendant', label: '被告', color: 'error' },
  { value: 'third_party', label: '第三人', color: 'info' },
  { value: 'other', label: '其他', color: 'default' },
];
const teamRoles: Array<{ value: MatterTeamRole; label: string; color: 'primary' | 'info' | 'default' }> = [
  { value: 'lead', label: '主办', color: 'primary' },
  { value: 'associate', label: '协办', color: 'info' },
  { value: 'assistant', label: '助理', color: 'default' },
  { value: 'viewer', label: '只读', color: 'default' },
];

function partyRole(role: PartyRole) {
  return partyRoles.find((item) => item.value === role) ?? partyRoles[3];
}
function teamRole(role: MatterTeamRole) {
  return teamRoles.find((item) => item.value === role) ?? teamRoles[2];
}

export function MatterPeoplePanel({ matterId }: { matterId: number }) {
  const { data: parties } = useMatterParties(matterId);
  const { data: team } = useMatterTeam(matterId);
  const { data: users } = useUsers();
  const addParty = useAddMatterParty();
  const deleteParty = useDeleteMatterParty();
  const addMember = useAddMatterTeamMember();
  const deleteMember = useDeleteMatterTeamMember();

  const [partyOpen, setPartyOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [partyForm, setPartyForm] = useState<{ role: PartyRole; name: string; contact: string; note: string }>({
    role: 'plaintiff', name: '', contact: '', note: '',
  });
  const [teamForm, setTeamForm] = useState<{ userId: string; role: MatterTeamRole; canViewInternal: boolean }>({
    userId: '', role: 'associate', canViewInternal: true,
  });

  const submitParty = () => {
    if (!partyForm.name.trim()) return;
    addParty.mutate(
      { matterId, data: { ...partyForm, name: partyForm.name.trim() } },
      { onSuccess: () => { setPartyOpen(false); setPartyForm({ role: 'plaintiff', name: '', contact: '', note: '' }); } },
    );
  };

  const submitMember = () => {
    if (!teamForm.userId) return;
    addMember.mutate(
      {
        matterId,
        data: { userId: Number(teamForm.userId), role: teamForm.role, canViewInternal: teamForm.canViewInternal },
      },
      { onSuccess: () => { setTeamOpen(false); setTeamForm({ userId: '', role: 'associate', canViewInternal: true }); } },
    );
  };

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
      <Card>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6">当事人</Typography>
            <Typography variant="caption" color="text.secondary">原告 / 被告 / 第三人</Typography>
          </Box>
          <Button size="small" startIcon={<AddOutlined />} onClick={() => setPartyOpen(true)}>添加</Button>
        </Box>
        <CardContent sx={{ p: 0 }}>
          {(parties ?? []).length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>暂无当事人，点击右上角添加。</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>角色</TableCell><TableCell>名称</TableCell><TableCell>联系方式</TableCell><TableCell>备注</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {(parties as MatterParty[]).map((party) => {
                  const meta = partyRole(party.role);
                  return (
                    <TableRow key={party.id} hover>
                      <TableCell><Chip size="small" color={meta.color} label={meta.label} /></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{party.name}</TableCell>
                      <TableCell>{party.contact ?? '—'}</TableCell>
                      <TableCell>{party.note ?? '—'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="删除当事人">
                          <IconButton size="small" color="error" onClick={() => deleteParty.mutate(party.id)}>
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6">案件团队</Typography>
            <Typography variant="caption" color="text.secondary">1 个案件 1-3 人；决定案件与会话可见范围</Typography>
          </Box>
          <Button size="small" startIcon={<AddOutlined />} onClick={() => setTeamOpen(true)}>添加</Button>
        </Box>
        <CardContent sx={{ p: 0 }}>
          {(team ?? []).length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>暂无团队成员，点击右上角添加。</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>成员</TableCell><TableCell>角色</TableCell><TableCell>内部备注</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {(team ?? []).map((member) => {
                  const meta = teamRole(member.role);
                  return (
                    <TableRow key={member.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{member.userName}</Typography>
                        <Typography variant="caption" color="text.secondary">{member.title ?? '—'}</Typography>
                      </TableCell>
                      <TableCell><Chip size="small" color={meta.color} label={meta.label} /></TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" color={member.canViewInternal ? 'success' : 'default'}
                          label={member.canViewInternal ? '可见' : '不可见'} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="移出团队">
                          <IconButton size="small" color="error" onClick={() => deleteMember.mutate(member.id)}>
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={partyOpen} onClose={() => setPartyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加当事人</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <FormControl fullWidth>
            <InputLabel id="party-role">诉讼角色</InputLabel>
            <Select labelId="party-role" label="诉讼角色" value={partyForm.role}
              onChange={(event) => setPartyForm({ ...partyForm, role: event.target.value as PartyRole })}>
              {partyRoles.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="名称 *" value={partyForm.name}
            onChange={(event) => setPartyForm({ ...partyForm, name: event.target.value })} fullWidth />
          <TextField size="small" label="联系方式" value={partyForm.contact}
            onChange={(event) => setPartyForm({ ...partyForm, contact: event.target.value })} fullWidth />
          <TextField size="small" label="备注" value={partyForm.note}
            onChange={(event) => setPartyForm({ ...partyForm, note: event.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartyOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submitParty} disabled={!partyForm.name.trim() || addParty.isPending}>添加</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={teamOpen} onClose={() => setTeamOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加团队成员</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <FormControl fullWidth>
            <InputLabel id="team-user">人员</InputLabel>
            <Select labelId="team-user" label="人员" value={teamForm.userId}
              onChange={(event) => setTeamForm({ ...teamForm, userId: event.target.value })}>
              {(users ?? []).map((user) => <MenuItem key={user.id} value={String(user.id)}>{user.name} · {user.title ?? user.role}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="team-role">团队角色</InputLabel>
            <Select labelId="team-role" label="团队角色" value={teamForm.role}
              onChange={(event) => setTeamForm({ ...teamForm, role: event.target.value as MatterTeamRole })}>
              {teamRoles.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox checked={teamForm.canViewInternal}
              onChange={(event) => setTeamForm({ ...teamForm, canViewInternal: event.target.checked })} />}
            label="可查看内部备注"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamOpen(false)} color="inherit">取消</Button>
          <Button variant="contained" onClick={submitMember} disabled={!teamForm.userId || addMember.isPending}>添加</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
