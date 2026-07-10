"use client";

import Link from "next/link";

import { ProgressBar, ScrollPanel, StatPill } from "@/components/fantasy-ui";
import { ArrowIcon, CheckIcon, CoinIcon, ShareIcon, SparkIcon } from "@/components/icons";
import { ShoreMascot } from "@/components/shore-mascot";
import { useShoreState } from "@/components/shore-state-provider";
import { formatCny, getActionProgress } from "@/lib/mock-state";
import { mockTasks } from "@/lib/tasks";

const todayTask = mockTasks[0]!;

export default function HomePage() {
  const { state, hydrated } = useShoreState();
  const progress = getActionProgress(state);
  const hasDebt = state.debtAmount !== null;
  const taskCompleted = state.completedTaskIds.includes(todayTask.id);

  return (
    <div className="page-stack home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="home-hero__welcome">欢迎来到上岸仙岛</p>
          <h1>
            每天做一件事，
            <span>离上岸近一步。</span>
          </h1>
          <p>不用学习复杂规则，今天只完成一个任务。</p>
        </div>
        <div className="home-hero__mascot">
          <div className="speech-bubble">
            {hasDebt ? "主人，今天的主线已经备好啦！" : "先告诉我你的上岸目标吧！"}
          </div>
          <ShoreMascot mood={taskCompleted ? "cheer" : "wave"} />
        </div>
      </section>

      <ScrollPanel tone="jade" className="debt-scroll">
        <div className="debt-scroll__header">
          <div>
            <span className="panel-kicker">我的上岸目标</span>
            <h2>{hasDebt ? "距离上岸还差" : "还没有设置目标"}</h2>
          </div>
          <span className="jade-badge">行动卷轴</span>
        </div>

        <div className="debt-scroll__amount">
          {hydrated && hasDebt ? formatCny(state.debtAmount ?? 0) : "¥—"}
        </div>

        {hasDebt ? (
          <>
            <ProgressBar value={progress} label="行动进度" detail={`${progress}%`} />
            <div className="debt-scroll__stats">
              <StatPill label="连续行动" value={`${state.streakDays} 天`} accent="peach" />
              <StatPill label="累计任务" value={`${state.completedTaskIds.length} 个`} />
              <StatPill label="当前积分" value={`${state.points}`} accent="gold" />
            </div>
            <Link href="/debt" className="text-link">
              修改上岸目标 <ArrowIcon />
            </Link>
          </>
        ) : (
          <Link
            href="/debt"
            className="fantasy-button fantasy-button--primary fantasy-button--wide"
          >
            <span>开始上岸</span>
            <ArrowIcon className="fantasy-button__icon" />
          </Link>
        )}
      </ScrollPanel>

      <section className="today-quest">
        <div className="section-title-row">
          <div>
            <span className="panel-kicker">今日主线</span>
            <h2>只做这一件事</h2>
          </div>
          <span className={taskCompleted ? "quest-state quest-state--done" : "quest-state"}>
            {taskCompleted ? <CheckIcon /> : <SparkIcon />}
            {taskCompleted ? "已完成" : "待出发"}
          </span>
        </div>

        <Link href={`/tasks/${todayTask.id}`} className="quest-card quest-card--featured">
          <div className="quest-card__stamp">主</div>
          <div className="quest-card__body">
            <div className="quest-card__meta">
              <span>{todayTask.category}</span>
              <span>{todayTask.minutes} 分钟</span>
            </div>
            <h3>{todayTask.title}</h3>
            <p>{todayTask.summary}</p>
            <div className="quest-card__reward">
              <CoinIcon />
              <strong>+{todayTask.rewardPoints} 积分</strong>
              <span>{todayTask.difficulty}</span>
            </div>
          </div>
          <ArrowIcon className="quest-card__arrow" />
        </Link>
      </section>

      <ScrollPanel tone="gold" className="vault-preview">
        <div className="vault-preview__icon">岸</div>
        <div className="vault-preview__copy">
          <span className="panel-kicker">上岸金库</span>
          <h2>{state.availableShore.toLocaleString("zh-CN")} SHORE</h2>
          <p>另有 {state.lockedShore.toLocaleString("zh-CN")} SHORE 等待未来轮次解锁</p>
        </div>
        <Link href="/vault" className="round-arrow" aria-label="查看金库">
          <ArrowIcon />
        </Link>
      </ScrollPanel>

      <Link href="/share" className="share-banner">
        <span className="share-banner__icon">
          <ShareIcon />
        </span>
        <span>
          <strong>分享我的上岸进度</strong>
          <small>默认只显示百分比，不公开具体负债</small>
        </span>
        <ArrowIcon />
      </Link>
    </div>
  );
}
