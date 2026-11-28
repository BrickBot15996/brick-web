import { useEffect } from 'react';
import { useSaveSettings, useSettings } from './data/hooks';
import type { Network, SiteSettings, SiteSettingsInput } from './data/types';
import { BilingualField, Callout, Repeater, Section, SelectField, SettingsError, SettingsPage, SettingsSkeleton, TextField } from '../../components/edit';
import { AppLink } from '../../components/AppLink';
import type { Errors } from '../../lib/form';
import { uid, useEditForm, useForm } from '../../lib/form';
import { NETWORKS, networkLabel } from './networks';
import { cifValid, emailValid, groupIban, ibanValid, mapsEmbedError, mapsLinkError, socialUrlError } from './validate';

interface SettingsForm {
  email: string;
  address: { en: string; ro: string };
  mapsEmbed: string;
  mapsLink: string;
  assoc: { name: string; cif: string; bank: string; branch: { en: string; ro: string }; iban: string };
  socials: { k: string; network: Network | ''; url: string }[];
}

const toForm = (s: SiteSettings): SettingsForm => ({
  email: s.email,
  address: { ...s.address },
  mapsEmbed: s.mapsEmbed,
  mapsLink: s.mapsLink,
  assoc: { name: s.association.name, cif: s.association.cif, bank: s.association.bank, branch: { ...s.association.branch }, iban: groupIban(s.association.iban) },
  socials: s.socials.map((x) => ({ k: uid(), ...x })),
});

function validate(f: SettingsForm): Errors {
  const e: Errors = {};
  if (!f.email.trim()) e.email = 'Enter the contact email.';
  else if (!emailValid(f.email)) e.email = 'This does not look like an email address.';
  if (!f.address.en.trim()) e['address.en'] = 'Enter the address.';
  const embed = mapsEmbedError(f.mapsEmbed);
  if (embed) e.mapsEmbed = embed;
  const link = mapsLinkError(f.mapsLink);
  if (link) e.mapsLink = link;
  if (!f.assoc.name.trim()) e['assoc.name'] = 'Enter the association’s legal name.';
  if (!f.assoc.cif.trim()) e['assoc.cif'] = 'Enter the CIF.';
  else if (!cifValid(f.assoc.cif)) e['assoc.cif'] = 'This CIF does not pass the check digit. Look for a mistyped digit.';
  if (!f.assoc.bank.trim()) e['assoc.bank'] = 'Enter the bank.';
  if (!f.assoc.iban.trim()) e['assoc.iban'] = 'Enter the IBAN.';
  else if (!ibanValid(f.assoc.iban)) e['assoc.iban'] = 'This IBAN does not pass the checksum. Look for a mistyped character.';
  const seen = new Set<string>();
  f.socials.forEach((s, i) => {
    if (!s.network) e[`socials.${i}.network`] = 'Choose the network.';
    else if (seen.has(s.network)) e[`socials.${i}.network`] = `${networkLabel(s.network)} is already in the list.`;
    seen.add(s.network);
    const u = socialUrlError(s.network, s.url);
    if (u) e[`socials.${i}.url`] = u;
  });
  return e;
}

const toInput = (f: SettingsForm): SiteSettingsInput => ({
  email: f.email.trim(),
  address: { en: f.address.en.trim(), ro: f.address.ro.trim() },
  mapsEmbed: f.mapsEmbed.trim(),
  mapsLink: f.mapsLink.trim(),
  association: { name: f.assoc.name.trim(), cif: f.assoc.cif.replace(/\s+/g, ''), bank: f.assoc.bank.trim(), branch: { en: f.assoc.branch.en.trim(), ro: f.assoc.branch.ro.trim() }, iban: f.assoc.iban.replace(/\s+/g, '').toUpperCase() },
  socials: f.socials.map((s) => ({ network: s.network as Network, url: s.url.trim() })),
});

export function SettingsPageRoute() {
  const q = useSettings();
  if (q.isPending) return <SettingsSkeleton />;
  if (q.isError) return <SettingsError onRetry={() => void q.refetch()} />;
  return <SettingsEditor settings={q.data} />;
}

