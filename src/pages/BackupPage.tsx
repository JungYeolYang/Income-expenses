import { PasswordChangeForm } from '../components/PasswordChangeForm';
import { useApp } from '../context/AppContext';
import { createDefaultData, downloadJson } from '../lib/storage';
import type { AppData } from '../types';

export function BackupPage() {
  const { data, replaceData } = useApp();

  const exportAll = () => {
    downloadJson(`church-finance-backup-${new Date().toISOString().slice(0, 10)}.json`, data);
  };

  const importAll = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text()) as AppData;
        if (!parsed.accounts || !parsed.weeklyAmounts) throw new Error('invalid');
        if (!confirm('? „ì²? ?°?´?„°ë¥? ?®?–´?”?‹ˆ?‹¤. ê³„ì†?• ê¹Œìš”?')) return;
        replaceData({
          version: parsed.version ?? 1,
          accounts: parsed.accounts,
          weeklyAmounts: parsed.weeklyAmounts ?? {},
          expenseMemos: parsed.expenseMemos ?? {},
          annualBudgets: parsed.annualBudgets ?? {},
        });
        alert('ë³µì› ?™„ë£?');
      } catch {
        alert('ë°±ì—… ?ŒŒ?¼ ?˜•?‹?´ ?˜¬ë°”ë¥´ì§? ?•Š?Šµ?‹ˆ?‹¤.');
      }
    };
    input.click();
  };

  const resetAll = () => {
    if (!confirm('ëª¨ë“  ?°?´?„°ë¥? ì´ˆê¸°?™”?•˜ê³? ê¸°ë³¸ ê³„ì •?œ¼ë¡? ?˜?Œë¦´ê¹Œ?š”?')) return;
    if (!confirm('? •ë§? ?‚­? œ?•©?‹ˆ?‹¤. ?´ ?ž‘?—…??? ?˜?Œë¦? ?ˆ˜ ?—†?Šµ?‹ˆ?‹¤.')) return;
    replaceData(createDefaultData());
    alert('ì´ˆê¸°?™”?˜?—ˆ?Šµ?‹ˆ?‹¤.');
  };

  return (
    <div className="page backup-page">
      <PasswordChangeForm />
      <div className="card backup-card">
        <h2>?°?´?„° ë°±ì—…</h2>
        <p>ê³„ì •, ì£¼ê°„ ?‹¤? , ì§?ì¶? ? ?š”, ?—°ê°? ?˜ˆ?‚°?„ JSON ?ŒŒ?¼ë¡? ????ž¥Â·ë³µì›?•©?‹ˆ?‹¤.</p>
        <div className="backup-actions">
          <button type="button" className="primary" onClick={exportAll}>
            ? „ì²? ë°±ì—… Export
          </button>
          <button type="button" onClick={importAll}>
            ? „ì²? ë°±ì—… Import
          </button>
          <button type="button" className="danger" onClick={resetAll}>
            ì´ˆê¸°?™” (ê¸°ë³¸ ê³„ì •)
          </button>
        </div>
      </div>
    </div>
  );
}
