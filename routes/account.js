import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// [심화] 라우터마다 prisma 클라이언트를 생성하고 있다. 더 좋은 방법이 있지 않을까?
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

// 6-1. [도전] **회원가입**
router.post('/account/join', async (req, res) => {
  try {
    const { accountId, accountPassword, confirmPassword, name } = req.body;

    if (!accountId || !accountPassword || !confirmPassword || !name) {
      return res.status(400).json({ error: '입력을 안한 부분이 있어요.' });
    }

    if (accountPassword !== confirmPassword) {
      return res.status(400).json({ error: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' });
    }
    const existingAccount = await prisma.account.findUnique({
      where: { accountId: accountId },
    });

    if (existingAccount) {
      return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });
    }
    const hashedPassword = await bcrypt.hash(accountPassword, 10);
    const newAccount = await prisma.account.create({
      data: {
        accountId: accountId,
        accountPassword: hashedPassword,
        name: name,
      },
    });

    res.status(201).json({ message: '회원가입 성공', account: newAccount });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    console.log(error);
  }
});

// 6-2. [도전]** 로그인**
router.post('/account/login', async (req, res) => {
  try {
    const { accountId, accountPassword } = req.body;

    if (!accountId || !accountPassword) {
      return res.status(400).json({ error: '입력을 안한 부분이 있어요.' });
    }
    const account = await prisma.account.findUnique({
      where: { accountId: accountId },
    });

    if (!account) {
      return res.status(401).json({ error: '존재하지 않는 계정입니다.' });
    }
    const passwordMatch = await bcrypt.compare(accountPassword, account.accountPassword);
    if (!passwordMatch) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }
    const token = jwt.sign(
      { accountId: account.accountId, name: account.name },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    res.status(200).json({ message: '로그인 성공', token: token });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    console.log(error);
  }
});

export default router;
