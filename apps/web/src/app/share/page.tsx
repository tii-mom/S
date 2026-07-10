"use client";

import Link from "next/link";
import { useState } from "react";

import { PageHeading } from "@/components/fantasy-ui";
import { ArrowIcon, CheckIcon, ShareIcon, SparkIcon } from "@/components/icons";
import { ShoreMascot } from "@/components/shore-mascot";
import { useShoreState } from "@/components/shore-state-provider";
import { getActionProgress } from "@/lib/mock-state";

export default function SharePage() {
  const { state, recordShare } = useShoreState();
  const [shareStatus, setShareStatus] = useState<"idle" | "done" | "error">("idle");
  const progress = getActionProgress(state);
  const shareText = `我正在上岸。今天完成了 ${state.completedTaskIds.length} 个任务，上岸行动进度 ${progress}%。负债不是身份，上岸才是目标。`;

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "我的上岸进度", text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
      }
      recordShare();
      setShareStatus("done");
    } catch {
      setShareStatus("error");
    }
  }

  return (
    <div className="page-stack share-page">
      <PageHeading
        eyebrow="上岸传书"
        title="今天又上岸了一步"
        description="分享卡默认隐藏你的具体负债金额。"
      />

      <section className="share-card" aria-label="上岸进度分享卡">
        <div className="share-card__cloud share-card__cloud--one" />
        <div className="share-card__cloud share-card__cloud--two" />
        <div className="share-card__top">
          <span className="shore-brand__seal">岸</span>
          <div>
            <strong>上岸仙岛</strong>
            <small>每天做一件事</small>
          </div>
        </div>

        <div className="share-card__mascot">
          <ShoreMascot mood="cheer" />
        </div>

        <div className="share-card__copy">
          <span>我正在上岸</span>
          <h2>今天又向前走了一步</h2>
          <p>负债不是身份，上岸才是目标。</p>
        </div>

        <div className="share-card__progress">
          <div>
            <span>行动进度</span>
            <strong>{progress}%</strong>
          </div>
          <div className="share-card__track">
            <span style={{ width: `${Math.max(4, progress)}%` }} />
          </div>
        </div>

        <div className="share-card__stats">
          <span>
            <strong>{state.streakDays}</strong>
            连续行动
          </span>
          <span>
            <strong>{state.completedTaskIds.length}</strong>
            完成任务
          </span>
          <span>
            <strong>{state.points}</strong>
            累计积分
          </span>
        </div>

        <div className="share-card__footer">
          <SparkIcon /> 上传负债 · 完成任务 · 每天离上岸近一步
        </div>
      </section>

      <button
        type="button"
        className="fantasy-button fantasy-button--primary fantasy-button--wide"
        onClick={handleShare}
      >
        {shareStatus === "done" ? (
          <CheckIcon className="fantasy-button__icon" />
        ) : (
          <ShareIcon className="fantasy-button__icon" />
        )}
        <span>
          {shareStatus === "done"
            ? "分享已完成"
            : shareStatus === "error"
              ? "未完成分享，请重试"
              : "分享我的上岸进度"}
        </span>
      </button>

      <Link href="/" className="fantasy-button fantasy-button--secondary fantasy-button--wide">
        返回首页 <ArrowIcon className="fantasy-button__icon" />
      </Link>
    </div>
  );
}
