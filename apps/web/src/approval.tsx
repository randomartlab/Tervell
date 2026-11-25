import { ApprovalCard } from '@proma/ui/workbench'
import type { ClientState, WorkbenchClient } from '@proma/client'

export function SessionApproval({ approval, client, state }: { approval: ClientState['approvals'][number]; client: WorkbenchClient; state: ClientState }) {
  return <ApprovalCard approval={approval} pending={state.respondingApprovals.includes(approval.id)} error={state.approvalErrors[approval.id]} onRespond={decision => client.respond(approval.id, decision)} />
}
