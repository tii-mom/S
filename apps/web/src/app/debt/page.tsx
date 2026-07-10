"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { PageHeading, ScrollPanel } from "@/components/fantasy-ui";
import { CameraIcon, CheckIcon, SparkIcon } from "@/components/icons";
import { ShoreMascot } from "@/components/shore-mascot";
import { useShoreState } from "@/components/shore-state-provider";

export default function DebtPage() {
  const router = useRouter();
  const { state, hydrated, confirmDebt } = useShoreState();
  const [amount, setAmount] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (hydrated && state.debtAmount !== null) {
      setAmount(state.debtAmount.toString());
    }
  }, [hydrated, state.debtAmount]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(amount.replaceAll(",", ""));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    confirmDebt(parsed);
    router.push("/");
  }

  return (
    <div className="page-stack debt-page">
      <PageHeading
        eyebrow="第一步 · 定下目标"
        title="你想从多少负债开始上岸？"
        description="只填一个总金额就可以，后续随时能修改。"
      />

      <div className="debt-page__guide">
        <ShoreMascot compact />
        <div className="speech-bubble speech-bubble--inline">
          不用填写机构、利率和账单日期。先定一个目标，马上开始今天的任务。
        </div>
      </div>

      <ScrollPanel tone="peach" className="debt-form-panel">
        <form onSubmit={handleSubmit} className="debt-form">
          <label htmlFor="debt-amount">负债总额</label>
          <div className="money-input">
            <span>¥</span>
            <input
              id="debt-amount"
              inputMode="numeric"
              placeholder="例如 186420"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
              aria-describedby="debt-help"
            />
            <small>CNY</small>
          </div>
          <p id="debt-help">数据只用于显示你的个人上岸进度。</p>

          <button
            type="submit"
            className="fantasy-button fantasy-button--primary fantasy-button--wide"
          >
            <span>{state.debtAmount === null ? "确认目标，开始上岸" : "保存新的上岸目标"}</span>
            <CheckIcon className="fantasy-button__icon" />
          </button>
        </form>
      </ScrollPanel>

      <div className="or-divider">
        <span>或者</span>
      </div>

      <button
        type="button"
        className="upload-scroll"
        onClick={() => setUploadMessage("图片识别将在下一阶段开放，现在可直接输入总金额。")}
      >
        <span className="upload-scroll__icon">
          <CameraIcon />
        </span>
        <span>
          <strong>上传账单截图</strong>
          <small>未来由 AI 自动合计并遮挡敏感信息</small>
        </span>
        <SparkIcon />
      </button>

      {uploadMessage ? <p className="inline-notice">{uploadMessage}</p> : null}

      <div className="privacy-note">
        <span>隐</span>
        <p>分享进度时默认只显示百分比，不会公开具体金额或债权人。</p>
      </div>
    </div>
  );
}
