import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed script must not run in production");
  }

  // 開発/テスト用途の固定ダミーパスワード（本番用途では使用しない）
  const users = [
    {
      email: "alice@example.com",
      displayName: "Alice",
      password: "password123",
    },
    {
      email: "bob@example.com",
      displayName: "Bob",
      password: "password123",
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const [index, user] of users.entries()) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        displayName: user.displayName,
        passwordHash,
      },
      create: {
        email: user.email,
        displayName: user.displayName,
        passwordHash,
      },
    });

    const logSeeds = [
      { offset: 0, dominantEmotion: "joy", sentimentScore: 0.7, summary: "穏やかに過ごせた1日" },
      { offset: 1, dominantEmotion: "neutral", sentimentScore: 0.2, summary: "通常運転で安定した1日" },
      { offset: 2, dominantEmotion: "sadness", sentimentScore: -0.3, summary: "少し疲れを感じた1日" },
    ];

    for (const log of logSeeds) {
      const logDate = new Date(today);
      logDate.setDate(today.getDate() - log.offset - index);

      await prisma.emotionLog.upsert({
        where: {
          userId_logDate: {
            userId: dbUser.id,
            logDate,
          },
        },
        update: {
          dominantEmotion: log.dominantEmotion,
          sentimentScore: log.sentimentScore,
          summary: log.summary,
        },
        create: {
          userId: dbUser.id,
          logDate,
          dominantEmotion: log.dominantEmotion,
          sentimentScore: log.sentimentScore,
          summary: log.summary,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
