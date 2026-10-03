"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Stethoscope,
  Search,
  KeyRound,
  Mail,
  Phone,
  Edit,
  Sparkles,
  Building,
  RefreshCw,
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
  LoadingState,
  useToast,
} from "@/components/ui";
import { User, Role, Department, DoctorProfile } from "@/types";

function getRandomWard(): string {
  const wings = ["A", "B", "C", "D"];
  const wing = wings[Math.floor(Math.random() * wings.length)];
  const room = Math.floor(Math.random() * 400 + 101);
  return `Ward ${wing}-${room}`;
}

export default function AdminUsersPage() {
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("");

  // Add Staff Member Dialog
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("Staff@123456");
  const [staffRoleCode, setStaffRoleCode] = useState("");
  const [creatingStaff, setCreatingStaff] = useState(false);

  // Add Doctor Dialog (with automated random ward/room assignment)
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docPhone, setDocPhone] = useState("");
  const [docPassword, setDocPassword] = useState("Doctor@123456");
  const [docDepartmentId, setDocDepartmentId] = useState("");
  const [docSpecialization, setDocSpecialization] = useState("");
  const [docQualifications, setDocQualifications] = useState("MBBS, MD");
  const [docExperience, setDocExperience] = useState("5");
  const [docFee, setDocFee] = useState("50");
  const [docRoomNumber, setDocRoomNumber] = useState(getRandomWard());
  const [creatingDoctor, setCreatingDoctor] = useState(false);

  // Edit Roles Dialog
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userRoleCodes, setUserRoleCodes] = useState<string[]>([]);
  const [updatingRoles, setUpdatingRoles] = useState(false);

  const fetchData = async () => {
    try {
      const [uList, rList, dList, docList] = await Promise.all([
        apiFetch<User[]>("/users/").catch(() => []),
        apiFetch<Role[]>("/roles/").catch(() => []),
        apiFetch<Department[]>("/departments/").catch(() => []),
        apiFetch<DoctorProfile[]>("/doctors/").catch(() => []),
      ]);
      setUsers(uList);
      setRoles(rList);
      setDepartments(dList);
      setDoctors(docList);
      if (dList.length > 0 && !docDepartmentId) {
        setDocDepartmentId(dList[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim() || !staffRoleCode) {
      toast({ title: "Incomplete Form", description: "Name, email, and a role are required.", tone: "warning" });
      return;
    }

    setCreatingStaff(true);
    try {
      await apiFetch("/users/", {
        method: "POST",
        body: JSON.stringify({
          full_name: staffName.trim(),
          email: staffEmail.trim(),
          phone: staffPhone.trim() || undefined,
          password: staffPassword,
          role_codes: [staffRoleCode],
        }),
      });

      toast({ title: "Staff Member Onboarded", description: `Account created for ${staffName}`, tone: "success" });
      setStaffDialogOpen(false);
      setStaffName("");
      setStaffEmail("");
      setStaffPhone("");
      setStaffRoleCode("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Failed to onboard staff", description: err?.message || "Please check inputs.", tone: "error" });
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docEmail.trim() || !docDepartmentId) {
      toast({ title: "Incomplete Form", description: "Name, email, and department are required.", tone: "warning" });
      return;
    }

    setCreatingDoctor(true);
    try {
      // 1. Create the user account with DOCTOR role
      const newUser = await apiFetch<User>("/users/", {
        method: "POST",
        body: JSON.stringify({
          full_name: docName.trim(),
          email: docEmail.trim(),
          phone: docPhone.trim() || undefined,
          password: docPassword,
          role_codes: ["DOCTOR"],
        }),
      });

      // 2. Create the Doctor Profile with the assigned random ward
      await apiFetch("/doctors/", {
        method: "POST",
        body: JSON.stringify({
          user_id: newUser.id,
          department_id: docDepartmentId,
          specialization: docSpecialization.trim() || "Consultant Physician",
          qualifications: docQualifications.trim() || "MBBS",
          experience_years: parseInt(docExperience, 10) || 0,
          consultation_fee: parseFloat(docFee) || 50.0,
          room_number: docRoomNumber.trim() || getRandomWard(),
          is_available: true,
        }),
      });

      toast({
        title: "Doctor Profile Created",
        description: `${docName} assigned to ${docRoomNumber}`,
        tone: "success",
      });

      setDoctorDialogOpen(false);
      setDocName("");
      setDocEmail("");
      setDocPhone("");
      setDocSpecialization("");
      setDocRoomNumber(getRandomWard());
      fetchData();
    } catch (err: any) {
      toast({ title: "Failed to create doctor", description: err?.message || "Please check inputs.", tone: "error" });
    } finally {
      setCreatingDoctor(false);
    }
  };

  const handleOpenEditRoles = (u: User) => {
    setEditingUser(u);
    setUserRoleCodes(u.roles?.map((r) => r.code) || []);
  };

  const handleSaveUserRoles = async () => {
    if (!editingUser) return;
    setUpdatingRoles(true);
    try {
      await apiFetch(`/users/${editingUser.id}/roles`, {
        method: "PUT",
        body: JSON.stringify({ role_codes: userRoleCodes }),
      });

      toast({ title: "Roles Updated Successfully", tone: "success" });
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message || "Please try again.", tone: "error" });
    } finally {
      setUpdatingRoles(false);
    }
  };

  const doctorsMapByUserId = new Map(doctors.map((d) => [d.user_id, d]));

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      !selectedRoleFilter || u.roles?.some((r) => r.code === selectedRoleFilter);
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <LoadingState label="Loading staff directory…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System Administration"
        title="Staff & User Management"
        description="Onboard clinical doctors, receptionists, pharmacists, and lab personnel. Doctors are assigned a dedicated ward room upon creation."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LinkButton href="/admin/roles" variant="secondary" icon={<KeyRound className="h-4 w-4" />}>
              Roles & Permissions
            </LinkButton>
            <Button
              variant="secondary"
              onClick={() => {
                setStaffDialogOpen(true);
              }}
              icon={<UserPlus className="h-4 w-4" />}
            >
              Add Staff Member
            </Button>
            <Button
              onClick={() => {
                setDocRoomNumber(getRandomWard());
                setDoctorDialogOpen(true);
              }}
              icon={<Stethoscope className="h-4 w-4" />}
            >
              Add Doctor
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Input
            label="Search Staff"
            hideLabel
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          label="Filter Role"
          hideLabel
          value={selectedRoleFilter}
          onChange={(e) => setSelectedRoleFilter(e.target.value)}
          placeholder="All Roles"
          options={roles.map((r) => ({ value: r.code, label: r.name }))}
          className="w-48"
        />
      </div>

      {/* Staff Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-500">
                <tr>
                  <th scope="col" className="py-3 px-4 font-medium">Full Name</th>
                  <th scope="col" className="py-3 px-4 font-medium">Contact Details</th>
                  <th scope="col" className="py-3 px-4 font-medium">Assigned Roles</th>
                  <th scope="col" className="py-3 px-4 font-medium">Ward / Room</th>
                  <th scope="col" className="py-3 px-4 font-medium">Account Status</th>
                  <th scope="col" className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const docProfile = doctorsMapByUserId.get(u.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-semibold text-slate-900 text-sm">
                        <div className="flex items-center gap-2">
                          {u.full_name}
                          {docProfile && (
                            <span className="text-[11px] font-normal text-slate-500">
                              ({docProfile.specialization})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{u.email}</div>
                        {u.phone && <div className="text-slate-400 text-[11px]">{u.phone}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r) => (
                            <Badge key={r.id} tone="brand">{r.name}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {docProfile ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                            <Building className="h-3.5 w-3.5 text-brand-600" />
                            {docProfile.room_number}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={u.is_active ? "success" : "neutral"}>
                          {u.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenEditRoles(u)}
                          icon={<Edit className="h-3 w-3" />}
                        >
                          Edit Roles
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Add Doctor Dialog */}
      <Dialog
        open={doctorDialogOpen}
        onClose={() => setDoctorDialogOpen(false)}
        title="Onboard New Doctor"
        description="Register a doctor profile with assigned clinical specialty and automated random ward/room assignment."
        size="lg"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Doctor Full Name"
              placeholder="e.g. Dr. Robert Chen"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="robert.chen@hospital.com"
              value={docEmail}
              onChange={(e) => setDocEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 555 456 7890"
              value={docPhone}
              onChange={(e) => setDocPhone(e.target.value)}
            />
            <Input
              label="Initial Password"
              type="text"
              value={docPassword}
              onChange={(e) => setDocPassword(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Department"
              value={docDepartmentId}
              onChange={(e) => setDocDepartmentId(e.target.value)}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              required
            />
            <Input
              label="Specialization"
              placeholder="e.g. Interventional Cardiologist"
              value={docSpecialization}
              onChange={(e) => setDocSpecialization(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Qualifications"
              placeholder="MBBS, MD, FACC"
              value={docQualifications}
              onChange={(e) => setDocQualifications(e.target.value)}
              required
            />
            <Input
              label="Experience (Years)"
              type="number"
              min="0"
              value={docExperience}
              onChange={(e) => setDocExperience(e.target.value)}
            />
            <Input
              label="Consultation Fee ($)"
              type="number"
              min="0"
              step="5"
              value={docFee}
              onChange={(e) => setDocFee(e.target.value)}
            />
          </div>

          {/* Random Ward / Room Assignment */}
          <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-900 text-xs flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                Assigned Ward / Room
              </span>
              <button
                type="button"
                onClick={() => setDocRoomNumber(getRandomWard())}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
              >
                <RefreshCw className="h-3 w-3" />
                Randomize Ward
              </button>
            </div>
            <Input
              label="Ward Room Number"
              hideLabel
              value={docRoomNumber}
              onChange={(e) => setDocRoomNumber(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-500">
              Randomly allocated hospital room. Patients and TV screens will be directed here during consultations.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setDoctorDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creatingDoctor}>
              Save & Onboard Doctor
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add Staff Member Dialog */}
      <Dialog
        open={staffDialogOpen}
        onClose={() => setStaffDialogOpen(false)}
        title="Onboard Staff Member"
        description="Create account for Compounder, Pharmacist, Lab Assistant, or Administrator."
        size="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
          <Input
            label="Full Name"
            placeholder="e.g. Sarah Jenkins"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Email Address"
              type="email"
              placeholder="sarah.jenkins@hospital.com"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 555 456 7890"
              value={staffPhone}
              onChange={(e) => setStaffPhone(e.target.value)}
            />
          </div>
          <Input
            label="Initial Password"
            type="text"
            value={staffPassword}
            onChange={(e) => setStaffPassword(e.target.value)}
            required
          />

          <Select
            label="Staff Role"
            value={staffRoleCode}
            onChange={(e) => setStaffRoleCode(e.target.value)}
            placeholder="Select Role"
            options={roles
              .filter((r) => r.code !== "DOCTOR" && r.code !== "PATIENT")
              .map((r) => ({ value: r.code, label: r.name }))}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setStaffDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creatingStaff}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Roles Dialog */}
      <Dialog
        open={editingUser !== null}
        onClose={() => setEditingUser(null)}
        title={`Modify Roles — ${editingUser?.full_name}`}
        description="Select or deselect roles assigned to this user."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button loading={updatingRoles} onClick={handleSaveUserRoles}>
              Save Roles
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 bg-slate-50">
            {roles.map((r) => {
              const checked = userRoleCodes.includes(r.code);
              return (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setUserRoleCodes([...userRoleCodes, r.code]);
                      } else {
                        setUserRoleCodes(userRoleCodes.filter((c) => c !== r.code));
                      }
                    }}
                    className="rounded border-slate-300 text-brand-600"
                  />
                  <span className="text-slate-800 font-medium">{r.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
