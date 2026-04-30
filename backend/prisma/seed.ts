import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * シードスクリプト
 *
 * - ダミーユーザーを 2件作成
 * - 各ユーザーに対して EmotionLog（日次感情サマリー）を 3件作成
 *
 * 既に存在する場合は upsert で更新（重複エラー回避）
 */
async function main() {
  console.log('Seed開始...');

  // パスワードハッシュ（共通）
  const passwordHash = await bcrypt.hash('password123', 10);

  // ===== ダミーユーザー 2件 =====
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      passwordHash,
      displayName: 'Alice',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      passwordHash,
      displayName: 'Bob',
    },
  });

  console.log(`User作成完了: ${user1.displayName}, ${user2.displayName}`);

  // ===== EmotionLog (日次感情サマリー) =====
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(today.getDate() - 2);

  // user1（Alice）の感情ログ 3件
  await prisma.emotionLog.upsert({
    where: { userId_logDate: { userId: user1.id, logDate: today } },
    update: {},
    create: {
      userId: user1.id,
      logDate: today,
      dominantEmotion: 'joy',
      sentimentScore: 0.85,
      summary: '今日は気分が良く、散歩を楽しみました。',
    },
  });

  await prisma.emotionLog.upsert({
    where: { userId_logDate: { userId: user1.id, logDate: yesterday } },
    update: {},
    create: {
      userId: user1.id,
      logDate: yesterday,
      dominantEmotion: 'calm',
      sentimentScore: 0.7,
      summary: 'リラックスして読書をしました。',
    },
  });

  await prisma.emotionLog.upsert({
    where: { userId_logDate: { userId: user1.id, logDate: dayBefore } },
    update: {},
    create: {
      userId: user1.id,
      logDate: dayBefore,
      dominantEmotion: 'tired',
      sentimentScore: -0.2,
      summary: '少し疲れていましたが、無理せず休みました。',
    },
  });

  // user2（Bob）の感情ログ 3件
  await prisma.emotionLog.upsert({
    where: { userId_logDate: { userId: user2.id, logDate: today } },
    update: {},
    create: {
      userId: user2.id,
      logDate: today,
      dominantEmotion: 'anxious',
      sentimentScore: -0.4,
      summary: '仕事で気がかりなことがありました。',
    },
  });

  await prisma.emotionLog.upsert({
    where: { userId_logDate: { userId: user2.id, logDate: yesterday } },
    update: {},
    create: {
      userId: user2.id,
      logDate: yesterday,
      dominantEmotion: 'happy',
      sentimentScore: 0.9,
      summary: '友人と会って楽しい時間を過ごしました。',
    },
  });

  await prisma.emotionLog.upsert({
    where: { userId_logDate: { userId: user2.id, logDate: dayBefore } },
    update: {},
    create: {
      userId: user2.id,
      logDate: dayBefore,
      dominantEmotion: 'neutral',
      sentimentScore: 0.0,
      summary: '特に変化のない一日でした。',
    },
  });

  console.log('EmotionLog作成完了: 6件');
  console.log('Seed完了！');
}

main()
  .catch((error) => {
    console.error('Seedエラー:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
