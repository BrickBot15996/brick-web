import { useParams, useRouter } from '@tanstack/react-router';
import { useCreateSponsor, useDeleteSponsor, useSponsors, useTiers, useUpdateSponsor } from './data/hooks';
import type { Sponsor, SponsorInput } from './data/types';
import { useSeasons } from '../../lib/data/hooks';
import { isUrl } from '../../lib/format';
import type { Errors } from '../../lib/form';
import { useEditForm } from '../../lib/form';
import { EditorFrame, EditorMissing, EditorSkeleton, ImageField, SelectField, TextField } from '../../components/edit';
import { SPONSORS_BASE } from './SponsorsList';

const BASE = SPONSORS_BASE;

interface SponsorForm { name: string; logo: string | null; website: string; season: string; tier: string }

function validate(f: SponsorForm): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'Enter the sponsor’s name.';
  if (!isUrl(f.website)) e.website = 'Enter a full address that starts with https://.';
  if (!f.season) e.season = 'Choose the season they sponsor.';
  if (!f.tier) e.tier = 'Choose a tier.';
  return e;
}

export function SponsorEdit() {
  const { id } = useParams({ strict: false }) as { id: string };
  const q = useSponsors();
  const seasons = useSeasons();
  const tiers = useTiers();
  if (q.isPending || seasons.isPending || tiers.isPending) return <EditorSkeleton />;
  const sponsor = q.data?.find((s) => s.id === id);
  if (!sponsor) return <EditorMissing noun="sponsor" backHref={BASE} backLabel="All sponsors" />;
  return <SponsorEditor key={sponsor.id} sponsor={sponsor} />;
}

export function SponsorNew() {
  const seasons = useSeasons();
  const tiers = useTiers();
  if (seasons.isPending || tiers.isPending) return <EditorSkeleton />;
  return <SponsorEditor key="new" />;
}

function SponsorEditor({ sponsor }: { sponsor?: Sponsor }) {
  const router = useRouter();
  const seasons = useSeasons().data ?? [];
  const tiers = useTiers().data ?? [];
  const create = useCreateSponsor();
  const update = useUpdateSponsor();
  const del = useDeleteSponsor();

  const toInput = (v: SponsorForm): SponsorInput => ({ name: v.name.trim(), logo: v.logo, website: v.website.trim(), season: v.season, tier: v.tier });
  const form = useEditForm<SponsorForm>({
    initial: sponsor
      ? { name: sponsor.name, logo: sponsor.logo, website: sponsor.website, season: sponsor.season, tier: sponsor.tier }
      : { name: '', logo: null, website: '', season: seasons.find((s) => s.current)?.id ?? '', tier: '' },
    validate,
    save: (v) => (sponsor ? update.mutateAsync({ id: sponsor.id, input: toInput(v) }) : create.mutateAsync(toInput(v))),
    onSaved: (res) => { if (!sponsor) router.history.replace(`${BASE}/${(res as Sponsor).id}`); },
  });

  return (
    <EditorFrame
      form={form}
      title={sponsor ? sponsor.name : 'New sponsor'}
      edited={sponsor ? { by: sponsor.editedBy, at: sponsor.editedAt } : null}
      back={{ href: BASE, label: 'All sponsors' }}
      viewHref={sponsor ? `${import.meta.env.VITE_WEBSITE_URL}/en/sponsors` : undefined}
      remove={sponsor ? { noun: 'sponsor', run: () => del.mutateAsync(sponsor.id), then: BASE } : undefined}
    >
      <TextField name="name" label="Name" />
      <ImageField name="logo" label="Logo" tile="dark" folders={['sponsors/']} hint="Shown on the Our Sponsors page and the footer strip." />
      <TextField name="website" label="Website" type="url" optional placeholder="https://" />
      <SelectField name="season" label="Season" placeholder="Choose a season" options={seasons.map((s) => ({ value: s.id, label: `${s.game} ${s.years}${s.current ? ' (current)' : ''}` }))} />
      <SelectField name="tier" label="Tier" placeholder="Choose a tier" hint="Internal only. Tiers are never shown on the website." options={tiers.map((t) => ({ value: t.id, label: `${t.name} · €${t.amount}` }))} />
    </EditorFrame>
  );
}
