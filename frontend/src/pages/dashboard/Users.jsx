import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../../api/users";
import { downloadFile } from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Table from "../../components/ui/Table";
import { extractErrorMessage } from "../../utils/errors";

const PERMISSION_FIELDS = [
  { key: "can_manage_users", label: "Manage users" },
  { key: "can_manage_courses", label: "Manage courses" },
  { key: "can_manage_resources", label: "Manage resources" },
  { key: "can_manage_enrollments", label: "Manage enrollments" },
  { key: "can_view_reports", label: "View reports" },
];

const ROLES = ["student", "instructor", "moderator", "donor"];

export default function Users() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [rowError, setRowError] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.listUsers,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({ mutationFn: usersApi.createModerator });

  const promoteMutation = useMutation({
    mutationFn: ({ userId, role }) => usersApi.promoteUser(userId, role),
    onSuccess: invalidate,
    onError: (err) => setRowError(extractErrorMessage(err, "Could not change role.")),
  });

  const activeMutation = useMutation({
    mutationFn: ({ userId, isActive }) => usersApi.setUserActive(userId, isActive),
    onSuccess: invalidate,
    onError: (err) => setRowError(extractErrorMessage(err, "Could not update status.")),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onCreate = async (data) => {
    setCreateError("");
    try {
      await createMutation.mutateAsync({
        full_name: data.fullName,
        email: data.email,
        password: data.password,
        permissions: Object.fromEntries(PERMISSION_FIELDS.map((f) => [f.key, !!data[f.key]])),
      });
      invalidate();
      reset();
      setModalOpen(false);
    } catch (err) {
      setCreateError(extractErrorMessage(err, "Could not create moderator."));
    }
  };

  const columns = [
    { key: "full_name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (row) =>
        row.role === "head_admin" ? (
          <span className="capitalize">Head admin</span>
        ) : (
          <select
            value={row.role}
            onChange={(e) => {
              setRowError("");
              promoteMutation.mutate({ userId: row.id, role: e.target.value });
            }}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm capitalize"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ),
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) =>
        row.role === "head_admin" ? (
          "Active"
        ) : (
          <button
            onClick={() => {
              setRowError("");
              activeMutation.mutate({ userId: row.id, isActive: !row.is_active });
            }}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              row.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {row.is_active ? "Active" : "Inactive"}
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Users &amp; Moderators</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => downloadFile("/api/users/export.csv", "users.csv")}>
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setCreateError("");
              setModalOpen(true);
            }}
          >
            + New moderator
          </Button>
        </div>
      </div>

      {rowError && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{rowError}</p>}

      <Card>
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <Table columns={columns} rows={users} />
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create a moderator">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input
            label="Full name"
            error={errors.fullName?.message}
            {...register("fullName", { required: "Required" })}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email", { required: "Required" })}
          />
          <Input
            label="Temporary password"
            type="password"
            error={errors.password?.message}
            {...register("password", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })}
          />

          <div>
            <label className="label">Permissions</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PERMISSION_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="rounded border-slate-300" {...register(f.key)} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {createError && <p className="text-sm text-red-600">{createError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create moderator"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
