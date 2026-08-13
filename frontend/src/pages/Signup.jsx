import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";
import { useAuth } from "../context/AuthContext";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { extractErrorMessage } from "../utils/errors";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await authApi.signup(data.fullName, data.email, data.password, data.role);
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err) {
      setServerError(extractErrorMessage(err, "Could not create your account."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-bold text-slate-900">Create your account</h1>
        <p className="mb-6 text-sm text-slate-500">Sign up as a student to start learning.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">I'm joining as</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium has-[:checked]:border-brand has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                <input type="radio" value="student" defaultChecked className="hidden" {...register("role")} />
                Student
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium has-[:checked]:border-brand has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700">
                <input type="radio" value="donor" className="hidden" {...register("role")} />
                Donor
              </label>
            </div>
          </div>

          <Input
            label="Full name"
            placeholder="Jane Doe"
            error={errors.fullName?.message}
            {...register("fullName", { required: "Full name is required" })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email", { required: "Email is required" })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "At least 8 characters" },
            })}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              validate: (value) => value === watch("password") || "Passwords do not match",
            })}
          />

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
