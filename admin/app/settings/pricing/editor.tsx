"use client";

import { useState, useTransition } from "react";
import { PRICING_MAX_FEATURES, PRICING_MAX_PLANS, type Plan } from "@/lib/types";
import { savePricing } from "./actions";

/**
 * The pricing plan editor. Client component because add / remove / reorder
 * are state operations that only make sense with local memory - a
 * server-round-trip per keystroke would be absurd for a form this dense.
 *
 * The server action `savePricing` is what carries the token; nothing here
 * talks to the api directly, and there is no fetch to leak an admin session.
 * That is the split the whole admin service exists to enforce (see
 * lib/api.ts's `server-only` note).
 *
 * Validation lives in TWO places: this component prevents the obvious errors
 * (empty required fields, over-length ids) so save is not clicked into an
 * error, and the API re-validates on receive. Neither is enough on its own -
 * the api one is the security boundary; this one is the UX boundary.
 */
export function PricingEditor({ initial }: { initial: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updatePlan = (index: number, patch: Partial<Plan>) => {
    setStatus("idle");
    setPlans((current) =>
      current.map((plan, i) => (i === index ? { ...plan, ...patch } : plan))
    );
  };

  const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
    setStatus("idle");
    setPlans((current) =>
      current.map((plan, i) =>
        i === planIndex
          ? {
              ...plan,
              features: plan.features.map((feat, j) =>
                j === featureIndex ? value : feat
              ),
            }
          : plan
      )
    );
  };

  const addFeature = (planIndex: number) => {
    setStatus("idle");
    setPlans((current) =>
      current.map((plan, i) =>
        i === planIndex
          ? { ...plan, features: [...plan.features, ""] }
          : plan
      )
    );
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setStatus("idle");
    setPlans((current) =>
      current.map((plan, i) =>
        i === planIndex
          ? {
              ...plan,
              features: plan.features.filter((_, j) => j !== featureIndex),
            }
          : plan
      )
    );
  };

  const addPlan = () => {
    setStatus("idle");
    setPlans((current) => [
      ...current,
      {
        id: newPlanId(current),
        name: "",
        desc: "",
        price: "",
        per: "/month",
        features: [""],
        cta: "Get started",
        featured: false,
        badge: null,
      },
    ]);
  };

  const removePlan = (index: number) => {
    if (!confirm("Remove this plan? Save applies the change.")) return;
    setStatus("idle");
    setPlans((current) => current.filter((_, i) => i !== index));
  };

  const movePlan = (from: number, direction: -1 | 1) => {
    const to = from + direction;
    if (to < 0 || to >= plans.length) return;
    setStatus("idle");
    setPlans((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const validationError = validate(plans);

  const save = () => {
    if (validationError) return;
    // Trim leading/trailing whitespace on every field before shipping - the
    // API's `min_length=1` refuses an all-spaces value, which is a user error
    // the admin shouldn't be forced to hunt for.
    const clean = plans.map((plan) => ({
      ...plan,
      id: plan.id.trim(),
      name: plan.name.trim(),
      desc: plan.desc.trim(),
      price: plan.price.trim(),
      per: plan.per.trim(),
      cta: plan.cta.trim(),
      badge: plan.badge?.trim() || null,
      features: plan.features.map((f) => f.trim()).filter(Boolean),
    }));
    startTransition(async () => {
      try {
        await savePricing(clean);
        setStatus("saved");
        setPlans(clean);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Save failed."
        );
      }
    });
  };

  return (
    <div style={{ marginTop: 20 }}>
      {plans.length === 0 && (
        <div className="empty" style={{ marginBottom: 16 }}>
          No plans saved. The landing is rendering its hardcoded fallback.
          Click <em>Add plan</em> to start editing.
        </div>
      )}

      {plans.map((plan, i) => (
        <PlanEditor
          key={i}
          plan={plan}
          index={i}
          total={plans.length}
          onChange={(patch) => updatePlan(i, patch)}
          onFeatureChange={(fi, v) => updateFeature(i, fi, v)}
          onFeatureAdd={() => addFeature(i)}
          onFeatureRemove={(fi) => removeFeature(i, fi)}
          onRemove={() => removePlan(i)}
          onMoveUp={() => movePlan(i, -1)}
          onMoveDown={() => movePlan(i, 1)}
        />
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="act"
          onClick={addPlan}
          disabled={plans.length >= PRICING_MAX_PLANS}
        >
          + Add plan
        </button>
        <button
          type="button"
          className="act"
          onClick={save}
          disabled={pending || Boolean(validationError)}
          style={{
            fontWeight: 600,
            borderColor: validationError ? undefined : "var(--focus, currentColor)",
          }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {plans.length >= PRICING_MAX_PLANS && (
          <span className="empty" style={{ padding: 0 }}>
            Maximum {PRICING_MAX_PLANS} plans.
          </span>
        )}
        {validationError && (
          <span className="neg" style={{ fontSize: 13 }}>{validationError}</span>
        )}
        {status === "saved" && !pending && (
          <span style={{ color: "var(--ok, currentColor)", fontSize: 13 }}>
            Saved. The landing picks this up on next load.
          </span>
        )}
        {status === "error" && errorMessage && (
          <span className="neg" style={{ fontSize: 13 }}>{errorMessage}</span>
        )}
      </div>
    </div>
  );
}

function PlanEditor({
  plan,
  index,
  total,
  onChange,
  onFeatureChange,
  onFeatureAdd,
  onFeatureRemove,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  plan: Plan;
  index: number;
  total: number;
  onChange: (patch: Partial<Plan>) => void;
  onFeatureChange: (featureIndex: number, value: string) => void;
  onFeatureAdd: () => void;
  onFeatureRemove: (featureIndex: number) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="plan-editor">
      <div className="plan-editor-head">
        <b>Plan {index + 1}</b>
        <span style={{ display: "inline-flex", gap: 6, marginLeft: "auto" }}>
          <button
            type="button"
            className="act"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move up"
          >
            &uarr;
          </button>
          <button
            type="button"
            className="act"
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="Move down"
          >
            &darr;
          </button>
          <button
            type="button"
            className="act warn"
            onClick={onRemove}
            title="Remove plan"
          >
            Remove
          </button>
        </span>
      </div>

      <div className="plan-editor-grid">
        <Field label="ID (slug)" hint="lowercase, digits, hyphens">
          <input
            value={plan.id}
            maxLength={32}
            onChange={(e) => onChange({ id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
          />
        </Field>
        <Field label="Name" hint="e.g. Starter">
          <input
            value={plan.name}
            maxLength={40}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <Field label="Description" hint="one line">
          <input
            value={plan.desc}
            maxLength={200}
            onChange={(e) => onChange({ desc: e.target.value })}
          />
        </Field>
        <Field label="Price" hint="text — e.g. $49 or Custom">
          <input
            value={plan.price}
            maxLength={20}
            onChange={(e) => onChange({ price: e.target.value })}
          />
        </Field>
        <Field label="Period" hint="e.g. /month, /year">
          <input
            value={plan.per}
            maxLength={20}
            onChange={(e) => onChange({ per: e.target.value })}
          />
        </Field>
        <Field label="CTA text" hint="button label">
          <input
            value={plan.cta}
            maxLength={40}
            onChange={(e) => onChange({ cta: e.target.value })}
          />
        </Field>
        <Field label="Badge" hint="optional — e.g. Most Popular">
          <input
            value={plan.badge ?? ""}
            maxLength={30}
            onChange={(e) => onChange({ badge: e.target.value || null })}
          />
        </Field>
        <Field label="Featured" hint="dark card + brighter checks">
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={plan.featured}
              onChange={(e) => onChange({ featured: e.target.checked })}
              style={{ width: "auto", padding: 0, margin: 0 }}
            />
            <span style={{ fontSize: 13 }}>Featured</span>
          </label>
        </Field>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
          Features
          <span className="sub" style={{ marginLeft: 8, fontSize: 12 }}>
            up to {PRICING_MAX_FEATURES} bullet points
          </span>
        </label>
        {plan.features.length === 0 && (
          <div className="empty" style={{ padding: "6px 0" }}>
            No features. Add one below.
          </div>
        )}
        {plan.features.map((feat, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <input
              value={feat}
              maxLength={100}
              placeholder="Feature description"
              onChange={(e) => onFeatureChange(i, e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="act warn"
              onClick={() => onFeatureRemove(i)}
              title="Remove feature"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          className="act"
          onClick={onFeatureAdd}
          disabled={plan.features.length >= PRICING_MAX_FEATURES}
          style={{ marginTop: 4 }}
        >
          + Feature
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block", fontSize: 13 }}>
      <span style={{ display: "block", marginBottom: 4 }}>
        {label}
        {hint && (
          <span className="sub" style={{ marginLeft: 6, fontSize: 11.5 }}>
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------- helpers */

function newPlanId(existing: Plan[]): string {
  const taken = new Set(existing.map((p) => p.id));
  for (let i = 1; i <= PRICING_MAX_PLANS + 1; i++) {
    const candidate = `plan-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `plan-${Date.now()}`;
}

/** Returns a human-readable reason the save button should stay disabled, or
 *  `null` if the current plan set is submittable. Kept as pure text so the
 *  editor can render it beside the save button without more state. */
function validate(plans: Plan[]): string | null {
  const ids = new Set<string>();
  for (const [i, plan] of plans.entries()) {
    const n = i + 1;
    if (!plan.id.trim()) return `Plan ${n}: ID is required.`;
    if (!/^[a-z0-9-]+$/.test(plan.id)) {
      return `Plan ${n}: ID must be lowercase letters, digits, hyphens.`;
    }
    if (ids.has(plan.id)) return `Plan ${n}: ID "${plan.id}" is used twice.`;
    ids.add(plan.id);
    if (!plan.name.trim()) return `Plan ${n}: Name is required.`;
    if (!plan.desc.trim()) return `Plan ${n}: Description is required.`;
    if (!plan.price.trim()) return `Plan ${n}: Price is required.`;
    if (!plan.per.trim()) return `Plan ${n}: Period is required.`;
    if (!plan.cta.trim()) return `Plan ${n}: CTA text is required.`;
    const emptyFeature = plan.features.some((f) => !f.trim());
    if (emptyFeature) return `Plan ${n}: A feature is empty. Fill it or remove.`;
  }
  return null;
}
