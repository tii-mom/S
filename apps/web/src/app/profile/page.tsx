"use client";

import Link from "next/link";

import { PageHeading, ScrollPanel } from "@/components/fantasy-ui";
import { ArrowIcon, CheckIcon, ShareIcon, UserIcon } from "@/components/icons";
import { ShoreMascot } from "@/components/shore-mascot";
import { useShoreState } from "@/components/shore-state-provider";
import { formatCny } from "@/lib/mock-state";

export default function ProfilePage() {
  const { state, reset } = useShoreState();

  return (
    <div className="page-stack profile-page">
      <PageHeading
        eyebrow="我的洞府"
        title="今天也在认真上岸"
        description="管理目标、社交主页和 Mock 数据。"
      />

      <ScrollPanel tone="jade" className="profile-card">
        <ShoreMascot compact mood={state.completedTaskIds.length > 0 ? "cheer" : "wave"} />
        <div className="profile-card__copy">
          <span className="panel-kicker">上岸旅人</span>
          <h2>第 {Math.max(1, state.streakDays + 1)} 日</h2>
          <p>
            {state.debtAmount ? `当前目标 ${formatCny(state.debtAmount)}` : "还没有设置上岸目标"}
          </p>
        </div>
        <span className="profile-level">初心</span>
      </ScrollPanel>

      <div className="profile-stats">
        <div>
          <strong>{state.points}</strong>
          <span>积分</span>
        </div>
        <div>
          <strong>{state.completedTaskIds.length}</strong>
          <span>任务</span>
        </div>
        <div>
          <strong>{state.shares}</strong>
          <span>分享</span>
        </div>
      </div>

      <section className="profile-menu">
        <Link href="/debt" className="profile-menu__item">
          <span className="profile-menu__icon profile-menu__icon--peach">岸</span>
          <span>
            <strong>我的上岸目标</strong>
            <small>{state.debtAmount ? "查看或修改总金额" : "现在设置一个目标"}</small>
          </span>
          <ArrowIcon />
        </Link>
        <button type="button" className="profile-menu__item">
          <span className="profile-menu__icon profile-menu__icon--jade">
            <UserIcon />
          </span>
          <span>
            <strong>绑定社交主页</strong>
            <small>下一阶段开放，绝不索取账号密码</small>
          </span>
          <span className="coming-soon">即将开放</span>
        </button>
        <Link href="/share" className="profile-menu__item">
          <span className="profile-menu__icon profile-menu__icon--gold">
            <ShareIcon />
          </span>
          <span>
            <strong>我的分享卡</strong>
            <small>生成不显示具体金额的进度卡</small>
          </span>
          <ArrowIcon />
        </Link>
      </section>

      <div className="mock-notice">
        <CheckIcon />
        <p>当前为 Phase 1 Mock 数据，不连接钱包、不发生真实资产转移。</p>
      </div>

      <button type="button" className="reset-button" onClick={reset}>
        重置本地体验数据
      </button>
    </div>
  );
}