function SettingsEditor({ settings }: { settings: SiteSettings }) {
  const save = useSaveSettings();
  const form = useEditForm<SettingsForm>({ initial: toForm(settings), validate, save: (v) => save.mutateAsync(toInput(v)) });

  // The jump palette opens /settings#socials: scroll that section into view once the form is on screen.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
  }, []);

  return (
    <SettingsPage form={form} title="Site settings" edited={{ by: settings.editedBy, at: settings.editedAt }} viewHref={`${import.meta.env.VITE_WEBSITE_URL}/en/contact`}>
      <div id="contact" className="set-anchor">
        <Section title="Contact" note="Shown on the Contact page and in the footer.">
          <TextField name="email" label="Contact email" type="email" hint="The only public email address. The contact form is always sent to it. There is no public phone number." />
        </Section>
      </div>
      <div id="address" className="set-anchor">
        <Section title="Address and map" note="The Contact page shows the Business Profile on Google Maps, with a link to open it.">
          <BilingualField name="address" label="Address" />
          <TextField name="mapsEmbed" label="Google Maps embed address" type="url" optional placeholder="https://www.google.com/maps/embed?pb=…" hint="On Google Maps: Share, Embed a map, copy the address inside src=“…”. Empty falls back to a search for the address." />
          <TextField name="mapsLink" label="Open in Google Maps link" type="url" optional placeholder="https://maps.app.goo.gl/…" hint="On Google Maps: Share, Copy link." />
        </Section>
      </div>
      <div id="association" className="set-anchor">
        <Section title="Association details" note="Shown on the Donate page, where people send a bank transfer, and in the legal pages.">
          <TextField name="assoc.name" label="Legal name" />
          <div className="set-pair">
            <TextField name="assoc.cif" label="CIF" inputMode="numeric" />
            <TextField name="assoc.bank" label="Bank" />
          </div>
          <BilingualField name="assoc.branch" label="Branch" optional />
          <TextField name="assoc.iban" label="IBAN" placeholder="RO00 BANK 0000 0000 0000 0000" hint="Checked with the IBAN checksum, so a typo is caught before it reaches the website. Spaces are fine." className="set-mono" />
        </Section>
      </div>
      <div id="socials" className="set-anchor">
        <Section title="Social links" note="One list for the website footer, the Contact page and the links page. The order is the order of the icons.">
          <Callout>The Linktree module can also reorder these icons. The addresses are edited only here.</Callout>
          <Repeater name="socials" label="Links" itemLabel="Link" addLabel="Add a network" max={NETWORKS.length} empty="No social links." blank={() => ({ k: uid(), network: '', url: '' })}>
            {(i) => (
              <>
                <NetworkSelect i={i} />
                <TextField name={`socials.${i}.url`} label="Address" type="url" placeholder="https://" hint={<UrlHint i={i} />} />
              </>
            )}
          </Repeater>
          <p className="set-note">Shown on the links page too: <AppLink href="/linktree" className="link">Open the Linktree</AppLink></p>
        </Section>
      </div>
    </SettingsPage>
  );
}

/** Network picker that offers only networks no other row uses. */
function NetworkSelect({ i }: { i: number }) {
  const form = useForm();
  const rows = (form.get('socials') as SettingsForm['socials']) ?? [];
  const mine = rows[i]?.network;
  const used = new Set(rows.map((r) => r.network).filter((n) => n && n !== mine));
  return <SelectField name={`socials.${i}.network`} label="Network" placeholder="Choose a network" options={NETWORKS.filter((n) => !used.has(n.id)).map((n) => ({ value: n.id, label: n.label }))} />;
}

/** Shows the shape of the address for the chosen network. */
function UrlHint({ i }: { i: number }) {
  const form = useForm();
  const n = NETWORKS.find((x) => x.id === (form.get(`socials.${i}.network`) as string));
  return <>{n ? `For example ${n.hint}` : 'Choose the network first.'}</>;
}
