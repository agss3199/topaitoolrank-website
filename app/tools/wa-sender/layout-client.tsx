'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { ToolShell, ToolShellNavItem } from '@/app/components/ToolShell';
import { WASenderProvider } from '@/app/tools/wa-sender/context';
import manifest from './tool.manifest.json';

export default function WASenderLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading, isWASenderUser } = useAuth();

  // Auth guard: redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !isWASenderUser) {
      router.push('/login');
    }
  }, [loading, isWASenderUser, router]);

  // Show nothing while auth check is pending
  if (loading) {
    return null;
  }

  // Redirect happened, don't render anything yet
  if (!isWASenderUser) {
    return null;
  }

  // Convert manifest navigation to ToolShellNavItem format
  const navigationItems: ToolShellNavItem[] = (manifest.navigation || []).map((item: any) => ({
    label: item.label,
    href: item.href,
    icon: item.icon || undefined,
  }));

  return (
    <ToolShell
      toolName={manifest.name}
      toolId={manifest.id}
      session={session ? { user: { email: session.email } } : undefined}
      navigation={navigationItems}
      activeHref={pathname}
    >
      <WASenderProvider userId={session?.userId}>
        {children}
      </WASenderProvider>
    </ToolShell>
  );
}
