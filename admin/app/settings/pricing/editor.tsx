"use client";

import { useState, useTransition } from "react";
import {
  PRICING_MAX_FEATURES,
  PRICING_MAX_PLANS,
  PRICING_TEMPLATES,
  type Plan,
} from "@/lib/types";
import { savePricing } from "./actions";

/**
 * The pricing plan editor. Client component because the whole point is to
 * edit text on the cards - a server round trip per keystroke would be absurd
 * for a form this dense.
 *
 * FOUR CARD SLOTS, ALWAYS. Unlike a form where the admin adds and removes
 * rows, this presents exactly four cards at once. Ones the admin has saved
 * fill in first; empty slots show the pre-made templates from `lib/types`
 * so a first-time visitor sees something to react to, not four blank cards
 * to write from zero. The user edits text in place - the "input" IS the
 * card, the same shape the landing will render.
 *
 * PUBLISH IS A PER-CARD TOGGLE. Only cards with `enabled=true` reach the
 * landing. Nothing enabled -> the landing renders its localised fallback,
 * which is what the user sees on any fresh install. That is the switch that
 * lets four drafts live on this screen while zero of them ship.
 *
 * TWO-LEVEL VALIDATION. The API is the security boundary: it re-checks the
 * shape and refuses an `enabled` card with empty required fields. This
 * client-side check catches the obvious mistakes BEFORE save so the operator
 * gets the message here rather than as a 400. Neither is enough on its own.
 *
 * The server action `savePricing` carries the token; nothing here talks to
 * the api directly, and there is no fetch to leak a session. Same split the
 * whole admin service exists to enforce (see `lib/api.ts`'s `server-only`
 * note).
 */
