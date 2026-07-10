export type MockTask = {
  id: string;
  title: string;
  summary: string;
  category: string;
  platform: string;
  minutes: number;
  rewardPoints: number;
  difficulty: "轻松" | "普通";
  steps: readonly string[];
  proof: string;
};

export const mockTasks: readonly MockTask[] = [
  {
    id: "daily-story",
    title: "写下今天的上岸宣言",
    summary: "用自己的话发布一条行动记录，让今天成为真正开始的一天。",
    category: "今日主线",
    platform: "X / Telegram",
    minutes: 3,
    rewardPoints: 300,
    difficulty: "轻松",
    steps: ["查看上岸宣言示例", "发布一条原创行动记录", "返回粘贴帖子链接"],
    proof: "提交公开帖子链接，内容不少于 20 个字。",
  },
  {
    id: "miniapp-trial",
    title: "体验一款 Mini App",
    summary: "完成新手流程，并写下一个最真实的使用感受。",
    category: "产品体验",
    platform: "Telegram",
    minutes: 5,
    rewardPoints: 240,
    difficulty: "轻松",
    steps: ["打开指定 Mini App", "完成新手引导", "上传完成截图"],
    proof: "提交完成页截图，不需要提供账号密码。",
  },
  {
    id: "feedback-note",
    title: "提交一条产品建议",
    summary: "从普通用户角度指出一个问题，并给出一句改进建议。",
    category: "真实反馈",
    platform: "Web",
    minutes: 4,
    rewardPoints: 220,
    difficulty: "普通",
    steps: ["体验指定页面", "找到一个真实问题", "提交简短建议"],
    proof: "提交 30 字以上的原创建议。",
  },
  {
    id: "shore-share",
    title: "分享你的上岸进度",
    summary: "生成一张不暴露具体负债金额的进度卡。",
    category: "上岸分享",
    platform: "任意社交平台",
    minutes: 2,
    rewardPoints: 160,
    difficulty: "轻松",
    steps: ["生成进度卡", "保存或分享", "返回确认完成"],
    proof: "本 Mock 阶段点击确认即可完成。",
  },
] as const;

export function getTask(taskId: string): MockTask | undefined {
  return mockTasks.find((task) => task.id === taskId);
}
