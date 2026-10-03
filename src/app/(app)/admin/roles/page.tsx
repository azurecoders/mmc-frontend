"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  LinkButton,
  Dialog,
  Input,
  Select,
  Textarea,
  Checkbox,
  LoadingState,
  Alert,
  useToast,
} from "@/components/ui";
import { Role, Permission } from "@/types";

export default function AdminRolesPage() {
  const toast = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Create Role Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [roleCode, setRoleCode] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [parentRoleId, setParentRoleId] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete Dialog
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRolesAndPermissions = async () => {
    try {
      const [rList, pList] = await Promise.all([
        apiFetch<Role[]>("/roles/").catch(() => []),
        apiFetch<Permission[]>("/permissions/").catch(() => []),
      ]);
      setRoles(rList);
      setPermissions(pList);

      if (!selectedRoleId && rList.length > 0) {
        setSelectedRoleId(rList[0].id);
        setSelectedPermissionIds(rList[0].permissions?.map((p) => p.id) || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleSelectRole = (r: Role) => {
    setSelectedRoleId(r.id);
    setSelectedPermissionIds(r.permissions?.map((p) => p.id) || []);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSavingPermissions(true);
    try {
      await apiFetch(`/roles/${selectedRoleId}`, {
        method: "PUT",
        body: JSON.stringify({
          permission_ids: selectedPermissionIds,
        }),
      });

      toast({ title: "Role Permissions Updated", tone: "success" });
      fetchRolesAndPermissions();
    } catch (err: any) {
      toast({ title: "Failed to update permissions", description: err?.message || "Please try again.", tone: "error" });
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleCode.trim() || !roleName.trim()) {
      toast({ title: "Incomplete Form", description: "Role code and name are required.", tone: "warning" });
      return;
    }

    setCreating(true);
    try {
      await apiFetch("/roles/", {
        method: "POST",
        body: JSON.stringify({
          code: roleCode.trim().toUpperCase(),
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
          parent_role_id: parentRoleId || undefined,
        }),
      });

      toast({ title: "Dynamic Role Created", tone: "success" });
      setCreateDialogOpen(false);
      setRoleCode("");
      setRoleName("");
      setRoleDescription("");
      setParentRoleId("");
      fetchRolesAndPermissions();
    } catch (err: any) {
      toast({ title: "Creation failed", description: err?.message || "Role code must be unique.", tone: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      await apiFetch(`/roles/${deletingRole.id}`, { method: "DELETE" });
      toast({ title: "Role Deleted", tone: "info" });
      setDeletingRole(null);
      fetchRolesAndPermissions();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message || "System roles cannot be deleted.", tone: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Group permissions by module
  const permissionsByModule: Record<string, Permission[]> = {};
  permissions.forEach((p) => {
    if (!permissionsByModule[p.module]) permissionsByModule[p.module] = [];
    permissionsByModule[p.module].push(p);
  });

  if (loading) {
    return <LoadingState label="Loading roles and permission tree…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dynamic Access Control"
        title="Roles & Permissions Hierarchy"
        description="Define hierarchical sub-roles with automated recursive permission inheritance without code changes."
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/admin" variant="secondary">
              Back to Staff Users
            </LinkButton>
            <Button onClick={() => setCreateDialogOpen(true)} icon={<Plus className="h-4 w-4" />}>
              Create New Role
            </Button>
          </div>
        }
      />

      {/* Inheritance Helper Card */}
      <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 text-xs text-brand-900 flex items-start gap-3">
        <Layers className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-sm">Dynamic Hierarchical Sub-Roles</strong>
          When a role defines a parent (e.g. Cardiologist with parent Doctor), it automatically inherits all permissions from its parent and ancestors recursively.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Roles List */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
            System Roles ({roles.length})
          </h2>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = r.id === selectedRoleId;
              return (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectRole(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleSelectRole(r);
                  }}
                  className={`rounded-xl border p-4 cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? "border-brand-500 bg-brand-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{r.name}</span>
                      {r.is_system ? (
                        <Badge tone="neutral">System</Badge>
                      ) : (
                        <Badge tone="brand">Custom</Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{r.code}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {r.permissions?.length || 0} permissions assigned
                    </p>
                  </div>

                  {!r.is_system && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingRole(r);
                      }}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Delete role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix for Selected Role */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRole && (
            <Card>
              <CardHeader
                title={`Configure Permissions — ${selectedRole.name}`}
                description={`Code: ${selectedRole.code} · ${selectedRole.description || "No description provided"}`}
                action={
                  <Button
                    loading={savingPermissions}
                    onClick={handleSavePermissions}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Save Permissions
                  </Button>
                }
              />
              <CardBody className="space-y-6">
                {Object.keys(permissionsByModule).map((moduleName) => (
                  <div key={moduleName} className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1">
                      {moduleName} Module
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {permissionsByModule[moduleName].map((p) => {
                        const checked = selectedPermissionIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition ${
                              checked
                                ? "border-brand-300 bg-brand-50/30"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPermissionIds([...selectedPermissionIds, p.id]);
                                } else {
                                  setSelectedPermissionIds(
                                    selectedPermissionIds.filter((id) => id !== p.id)
                                  );
                                }
                              }}
                              className="mt-0.5 rounded border-slate-300 text-brand-600"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{p.name}</p>
                              <p className="font-mono text-slate-400 text-[11px]">{p.code}</p>
                              {p.description && (
                                <p className="text-slate-500 text-[11px] mt-0.5">{p.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Create Dynamic Role Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Create Dynamic Role / Sub-Role"
        description="Add a new role code and optionally specify a parent role for permission inheritance."
        size="md"
      >
        <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
          <Input
            label="Role Code (Unique identifier)"
            placeholder="e.g. CARDIOLOGIST"
            value={roleCode}
            onChange={(e) => setRoleCode(e.target.value)}
            required
            hint="Uppercase letters and underscores only"
          />
          <Input
            label="Display Name"
            placeholder="e.g. Senior Cardiologist"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            required
          />
          <Select
            label="Inherit From Parent Role (Optional Sub-Role)"
            value={parentRoleId}
            onChange={(e) => setParentRoleId(e.target.value)}
            placeholder="None (Independent root role)"
            options={roles.map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))}
          />
          <Textarea
            label="Role Description"
            placeholder="Description of clinical responsibilities and authority..."
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Role
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <Dialog
        open={deletingRole !== null}
        onClose={() => setDeletingRole(null)}
        title="Delete Custom Role"
        description={`Are you sure you want to delete role "${deletingRole?.name}"?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingRole(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDeleteRole}>
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          This custom role will be permanently removed. Any users currently assigned to this role will lose its inherited permissions.
        </p>
      </Dialog>
    </div>
  );
}
