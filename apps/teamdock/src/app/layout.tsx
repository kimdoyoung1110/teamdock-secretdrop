import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Anchor } from "lucide-react";
import { auth } from "@/auth";
import { logout } from "@/lib/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TeamDock — 팀 워크스페이스",
  description: "팀플 멤버와 프로젝트를 한곳에서 관리하는 팀 워크스페이스",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-muted/30">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-6 px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Anchor className="size-4" />
              </span>
              TeamDock
            </Link>
            {session && (
              <nav className="flex gap-4 text-sm text-muted-foreground">
                <Link href="/teams" className="hover:text-foreground">
                  내 팀
                </Link>
                <Link href="/profile" className="hover:text-foreground">
                  프로필
                </Link>
              </nav>
            )}
            <div className="ml-auto flex items-center gap-3 text-sm">
              {session ? (
                <>
                  <span className="hidden text-muted-foreground sm:inline">{session.user.name}</span>
                  <form action={logout}>
                    <Button type="submit" variant="outline" size="sm">
                      로그아웃
                    </Button>
                  </form>
                </>
              ) : (
                <a href="/api/login" className={buttonVariants({ size: "sm" })}>
                  로그인
                </a>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">{children}</main>
        <footer className="border-t bg-background py-4 text-center text-xs text-muted-foreground">
          TeamDock · Keycloak SSO로 SecretDrop과 계정을 공유합니다
        </footer>
      </body>
    </html>
  );
}
