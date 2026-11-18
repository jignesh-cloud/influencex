"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { createCampaign } from "@/features/campaigns/actions";
import {
  createCampaignSchema,
  csvToArray,
  PLATFORMS,
  COMPENSATION_TYPES,
  CREATOR_LOCATION_OPTIONS,
  CONTENT_FORMAT_OPTIONS,
  USAGE_RIGHTS_DURATION_OPTIONS,
  type CreateCampaignInput,
} from "@/validators/campaign";
import { FOLLOWER_TIERS } from "@/services/creator-provider/types";

type FormInput = z.input<typeof createCampaignSchema>;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COMPENSATION_LABELS: Record<string, string> = {
  commission_only: "Commission only",
  flat_fee: "Flat fee",
  flat_fee_plus_commission: "Flat fee + commission",
};

interface AffiliateProgramOption {
  id: string;
  network: string;
  programName: string;
}

interface TemplateOption {
  id: string;
  name: string;
  clientId: string | null;
}

export function CampaignBuilderForm({
  clientId,
  affiliatePrograms,
  contentGuidelineTemplates,
}: {
  clientId: string;
  affiliatePrograms: AffiliateProgramOption[];
  contentGuidelineTemplates: TemplateOption[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput, unknown, CreateCampaignInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      product: "",
      platforms: [],
      nicheKeywords: [],
      targetCreatorLocations: [],
      contentStyle: [],
      excludedContentTypes: [],
      showPricingToClient: false,
    },
  });

  const watchedFollowerMin = useWatch({ control: form.control, name: "followerSizeMin" });
  const watchedFollowerMax = useWatch({ control: form.control, name: "followerSizeMax" });

  function onSubmit(values: CreateCampaignInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await createCampaign(clientId, values);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card className="space-y-4 p-5">
        <h2 className="font-semibold text-neutral-900">Basics</h2>

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name">Campaign name</FieldLabel>
              <Input id="name" {...field} placeholder="e.g. Cozy Home Wellness" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="product"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="product">Product / Collection</FieldLabel>
              <Input id="product" {...field} placeholder="e.g. Cozy Home Wellness Collection" />
            </Field>
          )}
        />

        <Controller
          name="platforms"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Platforms</FieldLabel>
              <div className="flex gap-4">
                {PLATFORMS.map((platform) => (
                  <label key={platform} className="flex items-center gap-2 text-sm capitalize">
                    <Checkbox
                      checked={field.value?.includes(platform)}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...(field.value ?? []), platform]
                          : (field.value ?? []).filter((p) => p !== platform);
                        field.onChange(next);
                      }}
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </Field>
          )}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold text-neutral-900">Targeting</h2>

        <Controller
          name="nicheKeywords"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="nicheKeywords">Niche / keywords</FieldLabel>
              <Input
                id="nicheKeywords"
                defaultValue={field.value?.join(", ")}
                onChange={(e) => field.onChange(csvToArray(e.target.value))}
                placeholder="home, wellness, cozy"
              />
              <FieldDescription>Comma-separated</FieldDescription>
            </Field>
          )}
        />

        <Controller
          name="targetCreatorLocations"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Creator locations</FieldLabel>
              <div className="flex flex-wrap gap-4">
                {CREATOR_LOCATION_OPTIONS.map((location) => (
                  <label key={location} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value?.includes(location)}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...(field.value ?? []), location]
                          : (field.value ?? []).filter((l) => l !== location);
                        field.onChange(next);
                      }}
                    />
                    {location}
                  </label>
                ))}
              </div>
            </Field>
          )}
        />

        <Field>
          <FieldLabel>Follower range</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(FOLLOWER_TIERS).map(([key, tier]) => {
              const isActive = watchedFollowerMin === tier.min && watchedFollowerMax === (tier.max ?? undefined);
              return (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => {
                    form.setValue("followerSizeMin", tier.min);
                    form.setValue("followerSizeMax", tier.max ?? undefined);
                  }}
                >
                  {tier.label}
                </Button>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <Controller
              name="followerSizeMin"
              control={form.control}
              render={({ field }) => (
                <Input
                  type="number"
                  placeholder="Custom min"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(Number.isNaN(e.target.valueAsNumber) ? undefined : e.target.valueAsNumber)
                  }
                />
              )}
            />
            <Controller
              name="followerSizeMax"
              control={form.control}
              render={({ field }) => (
                <Input
                  type="number"
                  placeholder="Custom max"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(Number.isNaN(e.target.valueAsNumber) ? undefined : e.target.valueAsNumber)
                  }
                />
              )}
            />
          </div>
        </Field>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold text-neutral-900">Content &amp; compensation</h2>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="contentStyle"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Content format</FieldLabel>
                <div className="flex flex-col gap-2">
                  {CONTENT_FORMAT_OPTIONS.map((format) => (
                    <label key={format} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value?.includes(format)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...(field.value ?? []), format]
                            : (field.value ?? []).filter((f) => f !== format);
                          field.onChange(next);
                        }}
                      />
                      {format}
                    </label>
                  ))}
                </div>
              </Field>
            )}
          />
          <Controller
            name="deliverables"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="deliverables">Deliverables</FieldLabel>
                <Textarea id="deliverables" rows={3} {...field} placeholder="1 feed post + 2 Stories" />
              </Field>
            )}
          />
        </div>

        <Controller
          name="defaultCompensationType"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Default compensation</FieldLabel>
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select compensation type" />
                </SelectTrigger>
                <SelectContent>
                  {COMPENSATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {COMPENSATION_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Controller
          name="usageRightsExpectations"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Usage rights duration</FieldLabel>
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a duration" />
                </SelectTrigger>
                <SelectContent>
                  {USAGE_RIGHTS_DURATION_OPTIONS.map((duration) => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Controller
          name="excludedContentTypes"
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="excludedContentTypes">Excluded content</FieldLabel>
              <Input
                id="excludedContentTypes"
                defaultValue={field.value?.join(", ")}
                onChange={(e) => field.onChange(csvToArray(e.target.value))}
                placeholder="explicit_content, political_content"
              />
              <FieldDescription>Comma-separated</FieldDescription>
            </Field>
          )}
        />

        {affiliatePrograms.length > 0 && (
          <Controller
            name="defaultAffiliateProgramId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Affiliate network / program</FieldLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {affiliatePrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.programName} ({program.network})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold text-neutral-900">Client feedback &amp; guidelines</h2>

        <Controller
          name="showPricingToClient"
          control={form.control}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
              Show compensation/pricing to the client on the public feedback page
            </label>
          )}
        />

        {contentGuidelineTemplates.length > 0 && (
          <Controller
            name="contentGuidelineTemplateId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Content guideline template</FieldLabel>
                <Select value={field.value || undefined} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentGuidelineTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                        {template.clientId === null ? " (Group 8A global)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Rules are filled out by the account manager under Settings → Content Guidelines.
                </FieldDescription>
              </Field>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="startDate"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="startDate">Start date</FieldLabel>
                <Input id="startDate" type="date" {...field} />
              </Field>
            )}
          />
          <Controller
            name="endDate"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="endDate">End date</FieldLabel>
                <Input id="endDate" type="date" {...field} />
              </Field>
            )}
          />
        </div>
      </Card>

      {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create campaign"}
        </Button>
      </div>
    </form>
  );
}
