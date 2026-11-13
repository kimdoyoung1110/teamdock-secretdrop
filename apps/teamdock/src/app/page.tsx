import Link from "next/link";
import { KeyRound, Link2, Users } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { icon: Users, title: "팀 만들기", body: "팀을 만들고 레포 주소와 마감일을 한곳에 모아 둡니다." },
  { icon: Link2, title: "링크로 초대", body: "초대 링크를 보내면 팀원이 로그인만으로 합류합니다." },
  {
    icon: KeyRound,
    title: "시크릿 공유",
    body: "팀 화면에서 SecretDrop으로 바로 넘어가 .env와 키를 안전하게 공유합니다. 다시 로그인하지 않습니다.",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-5 pt-6">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance">
          팀플의 멤버와 프로젝트, 한곳에 정박시키세요
        </h1>
        <p className="max-w-xl text-muted-foreground text-pretty">
          TeamDock은 팀플과 동아리 프로젝트를 위한 팀 워크스페이스입니다. 한 번 로그인하면 시크릿 공유 서비스
          SecretDrop까지 같은 계정으로 이어집니다.
        </p>
        {session ? (
          <Link href="/teams" className={buttonVariants({ size: "lg" })}>
            내 팀으로 가기
          </Link>
        ) : (
          <a href="/api/login" className={buttonVariants({ size: "lg" })}>
            로그인하고 시작하기
          </a>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="mb-1 size-5 text-muted-foreground" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
