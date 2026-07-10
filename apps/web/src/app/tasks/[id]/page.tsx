"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ScrollPanel } from "@/components/fantasy-ui";
import { ArrowIcon, CheckIcon, CoinIcon, LinkIcon, SparkIcon } from "@/components/icons";
import { ShoreMascot } from "@/components/shore-mascot";
import { useShoreState } from "@/components/shore-state-provider";
import { getTask } from "@/lib/tasks";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const task = getTask(params.id);
  const { state, completeTask } = useShoreState();
  const [proof, setProof] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!task) {
    return (
      <div className="page-stack task-detail-page">
        <ScrollPanel tone="peach" className="success-scroll">
          <div>
            <span className="panel-kicker">任务未找到</span>
            <h1>这张任务卷已经失效</h1>
            <p>返回任务页，选择一个仍然开放的任务。</p>
          </div>
          <Link
            href="/tasks"
            className="fantasy-button fantasy-button--primary fantasy-button--wide"
          >
            返回任务页 <ArrowIcon className="fantasy-button__icon" />
          </Link>
        </ScrollPanel>
      </div>
    );
  }

  const validTask = task;
  const done = state.completedTaskIds.includes(validTask.id) || submitted;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!proof.trim() && validTask.id !== "shore-share") {
      return;
    }
    completeTask(validTask.id, validTask.rewardPoints);
    setSubmitted(true);
  }

  return (
    <div className="page-stack task-detail-page">
      <div className="task-detail-hero">
        <div>
          <span className="quest-ribbon">{task.category}</span>
          <h1>{task.title}</h1>
          <p>{task.summary}</p>
        </div>
        <ShoreMascot compact mood={done ? "cheer" : "wave"} />
      </div>

      <div className="task-facts">
        <span>
          <small>预计时间</small>
          <strong>{task.minutes} 分钟</strong>
        </span>
        <span>
          <small>完成奖励</small>
          <strong>+{task.rewardPoints} 积分</strong>
        </span>
        <span>
          <small>任务难度</small>
          <strong>{task.difficulty}</strong>
        </span>
      </div>

      <ScrollPanel tone="jade" className="task-steps-panel">
        <div className="section-title-row">
          <div>
            <span className="panel-kicker">任务步骤</span>
            <h2>跟着三步完成</h2>
          </div>
          <SparkIcon className="decorative-spark" />
        </div>
        <ol className="task-steps">
          {task.steps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </ScrollPanel>

      {done ? (
        <ScrollPanel tone="gold" className="success-scroll">
          <div className="success-scroll__seal">
            <CheckIcon />
          </div>
          <div>
            <span className="panel-kicker">验证成功</span>
            <h2>奖励已经放进你的行囊</h2>
            <p>本次获得 {task.rewardPoints} 积分，今天又向上岸走了一步。</p>
          </div>
          <div className="success-scroll__actions">
            <Link href="/" className="fantasy-button fantasy-button--primary">
              返回首页 <ArrowIcon className="fantasy-button__icon" />
            </Link>
            <Link href="/share" className="fantasy-button fantasy-button--secondary">
              分享进度
            </Link>
          </div>
        </ScrollPanel>
      ) : (
        <ScrollPanel tone="peach" className="proof-panel">
          <div className="proof-panel__heading">
            <span className="proof-panel__icon">
              <LinkIcon />
            </span>
            <div>
              <span className="panel-kicker">提交证明</span>
              <h2>粘贴链接即可</h2>
            </div>
          </div>
          <p className="proof-requirement">{task.proof}</p>

          <form onSubmit={handleSubmit} className="proof-form">
            {task.id === "shore-share" ? (
              <Link
                href="/share"
                className="fantasy-button fantasy-button--secondary fantasy-button--wide"
              >
                先生成上岸进度卡
              </Link>
            ) : null}
            <label htmlFor="proof-link">公开链接或 Mock 证明</label>
            <div className="proof-input">
              <LinkIcon />
              <input
                id="proof-link"
                type="url"
                placeholder="https://example.com/my-proof"
                value={proof}
                onChange={(event) => setProof(event.target.value)}
              />
            </div>
            <button
              type="submit"
              className="fantasy-button fantasy-button--primary fantasy-button--wide"
            >
              <CoinIcon className="fantasy-button__icon" />
              <span>提交并领取 {task.rewardPoints} 积分</span>
            </button>
          </form>
        </ScrollPanel>
      )}

      <p className="safety-caption">不会要求你的密码、验证码、Cookie、助记词或私钥。</p>
    </div>
  );
}
