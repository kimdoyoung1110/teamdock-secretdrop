import Link from "next/link";
import { EyeOff, Flame, Users } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: EyeOff,
    title: "서버도 못 봅니다",
    body: "브라우저에서 AES-256-GCM으로 암호화한 뒤 암호문만 보냅니다. 키는 링크의 # 뒤에만 있어 서버로 전송되지 않습니다.",
  },
  { icon: Flame, title: "열면 사라집니다", body: "한 번 열람하면 암호문을 지웁니다. 열지 않아도 만료 시간이 지나면 지워집니다." },
  { icon: Users, title: "팀원만 열 수 있게", body: "TeamDock 팀을 지정하면 그 팀 멤버로 로그인한 사람만 열 수 있습니다." },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-5 pt-6">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance">
          팀플 비밀값, 이제 카톡 말고 링크로
        </h1>
        <p className="max-w-xl text-muted-foreground text-pretty">
          .env, API 키, 공용 계정 비밀번호를 채팅방에 평문으로 남기지 마세요. SecretDrop은 열면 사라지는 암호화 링크를
          만들어 줍니다.
        </p>
        {session ? (
          <Link href="/new" className={buttonVariants({ size: "lg" })}>
            시크릿 만들기
          </Link>
        ) : (
          <a href="/api/login" className={buttonVariants({ size: "lg" })}>
            로그인하고 시크릿 만들기
          </a>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="mb-1 size-5 text-primary" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>{body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
