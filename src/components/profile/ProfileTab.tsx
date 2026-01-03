import type { PatientProfile } from '@/types';

interface ProfileTabProps {
  profile: PatientProfile | null;
  onUpdateProfile: (profile: PatientProfile) => void;
}

export function ProfileTab({ profile }: ProfileTabProps) {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
          <svg className="w-7 h-7 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>
            My Health Profile
          </h2>
          <p className="text-muted-foreground text-sm">
            Your health information at a glance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Basic Info Card */}
        <ProfileCard
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          }
          title="Basic Info"
          iconBg="bg-primary/10"
          iconColor="text-primary"
          delay={0}
        >
          {profile ? (
            <div className="space-y-3">
              <InfoRow label="Name" value={profile.name} />
              <InfoRow label="Age" value={`${profile.age} years`} />
              <InfoRow label="Sex" value={profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)} />
            </div>
          ) : (
            <EmptyPlaceholder text="Start a conversation to add your info" />
          )}
        </ProfileCard>

        {/* Medications Card */}
        <ProfileCard
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              <path d="m8.5 8.5 7 7" />
            </svg>
          }
          title="Medications"
          iconBg="bg-accent/10"
          iconColor="text-accent"
          delay={1}
        >
          {profile?.medications && profile.medications.length > 0 ? (
            <div className="space-y-2">
              {profile.medications.map((med, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                  <span className="text-foreground">{med.name}</span>
                  {med.dosage && (
                    <span className="text-muted-foreground text-xs">({med.dosage})</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyPlaceholder text="No medications listed" />
          )}
        </ProfileCard>

        {/* Conditions Card */}
        <ProfileCard
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          }
          title="Health Conditions"
          iconBg="bg-destructive/10"
          iconColor="text-destructive"
          delay={2}
        >
          {profile?.conditions && profile.conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.conditions.map((condition, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 text-foreground border border-border/50"
                >
                  {condition}
                </span>
              ))}
            </div>
          ) : (
            <EmptyPlaceholder text="No conditions listed" />
          )}
        </ProfileCard>

        {/* Allergies Card */}
        <ProfileCard
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M3.586 3.586A2 2 0 0 1 5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 .586-1.414Z" />
            </svg>
          }
          title="Allergies"
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          delay={3}
        >
          {profile?.allergies && profile.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                >
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <EmptyPlaceholder text="No allergies listed" />
          )}
        </ProfileCard>
      </div>

      {/* Medical Records Upload */}
      <div
        className="mt-6 p-6 rounded-2xl border-2 border-dashed border-border/60 bg-secondary/20 text-center opacity-0 animate-fade-in-up"
        style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
      >
        <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" x2="12" y1="18" y2="12" />
            <line x1="9" x2="15" y1="15" y2="15" />
          </svg>
        </div>
        <h3 className="font-medium mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Upload Medical Records
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Coming soon - upload and parse medical records to automatically enrich your health profile.
        </p>
      </div>
    </div>
  );
}

function ProfileCard({
  icon,
  title,
  iconBg,
  iconColor,
  delay,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  iconBg: string;
  iconColor: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-5 rounded-2xl bg-card border border-border/50 card-organic transition-organic hover:shadow-md opacity-0 animate-fade-in-up"
      style={{
        animationDelay: `${delay * 100}ms`,
        animationFillMode: 'forwards',
      }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="font-medium" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function EmptyPlaceholder({ text }: { text: string }) {
  return (
    <p className="text-sm text-muted-foreground/60 italic py-2">
      {text}
    </p>
  );
}