export function PricingEditor({ initial }: { initial: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(() => makeSlots(initial));
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const patch = (index: number, changes: Partial<Plan>) => {
    setStatus("idle");
    setPlans((current) =>
      current.map((p, i) => (i === index ? { ...p, ...changes } : p))
    );
  };

  const patchFeature = (planIndex: number, featureIndex: number, value: string) => {
    setStatus("idle");
    setPlans((current) =>
      current.map((p, i) =>
        i === planIndex
          ? {
              ...p,
              features: p.features.map((f, j) => (j === featureIndex ? value : f)),
            }
          : p
      )
    );
  };

  const addFeature = (planIndex: number) => {
    setStatus("idle");
    setPlans((current) =>
      current.map((p, i) =>
        i === planIndex ? { ...p, features: [...p.features, ""] } : p
      )
    );
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    setStatus("idle");
    setPlans((current) =>
      current.map((p, i) =>
        i === planIndex
          ? { ...p, features: p.features.filter((_, j) => j !== featureIndex) }
          : p
      )
    );
  };

  const resetSlot = (index: number) => {
    if (!confirm(`Reset card ${index + 1} to its template? Unsaved edits are lost.`)) return;
    setStatus("idle");
    setPlans((current) =>
      current.map((p, i) => (i === index ? PRICING_TEMPLATES[i] : p))
    );
  };

  const validationError = validate(plans);
  const publishedCount = plans.filter((p) => p.enabled).length;

  const save = () => {
    if (validationError) return;
    // Trim every text field before shipping - the API rejects `enabled` cards
    // with empty required fields, and an all-spaces name shouldn't slip past
    // the check on the operator side either.
    const clean = plans.map((p) => ({
      ...p,
      id: p.id.trim(),
      name: p.name.trim(),
      desc: p.desc.trim(),
      price: p.price.trim(),
      per: p.per.trim(),
      cta: p.cta.trim(),
      badge: p.badge?.trim() || null,
      features: p.features.map((f) => f.trim()).filter(Boolean),
    }));
    startTransition(async () => {
      try {
        await savePricing(clean);
        setStatus("saved");
        setPlans(clean);
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Save failed.");
      }
    });
  };

  return (
    <>
      <div className="pricing-legend">
        <div>
          <b>
            {publishedCount === 0
              ? "Nothing published"
              : publishedCount === 1
              ? "1 card published"
              : `${publishedCount} cards published`}
          </b>
          {publishedCount === 0 && (
            <span className="sub" style={{ marginLeft: 8 }}>
              — the landing shows its default cards in each visitor&apos;s language.
            </span>
          )}
        </div>
      </div>

      <div className="pricing-preview">
        {plans.map((plan, i) => (
          <PlanCard
            key={i}
            plan={plan}
            index={i}
            onChange={(changes) => patch(i, changes)}
            onFeatureChange={(fi, v) => patchFeature(i, fi, v)}
            onFeatureAdd={() => addFeature(i)}
            onFeatureRemove={(fi) => removeFeature(i, fi)}
            onReset={() => resetSlot(i)}
          />
        ))}
      </div>

      <div className="pricing-actions">
        <button
          type="button"
          className="act"
          onClick={save}
          disabled={pending || Boolean(validationError)}
          style={{ fontWeight: 600 }}
        >
          {pending ? "Saving…" : "Save all cards"}
        </button>
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
    </>
  );
}

/* -------------------------------------------------------- One card */

function PlanCard({
  plan,
  index,
  onChange,
  onFeatureChange,
  onFeatureAdd,
  onFeatureRemove,
  onReset,
}: {
  plan: Plan;
  index: number;
  onChange: (changes: Partial<Plan>) => void;
  onFeatureChange: (featureIndex: number, value: string) => void;
  onFeatureAdd: () => void;
  onFeatureRemove: (featureIndex: number) => void;
  onReset: () => void;
}) {
  const cls = [
    "mkt-plan",
    plan.featured ? "featured" : "",
    plan.enabled ? "is-enabled" : "is-draft",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      {/* Publish toggle sits above the card content so the operator can flip a
          card on/off without scrolling to a save section far away. */}
      <div className="card-toolbar">
        <label className="publish-toggle">
          <input
            type="checkbox"
            checked={plan.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          <span>{plan.enabled ? "Published" : "Draft"}</span>
        </label>
        <span className="card-tools">
          <label className="feature-toggle" title="Featured (dark card, brighter checks)">
            <input
              type="checkbox"
              checked={plan.featured}
              onChange={(e) => onChange({ featured: e.target.checked })}
            />
            <span>Featured</span>
          </label>
          <button
            type="button"
            className="act tiny"
            onClick={onReset}
            title="Reset this slot to its template"
          >
            Reset
          </button>
        </span>
      </div>

      {/* Badge is edit-in-place; if empty the badge line disappears just like
          on the landing (which only renders `plan.badge && ...`). */}
      <input
        className="mkt-plan-badge edit-inline"
        placeholder="+ Add badge (optional)"
        maxLength={30}
        value={plan.badge ?? ""}
        onChange={(e) => onChange({ badge: e.target.value || null })}
      />
      <input
        className="mkt-plan-name edit-inline"
        placeholder="Plan name"
        maxLength={40}
        value={plan.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <input
        className="mkt-plan-desc edit-inline"
        placeholder="One-line description"
        maxLength={200}
        value={plan.desc}
        onChange={(e) => onChange({ desc: e.target.value })}
      />
      <div className="mkt-plan-price">
        <input
          className="edit-inline price"
          placeholder="$0"
          maxLength={20}
          value={plan.price}
          onChange={(e) => onChange({ price: e.target.value })}
        />
        <input
          className="edit-inline per"
          placeholder="/month"
          maxLength={20}
          value={plan.per}
          onChange={(e) => onChange({ per: e.target.value })}
        />
      </div>

      <ul className="mkt-plan-features">
        {plan.features.map((feat, i) => (
          <li key={i}>
            <input
              className="edit-inline"
              placeholder="Feature description"
              maxLength={100}
              value={feat}
              onChange={(e) => onFeatureChange(i, e.target.value)}
            />
            <button
              type="button"
              className="feature-remove"
              onClick={() => onFeatureRemove(i)}
              title="Remove feature"
            >
              &times;
            </button>
          </li>
        ))}
        {plan.features.length < PRICING_MAX_FEATURES && (
          <li>
            <button
              type="button"
              className="feature-add"
              onClick={onFeatureAdd}
            >
              + Add feature
            </button>
          </li>
        )}
      </ul>

      <input
        className="mkt-plan-cta edit-inline"
        placeholder="CTA button label"
        maxLength={40}
        value={plan.cta}
        onChange={(e) => onChange({ cta: e.target.value })}
      />
    </div>
  );
}

/* ---------------------------------------------------------- Helpers */

/**
 * Always return exactly PRICING_MAX_PLANS slots. Ones the admin has saved
 * come first; empty slots are backfilled from the pre-made templates so the
 * screen shows the same four positions every time.
 *
 * The templates ARE the empty state - not a blank slot. That is what
 * "hazır güzel görünüşlü 4 kartlık" resolves to: the admin never faces a
 * blank slate, only material to react to.
 */
function makeSlots(saved: Plan[]): Plan[] {
  const out: Plan[] = saved.slice(0, PRICING_MAX_PLANS);
  for (let i = out.length; i < PRICING_MAX_PLANS; i++) {
    out.push({ ...PRICING_TEMPLATES[i], features: [...PRICING_TEMPLATES[i].features] });
  }
  return out;
}

/**
 * Returns a human-readable reason `Save` should stay disabled, or `null` when
 * the current set is submittable. Only ENABLED cards need to be complete: a
 * draft with a half-written feature is fine and travels to the DB verbatim.
 */
function validate(plans: Plan[]): string | null {
  const enabledIds = new Set<string>();
  for (const [i, plan] of plans.entries()) {
    const label = `Card ${i + 1}`;
    if (!plan.id.trim()) return `${label}: ID is required.`;
    if (!/^[a-z0-9-]+$/.test(plan.id)) {
      return `${label}: ID must be lowercase letters, digits, hyphens.`;
    }
    if (plan.enabled) {
      if (enabledIds.has(plan.id)) {
        return `${label}: ID "${plan.id}" is used twice among published cards.`;
      }
      enabledIds.add(plan.id);
      const missing = (["name", "desc", "price", "per", "cta"] as const).find(
        (k) => !plan[k].trim()
      );
      if (missing) {
        return `${label}: "${missing}" is required to publish. Fill it or turn Draft on.`;
      }
      if (plan.features.some((f) => !f.trim())) {
        return `${label}: An empty feature will publish blank. Fill it or remove.`;
      }
    }
  }
  return null;
}
