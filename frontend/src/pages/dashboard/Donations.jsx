import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import * as donationsApi from "../../api/donations";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import { extractErrorMessage } from "../../utils/errors";

const STAFF_ROLES = ["head_admin", "moderator"];

export default function Donations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = STAFF_ROLES.includes(user?.role);
  const isDonor = user?.role === "donor";

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [donateFor, setDonateFor] = useState(null);
  const [error, setError] = useState("");

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: donationsApi.listCampaigns,
  });

  const { data: myDonations = [] } = useQuery({
    queryKey: ["my-donations"],
    queryFn: donationsApi.myDonations,
    enabled: isDonor,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["campaigns"] });

  const campaignForm = useForm();
  const donateForm = useForm();

  const createCampaignMutation = useMutation({
    mutationFn: donationsApi.createCampaign,
    onSuccess: () => {
      invalidate();
      setCampaignModalOpen(false);
      campaignForm.reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not create campaign.")),
  });

  const donateMutation = useMutation({
    mutationFn: ({ campaignId, data }) => donationsApi.donateToCampaign(campaignId, data),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["my-donations"] });
      setDonateFor(null);
      donateForm.reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not process donation.")),
  });

  const onCreateCampaign = (data) => {
    setError("");
    createCampaignMutation.mutate({
      title: data.title,
      description: data.description,
      goal_amount: Number(data.goal_amount) || 0,
    });
  };

  const onDonate = (data) => {
    setError("");
    donateMutation.mutate({
      campaignId: donateFor,
      data: { amount: Number(data.amount), message: data.message || null },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Donation Campaigns</h1>
        {isStaff && <Button onClick={() => setCampaignModalOpen(true)}>+ New campaign</Button>}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading campaigns...</p>
      ) : campaigns.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">No campaigns yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const pct = c.goal_amount > 0 ? Math.min(100, Math.round((c.raised_amount / c.goal_amount) * 100)) : 0;
            return (
              <Card key={c.id}>
                <h3 className="font-semibold text-slate-900">{c.title}</h3>
                {c.description && <p className="mt-1 text-sm text-slate-500">{c.description}</p>}

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>${c.raised_amount.toLocaleString()} raised</span>
                    <span>${c.goal_amount.toLocaleString()} goal</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{c.donor_count} donor(s)</p>
                </div>

                {isDonor && c.is_active && (
                  <Button className="mt-4 w-full" onClick={() => setDonateFor(c.id)}>
                    Donate
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {isDonor && myDonations.length > 0 && (
        <Card title="My donation history">
          <div className="space-y-2">
            {myDonations.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600">{new Date(d.created_at).toLocaleDateString()}</span>
                <span className="font-medium text-slate-800">${d.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={campaignModalOpen} onClose={() => setCampaignModalOpen(false)} title="Create a campaign">
        <form onSubmit={campaignForm.handleSubmit(onCreateCampaign)} className="space-y-4">
          <Input
            label="Title"
            error={campaignForm.formState.errors.title?.message}
            {...campaignForm.register("title", { required: "Required" })}
          />
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input-field" {...campaignForm.register("description")} />
          </div>
          <Input
            label="Goal amount ($)"
            type="number"
            step="0.01"
            {...campaignForm.register("goal_amount")}
          />
          <Button type="submit" className="w-full" disabled={createCampaignMutation.isPending}>
            {createCampaignMutation.isPending ? "Creating..." : "Create campaign"}
          </Button>
        </form>
      </Modal>

      <Modal open={!!donateFor} onClose={() => setDonateFor(null)} title="Make a donation">
        <form onSubmit={donateForm.handleSubmit(onDonate)} className="space-y-4">
          <Input
            label="Amount ($)"
            type="number"
            step="0.01"
            error={donateForm.formState.errors.amount?.message}
            {...donateForm.register("amount", { required: "Required", min: { value: 1, message: "Minimum $1" } })}
          />
          <Input label="Message (optional)" {...donateForm.register("message")} />
          <Button type="submit" className="w-full" disabled={donateMutation.isPending}>
            {donateMutation.isPending ? "Processing..." : "Donate"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
