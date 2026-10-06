"use client";

import React, { useState, useEffect } from "react";
import {
  Siren,
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Shield,
  Activity,
  Flame,
  Baby,
  Biohazard,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  LoadingState,
  Modal,
  useToast,
} from "@/components/ui";
import { EmergencyCodeGroupResponse, User } from "@/types";
import { EmergencyTriggerButton } from "@/components/emergency/EmergencyTriggerButton";
import { cn } from "@/lib/utils";

const CODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CODE_BLUE: Activity,
  CODE_RED: Flame,
  CODE_PINK: Baby,
  CODE_YELLOW: Users,
  CODE_ORANGE: Biohazard,
  CODE_BLACK: ShieldX,
  RAPID_RESPONSE: ShieldAlert,
};

export default function AdminEmergencyTeamsPage() {
  const toast = useToast();

  const [groups, setGroups] = useState<EmergencyCodeGroupResponse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Member Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<EmergencyCodeGroupResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [submittingMember, setSubmittingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [groupsData, usersData] = await Promise.all([
        apiFetch<EmergencyCodeGroupResponse[]>("/emergency/groups"),
        apiFetch<User[]>("/users/").catch(() => []),
      ]);
      setGroups(groupsData);
      setUsers(usersData);
    } catch (err: any) {
      toast({
        title: "Failed to load emergency groups",
        description: err?.message || "Error fetching emergency response groups.",
        tone: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = (group: EmergencyCodeGroupResponse) => {
    setActiveGroup(group);
    // Find first staff user not in this group
    const existingIds = new Set(group.members.map((m) => m.id));
    const availableUsers = staffUsers.filter((u) => !existingIds.has(u.id));
    setSelectedUserId(availableUsers[0]?.id || "");
    setMemberError(null);
    setAddModalOpen(true);
  };

  const handleAddMember = async () => {
    if (!activeGroup || !selectedUserId) {
      setMemberError("Please select a staff member to assign.");
      return;
    }

    try {
      setSubmittingMember(true);
      setMemberError(null);

      const updatedGroup = await apiFetch<EmergencyCodeGroupResponse>(
        `/emergency/groups/${activeGroup.code}/members`,
        {
          method: "POST",
          body: JSON.stringify({ user_id: selectedUserId }),
        }
      );

      setGroups((prev) =>
        prev.map((g) => (g.code === activeGroup.code ? updatedGroup : g))
      );

      toast({
        title: "Member Assigned",
        description: `Successfully added to ${activeGroup.name} emergency response team.`,
        tone: "success",
      });
      setAddModalOpen(false);
    } catch (err: any) {
      setMemberError(err?.message || "Failed to add member to team.");
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleRemoveMember = async (groupCode: string, userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this emergency team?`)) {
      return;
    }

    try {
      setRemovingId(`${groupCode}-${userId}`);
      const updatedGroup = await apiFetch<EmergencyCodeGroupResponse>(
        `/emergency/groups/${groupCode}/members/${userId}`,
        {
          method: "DELETE",
        }
      );

      setGroups((prev) =>
        prev.map((g) => (g.code === groupCode ? updatedGroup : g))
      );

      toast({
        title: "Member Removed",
        description: `${memberName} has been unassigned from the emergency team.`,
        tone: "success",
      });
    } catch (err: any) {
      toast({
        title: "Failed to remove member",
        description: err?.message || "Could not remove member from emergency team.",
        tone: "error",
      });
    } finally {
      setRemovingId(null);
    }
  };

  // Filter users to clinical/hospital staff (Doctors, Nurses, Compounders, Admins)
  const staffUsers = users.filter((u) =>
    u.roles?.some((r) =>
      ["DOCTOR", "NURSE", "COMPOUNDER", "SUPER_ADMIN"].includes(r.code)
    )
  );

  if (loading) {
    return <LoadingState label="Loading emergency teams management…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Emergency Protocols & Disaster Management"
        title="Emergency Code Response Teams"
        description="Configure hospital staff response groups for code events (Code Blue CPR, Code Red Fire, etc.). When a clinical code is broadcasted, all assigned personnel are instantly notified with exact ward coordinates."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setRefreshing(true);
                fetchData();
              }}
              loading={refreshing}
              icon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh
            </Button>
            <EmergencyTriggerButton ward="ICU — Intensive Care Unit" />
          </div>
        }
      />

      {/* SUMMARY BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Emergency Code Groups
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{groups.length} Groups</div>
          <span className="text-xs text-slate-400">Active hospital protocols</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Available Hospital Staff
          </span>
          <div className="text-2xl font-bold text-brand-600 mt-1">{staffUsers.length} Staff</div>
          <span className="text-xs text-slate-400">Doctors, Nurses & Compounders</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Team Assignments
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {groups.reduce((acc, g) => acc + g.members.length, 0)} Active
          </div>
          <span className="text-xs text-slate-400">Across all codes</span>
        </div>
      </div>

      {/* EMERGENCY CODE GROUPS LIST */}
      <div className="grid grid-cols-1 gap-6">
        {groups.map((group) => {
          const Icon = CODE_ICONS[group.code] || Siren;

          return (
            <Card key={group.code} className="overflow-hidden border-2 border-slate-200 shadow-sm">
              <CardHeader
                title={
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase text-white shadow-xs"
                      style={{ backgroundColor: group.color_hex }}
                    >
                      <Icon className="h-4 w-4" />
                      {group.name}
                    </span>
                    <span className="text-sm font-semibold text-slate-600">
                      ({group.code})
                    </span>
                  </div>
                }
                description={
                  <div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{group.description}</p>
                    <p className="text-xs text-slate-500 italic mt-0.5">
                      Protocol: {group.call_to_action}
                    </p>
                  </div>
                }
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">
                      {group.members.length} {group.members.length === 1 ? "Responder" : "Responders"}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleOpenAddModal(group)}
                      icon={<UserPlus className="h-3.5 w-3.5" />}
                      className="text-xs font-semibold"
                    >
                      Add Member
                    </Button>
                  </div>
                }
              />

              <CardBody className="bg-slate-50/50 p-4">
                {group.members.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                    <Users className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No staff members assigned</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Assign doctors, nurses, and compounders to respond when {group.name} is triggered.
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenAddModal(group)}
                      className="mt-3 text-xs"
                    >
                      Assign First Responder
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:shadow-xs transition-shadow"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-bold text-xs text-slate-900">
                              {member.full_name}
                            </span>
                            {member.role_names.length > 0 && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                {member.role_names[0]}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-slate-400 mt-0.5">
                            {member.email} {member.phone ? `• ${member.phone}` : ""}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(group.code, member.id, member.full_name)}
                          disabled={removingId === `${group.code}-${member.id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Remove from this emergency team"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* ASSIGN STAFF MEMBER MODAL */}
      {activeGroup && (
        <Modal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title={`Assign Staff to ${activeGroup.name}`}
          description={`Select a doctor, nurse, compounder, or clinical administrator to dispatch when ${activeGroup.name} (${activeGroup.code}) is triggered.`}
          size="md"
        >
          <div className="space-y-4">
            {memberError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <p>{memberError}</p>
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
                Select Hospital Staff Member <span className="text-red-500">*</span>
              </label>

              {(() => {
                const existingIds = new Set(activeGroup.members.map((m) => m.id));
                const available = staffUsers.filter((u) => !existingIds.has(u.id));

                if (available.length === 0) {
                  return (
                    <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                      All clinical staff members are already assigned to this group.
                    </div>
                  );
                }

                return (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 bg-white focus:border-brand-500 focus:outline-none"
                  >
                    {available.map((u) => {
                      const roleName = u.roles?.[0]?.name || "Staff";
                      return (
                        <option key={u.id} value={u.id}>
                          {u.full_name} — {roleName} ({u.email})
                        </option>
                      );
                    })}
                  </select>
                );
              })()}
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Emergency Notification Guarantee:</p>
              <p className="mt-0.5">
                When any clinical staff member presses the {activeGroup.name} button, the assigned member will receive real-time screen alerts and notification chime with the exact ward location.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setAddModalOpen(false)}
                disabled={submittingMember}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                loading={submittingMember}
                disabled={!selectedUserId}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
              >
                Assign Member to Team
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
