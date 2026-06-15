export interface StoryDialogueSnippet {
  id: string;
  speaker: string;
  text: string;
  icon?: string;
}

export const STORY_DIALOGUE: StoryDialogueSnippet[] = [
  {
    id: 'starting_camp',
    speaker: '旁白',
    icon: '🏕️',
    text: '第一座营地立起时，沉默的雾向后退了一步。把资源聚在一起，记忆也许会慢慢回来。',
  },
  {
    id: 'five_resources_remembered',
    speaker: '旁白',
    icon: '🧩',
    text: '木、石、食物、金属与人声重新有了名字。雾里掉下一枚记忆碎片，像是在催促你读懂过去。',
  },
  {
    id: 'stone_tablet_revealed',
    speaker: '石碑',
    icon: '🪧',
    text: '石碑上的旧字提到三件事：太阳指路，月亮校正方向，星图等待黎明。',
  },
  {
    id: 'sun_card',
    speaker: '旁白',
    icon: '☀️',
    text: '太阳牌在掌心发热。远处的雾第一次显出边界，第二段旅程开始了。',
  },
  {
    id: 'act_two_unlocked',
    speaker: '旁白',
    icon: '🌫️',
    text: '迷雾深处有商人的铃声，也有贤者的咳嗽声。寻找他们，才能补全月亮与星图。',
  },
  {
    id: 'dawn_ready',
    speaker: '旁白',
    icon: '🌅',
    text: '太阳、月亮与星图合在一起，黎明牌正在成形。沉默之雾开始露出裂缝。',
  },
  {
    id: 'dawn_victory',
    speaker: '旁白',
    icon: '🌅',
    text: '黎明牌照亮营地。沉默之雾散去，人们终于记起了回家的路。',
  },
  {
    id: 'old_sage',
    speaker: '年迈贤者',
    icon: '🧙',
    text: '我见过雾升起前的月亮。带着太阳牌来，我会告诉你夜空该如何阅读。',
  },
  {
    id: 'travelling_merchant',
    speaker: '旅行商人',
    icon: '🧳',
    text: '别问我怎么穿过雾。我只卖两样东西：能用的补给，以及不一定可靠的传闻。',
  },
];

export function getStoryDialogue(id: string): StoryDialogueSnippet | undefined {
  return STORY_DIALOGUE.find((snippet) => snippet.id === id);
}
