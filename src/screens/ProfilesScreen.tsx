import { ArrowLeft, CheckCircle2, Loader2, Play, Radio, Square, UserRoundCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HERMES_PROFILES, type HermesProfile, type ProfileId, type ProfileState } from '../data/hermesDemo';
import { sendHadesCommand } from '../telegram/sendCommand';
import { setBackButtonVisible } from '../telegram/sdk';

type ProfilesScreenProps = {
  onBack: () => void;
};

type AgentSummary = {
  s: string;
  k?: string;
  r?: string;
};

type NtfyPayload = {
  a?: Record<string, AgentSummary>;
  h?: string;
};

const NTFY_TOPIC = 'hades-agents-craig';

const STATE_CLASSES: Record<ProfileState, string> = {
  running: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  stopped: 'border-red-500/40 bg-red-500/10 text-red-300',
  available: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
};

const STATE_COPY: Record<ProfileState, string> = {
  running: 'Running',
  stopped: 'Stopped',
  available: 'Available',
};

function normalizeState(status?: string): ProfileState | null {
  if (!status) {
    return null;
  }

  if (status === 'running' || status === 'starting' || status === 'busy') {
    return 'running';
  }

  if (status === 'killed' || status === 'error' || status === 'done') {
    return 'stopped';
  }

  if (status === 'idle' || status === 'available') {
    return 'available';
  }

  return null;
}

function toProfileId(value: string): ProfileId | null {
  const normalized = value.toLowerCase().replaceAll('_', '-');
  return HERMES_PROFILES.some((profile) => profile.id === normalized) ? (normalized as ProfileId) : null;
}

function ProfileBadge({ state }: { state: ProfileState }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${STATE_CLASSES[state]}`}>
      {STATE_COPY[state]}
    </span>
  );
}

export function ProfilesScreen({ onBack }: ProfilesScreenProps) {
  const [liveStates, setLiveStates] = useState<Partial<Record<ProfileId, ProfileState>>>({});
  const [loadingLive, setLoadingLive] = useState(true);
  const [sendingProfile, setSendingProfile] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setBackButtonVisible(true, onBack), [onBack]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    let alive = true;

    async function fetchAgentState() {
      try {
        const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}/raw?poll=1`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) {
          return;
        }

        const text = await res.text();
        const lines = text.trim().split('\n').filter(Boolean);
        const last = lines.length ? (JSON.parse(lines[lines.length - 1]) as NtfyPayload) : null;
        const nextStates: Partial<Record<ProfileId, ProfileState>> = {};

        for (const [agentId, agent] of Object.entries(last?.a ?? {})) {
          const profileId = toProfileId(agentId) ?? toProfileId(agent.r ?? '') ?? toProfileId(agent.k ?? '');
          const state = normalizeState(agent.s);

          if (profileId && state) {
            nextStates[profileId] = state;
          }
        }

        if (alive) {
          setLiveStates(nextStates);
        }
      } catch {
        // Local and unauthenticated launches keep using demo state.
      } finally {
        if (alive) {
          setLoadingLive(false);
        }
      }
    }

    void fetchAgentState();
    return () => {
      alive = false;
    };
  }, []);

  const profiles = useMemo(
    () => HERMES_PROFILES.map((profile) => ({ ...profile, state: liveStates[profile.id] ?? profile.state })),
    [liveStates],
  );

  async function sendProfileCommand(profile: HermesProfile, action: 'detail' | 'start' | 'stop') {
    const type =
      action === 'detail' ? 'profiles.detail' : action === 'start' ? 'profiles.start' : 'profiles.stop';
    const label =
      action === 'detail' ? `Inspect ${profile.title}` : action === 'start' ? `Start ${profile.title}` : `Stop ${profile.title}`;

    setSendingProfile(`${profile.id}:${action}`);
    setError(null);

    try {
      await sendHadesCommand({
        type,
        payload: {
          profileId: profile.id,
          requestedAt: new Date().toISOString(),
        },
        ui: {
          screen: 'profiles',
          label,
        },
      });
      setToast('Command envelope sent');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send command.');
    } finally {
      setSendingProfile(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-tg-border bg-tg-secondary text-tg-text transition active:scale-[0.98]"
          onClick={onBack}
          title="Back"
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-[0] text-tg-text">Profiles</h2>
          <p className="truncate text-sm text-tg-hint">
            Demo roster{loadingLive ? '; checking ntfy' : '; ntfy overlay optional'}
          </p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-tg-border bg-tg-secondary text-tg-link">
          <UserRoundCog aria-hidden="true" size={18} />
        </span>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
          {error}
        </div>
      ) : null}

      <section className="space-y-3" aria-label="Hermes agent profiles">
        {profiles.map((profile) => {
          const detailKey = `${profile.id}:detail`;
          const action = profile.state === 'running' ? 'stop' : 'start';
          const actionKey = `${profile.id}:${action}`;
          const isDetailSending = sendingProfile === detailKey;
          const isActionSending = sendingProfile === actionKey;

          return (
            <article className="rounded-lg border border-tg-border bg-tg-secondary p-4" key={profile.id}>
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-tg-border bg-tg-surface text-tg-link">
                  <Radio aria-hidden="true" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-tg-text">{profile.title}</h3>
                    <ProfileBadge state={profile.state} />
                  </div>
                  <p className="mt-1 text-xs text-tg-hint">
                    {profile.id} · {profile.model} · {profile.capacityLabel}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-tg-text/90">{profile.description}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-surface px-3 text-sm font-semibold text-tg-text transition active:scale-[0.98] disabled:opacity-60"
                  disabled={sendingProfile !== null}
                  onClick={() => void sendProfileCommand(profile, 'detail')}
                  type="button"
                >
                  {isDetailSending ? <Loader2 aria-hidden="true" className="animate-spin" size={16} /> : <UserRoundCog aria-hidden="true" size={16} />}
                  Inspect
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-button px-3 text-sm font-semibold text-tg-buttonText shadow-command transition active:scale-[0.98] disabled:opacity-60"
                  disabled={sendingProfile !== null}
                  onClick={() => void sendProfileCommand(profile, action)}
                  type="button"
                >
                  {isActionSending ? (
                    <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                  ) : action === 'start' ? (
                    <Play aria-hidden="true" size={16} />
                  ) : (
                    <Square aria-hidden="true" size={16} />
                  )}
                  {action === 'start' ? 'Start' : 'Stop'}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {toast ? (
        <div className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] mx-auto flex max-w-sm items-center justify-center gap-2 rounded-lg border border-tg-border bg-tg-surface px-4 py-3 text-sm font-semibold text-tg-text shadow-command">
          <CheckCircle2 aria-hidden="true" className="text-emerald-400" size={18} />
          <span>{toast}</span>
        </div>
      ) : null}
    </div>
  );
}
