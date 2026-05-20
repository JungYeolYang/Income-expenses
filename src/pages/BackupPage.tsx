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
        if (!confirm('전체 데이터를 덮어씁니다. 계속할까요?')) return;
        replaceData({
          version: parsed.version ?? 1,
          accounts: parsed.accounts,
          weeklyAmounts: parsed.weeklyAmounts ?? {},
          expenseMemos: parsed.expenseMemos ?? {},
          annualBudgets: parsed.annualBudgets ?? {},
        });
        alert('복원 완료');
      } catch {
        alert('백업 파일 형식이 올바르지 않습니다.');
      }
    };
    input.click();
  };

  const resetAll = () => {
    if (!confirm('모든 데이터를 초기화하고 기본 계정으로 되돌릴까요?')) return;
    if (!confirm('정말 삭제합니다. 이 작업은 되돌릴 수 없습니다.')) return;
    replaceData(createDefaultData());
    alert('초기화되었습니다.');
  };

  return (
    <div className="page backup-page">
      <div className="card backup-card">
        <h2>데이터 백업</h2>
        <p>계정, 주간 실적, 지출 적요, 연간 예산을 JSON 파일로 저장·복원합니다.</p>
        <div className="backup-actions">
          <button type="button" className="primary" onClick={exportAll}>
            전체 백업 Export
          </button>
          <button type="button" onClick={importAll}>
            전체 백업 Import
          </button>
          <button type="button" className="danger" onClick={resetAll}>
            초기화 (기본 계정)
          </button>
        </div>
      </div>
    </div>
  );
}
