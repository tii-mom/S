"use client";

import Link from "next/link";

import { PageHeading, ScrollPanel } from "@/components/fantasy-ui";
import { ArrowIcon, CheckIcon, CoinIcon, SparkIcon } from "@/components/icons";
import { useShoreState } from "@/components/shore-state-provider";
import { mockTasks } from "@/lib/tasks";

export default function TasksPage() {
  const { state } = useShoreState();
  const featured = mockTasks[0]!;
  const optionalTasks = mockTasks.slice(1);
  const featuredDone = state.completedTaskIds.includes(featured.id);

  return (
    <div className="page-stack tasks-page">
      <PageHeading
        eyebrow="今日任务卷"
        title="今天只推荐一个主线"
        description="完成主线后，再从三个轻量任务里自由选择。"
      />

      <ScrollPanel tone="gold" className="featured-quest-panel">
        <div className="featured-quest-panel__top">
          <span className="quest-ribbon">今日主线</span>
          <span className={featuredDone ? "quest-state quest-state--done" : "quest-state"}>
            {featuredDone ? <CheckIcon /> : <SparkIcon />}
            {featuredDone ? "已完成" : `${featured.minutes} 分钟`}
          </span>
        </div>
        <h2>{featured.title}</h2>
        <p>{featured.summary}</p>
        <div className="featured-quest-panel__reward">
          <CoinIcon />
          <strong>+{featured.rewardPoints} 积分</strong>
          <span>{featured.platform}</span>
        </div>
        <Link
          href={`/tasks/${featured.id}`}
          className="fantasy-button fantasy-button--primary fantasy-button--wide"
        >
          <span>{featuredDone ? "查看完成记录" : "去完成主线"}</span>
          <ArrowIcon className="fantasy-button__icon" />
        </Link>
      </ScrollPanel>

      <section className="optional-quests">
        <div className="section-title-row">
          <div>
            <span className="panel-kicker">支线任务</span>
            <h2>另外三个可选任务</h2>
          </div>
          <span className="small-note">不必全部完成</span>
        </div>

        <div className="quest-list">
          {optionalTasks.map((task, index) => {
            const done = state.completedTaskIds.includes(task.id);
            return (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="quest-card quest-card--compact"
              >
                <span className={`quest-number quest-number--${index + 1}`}>{index + 1}</span>
                <span className="quest-card__body">
                  <span className="quest-card__meta">
                    <span>{task.category}</span>
                    <span>{task.minutes} 分钟</span>
                  </span>
                  <strong>{task.title}</strong>
                  <small>{task.summary}</small>
                  <span className="quest-card__reward">
                    <CoinIcon /> +{task.rewardPoints} 积分
                  </span>
                </span>
                <span className={done ? "mini-check mini-check--done" : "mini-check"}>
                  {done ? <CheckIcon /> : <ArrowIcon />}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
