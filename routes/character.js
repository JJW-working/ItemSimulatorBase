import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();

// [심화] 라우터마다 prisma 클라이언트를 생성하고 있다. 더 좋은 방법이 있지 않을까?
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

// [필수] 3. 캐릭터 생성
router.post('/character/create', authmiddleware, async (req, res) => {
  try {
    const { characterId } = req.body;
    const { accountId } = req.user;

    if (!characterId) {
      return res.status(400).json({ error: '캐릭터 ID가 필요합니다.' });
    }
    // 캐릭터 생성
    const createCharacter = await prisma.character.create({
      data: {
        characterId: characterId,
        account: {
          connect: { accountId: accountId },
        },
      },
    });

    res.status(200).json({ character_info: createCharacter });
    console.log(createCharacter);
  } catch (error) {
    console.error('캐릭터 생성 실패:', error);

    if (error.code === 'P2002') {
      res.status(400).json({ error: '중복된 캐릭터 이름입니다.' });
    } else {
      res.status(500).json({ error: '캐릭터 생성 중 오류가 발생했습니다.' });
    }
    console.log(error);
  }
});

// [필수] 4. 캐릭터 삭제
router.post('/character/delete', authmiddleware, async (req, res) => {
  try {
    const { characterid } = req.body;
    const userId = req.user.id;
    const character = await prisma.character.findUnique({
      where: { characterId: characterid },
    });

    if (!character) {
      return res.status(404).json({ error: '해당 캐릭터를 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '캐릭터가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(400).json({ error: '찾을 수 없는 아이디입니다.' });
    } else {
      res.status(500).json({ error: '캐릭터 삭제 중 오류가 발생했습니다.' });
    }
    console.log(error);
  }
});

// [필수] 5. 캐릭터 상세 조회
router.get('/character/detail/:characterId', authmiddleware, async (req, res) => {
  const { characterId } = req.params;
  const userId = req.user ? req.user.accountId : null;

  try {
    const character = await prisma.character.findUnique({
      where: { characterId: characterId },
    });

    if (character) {
      if (userId && character.accountId === userId) {
        res.status(200).json(character);
      } else {
        const { money, ...publicCharacterData } = character;
        res.status(200).json(publicCharacterData);
      }
    } else {
      res.status(404).json({ error: '캐릭터를 찾을 수 없습니다.' });
    }
  } catch (error) {
    res.status(500).json({ error: '캐릭터 조회 중 오류가 발생했습니다.' });
    console.log(error);
  }
});
// 6-3. [도전] "회원"에 귀속된 캐릭터를 생성하기
router.post('/character/createfromuser', (req, res) => {});

// 6-4. [도전] "회원"에 귀속된 캐릭터를 삭제하기
router.post('/character/createfrom', (req, res) => {});

export default router;
