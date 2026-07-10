"use client";

import Link from "next/link";

import { PageHeading, ProgressBar, ScrollPanel } from "@/components/fantasy-ui";
import { ArrowIcon, CheckIcon, CoinIcon, SparkIcon, VaultIcon } from "@/components/icons";
import { useShoreState } from "@/components/shore-state-provider";

export default function VaultPage() {
  const { state } = useShoreState();
  const eligible = state.completedTaskIds.length > 0 || state.points >= 300;

  return (
    <div className="page-stack vault-page">
      <PageHeading
        eyebrow="上岸金库"
        title="你的 SHORE 都在这里"
        description="当前是 Mock 金库，不会发起真实链上交易。"
      />

      <section className="vault-chest">
        <div className="vault-chest__shine" />
        <div className="vault-chest__seal">岸</div>
        <div className="vault-chest__content">
          <span>可用 SHORE</span>
          <strong>{state.availableShore.toLocaleString("zh-CN")}</strong>
          <small>当前仅用于展示创世权益结构</small>
        </div>
      </section>

      <div className="vault-grid">
        <ScrollPanel tone="jade" className="vault-stat-card">
          <span className="vault-stat-card__icon">
            <CoinIcon />
          </span>
          <div>
            <small>待领取</small>
            <strong>{eligible ? "150,000" : "0"}</strong>
            <span>SHORE</span>
          </div>
        </ScrollPanel>
        <ScrollPanel tone="peach" className="vault-stat-card">
          <span className="vault-stat-card__icon">
            <VaultIcon />
          </span>
          <div>
            <small>待解锁</small>
            <strong>{state.lockedShore.toLocaleString("zh-CN")}</strong>
            <span>SHORE</span>
          </div>
        </ScrollPanel>
      </div>

      <ScrollPanel tone="gold" className="round-scroll">
        <div className="round-scroll__heading">
          <div>
            <span className="panel-kicker">当前轮次</span>
            <h2>第 1 轮 · 潮汐准备中</h2>
          </div>
          <span className="round-scroll__badge">TEST</span>
        </div>
        <ProgressBar value={82} label="价格条件" detail="82%" />
        <ProgressBar value={76} label="行动条件" detail="76%" />
        <div className="eligibility-row">
          <span
            className={eligible ? "eligibility-icon eligibility-icon--done" : "eligibility-icon"}
          >
            {eligible ? <CheckIcon /> : <SparkIcon />}
          </span>
          <div>
            <strong>{eligible ? "你已满足个人领取条件" : "完成一个任务即可满足条件"}</strong>
            <small>
              {eligible ? "轮次开启后可领取 150,000 SHORE" : "权益不会因为未完成而消失"}
            </small>
          </div>
        </div>
      </ScrollPanel>

      {eligible ? (
        <button
          type="button"
          className="fantasy-button fantasy-button--disabled fantasy-button--wide"
          disabled
        >
          测试轮次尚未开启
        </button>
      ) : (
        <Link href="/tasks" className="fantasy-button fantasy-button--primary fantasy-button--wide">
          <span>先完成今天的任务</span>
          <ArrowIcon className="fantasy-button__icon" />
        </Link>
      )}

      <p className="safety-caption">
        真实钱包连接、测试网购买和领取将在后续 TON Testnet 阶段开放。
      </p>
    </div>
  );
}
