import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { downloadJson } from '../lib/storage';
import type { AccountCategory, AccountType, AccountsByType } from '../types';

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function AccountsPage() {
  const { data, setData } = useApp();
  const [type, setType] = useState<AccountType>('income');
  const [bulkText, setBulkText] = useState('');

  const categories = data.accounts[type];

  const updateAccounts = (next: AccountCategory[]) => {
    setData((prev) => ({
      ...prev,
      accounts: { ...prev.accounts, [type]: next },
    }));
  };

  const addCategory = () => {
    const name = prompt('대분류 이름');
    if (!name?.trim()) return;
    updateAccounts([...categories, { id: uid('cat'), name: name.trim(), items: [] }]);
  };

  const addItem = (catId: string) => {
    const name = prompt('세부 계정 이름');
    if (!name?.trim()) return;
    updateAccounts(
      categories.map((c) =>
        c.id === catId ? { ...c, items: [...c.items, { id: uid('item'), name: name.trim() }] } : c,
      ),
    );
  };

  const renameCategory = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    const name = prompt('대분류 이름', cat?.name);
    if (!name?.trim()) return;
    updateAccounts(categories.map((c) => (c.id === catId ? { ...c, name: name.trim() } : c)));
  };

  const renameItem = (catId: string, itemId: string) => {
    const cat = categories.find((c) => c.id === catId);
    const item = cat?.items.find((i) => i.id === itemId);
    const name = prompt('계정 이름', item?.name);
    if (!name?.trim()) return;
    updateAccounts(
      categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              items: c.items.map((i) => (i.id === itemId ? { ...i, name: name.trim() } : i)),
            }
          : c,
      ),
    );
  };

  const deleteCategory = (catId: string) => {
    if (!confirm('대분류와 하위 계정을 모두 삭제할까요?')) return;
    updateAccounts(categories.filter((c) => c.id !== catId));
  };

  const deleteItem = (catId: string, itemId: string) => {
    if (!confirm('이 계정을 삭제할까요?')) return;
    updateAccounts(
      categories.map((c) =>
        c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c,
      ),
    );
  };

  const applyBulk = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;

    const next = [...categories];
    let current = next[next.length - 1];

    for (const line of lines) {
      if (line.startsWith('#')) {
        const name = line.slice(1).trim();
        current = { id: uid('cat'), name, items: [] };
        next.push(current);
      } else if (line.startsWith('-')) {
        const name = line.slice(1).trim();
        if (!current) {
          current = { id: uid('cat'), name: '기타', items: [] };
          next.push(current);
        }
        current.items.push({ id: uid('item'), name });
      } else {
        if (!current) {
          current = { id: uid('cat'), name: '기타', items: [] };
          next.push(current);
        }
        current.items.push({ id: uid('item'), name: line });
      }
    }

    updateAccounts(next);
    setBulkText('');
    alert('벌크 입력이 반영되었습니다.');
  };

  const exportAccounts = () => {
    downloadJson(`accounts-${type}.json`, data.accounts);
  };

  const importAccounts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as AccountsByType | AccountCategory[];
        let imported: AccountsByType;
        if (Array.isArray(parsed)) {
          imported = { ...data.accounts, [type]: parsed };
        } else if (parsed.income && parsed.expense) {
          imported = parsed;
        } else {
          throw new Error('invalid');
        }
        if (!confirm('가져오면 현재 계정 구조가 덮어씌워집니다. 계속할까요?')) return;
        setData((prev) => ({ ...prev, accounts: imported }));
        alert('가져오기 완료');
      } catch {
        alert('JSON 파일 형식이 올바르지 않습니다.');
      }
    };
    input.click();
  };

  return (
    <div className="page accounts-page">
      <div className="toolbar card">
        <h2>계정 관리</h2>
        <div className="period-tabs">
          <button type="button" className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>
            수입
          </button>
          <button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>
            지출
          </button>
        </div>
        <div className="toolbar-spacer" />
        <button type="button" onClick={addCategory}>
          대분류 추가
        </button>
        <button type="button" onClick={exportAccounts}>
          Export
        </button>
        <button type="button" onClick={importAccounts}>
          Import
        </button>
      </div>

      <div className="accounts-grid">
        <div className="card accounts-list">
          {categories.map((cat) => (
            <div key={cat.id} className="account-cat">
              <div className="cat-header">
                <strong>{cat.name}</strong>
                <div className="cat-actions">
                  <button type="button" onClick={() => renameCategory(cat.id)}>
                    이름변경
                  </button>
                  <button type="button" onClick={() => addItem(cat.id)}>
                    계정추가
                  </button>
                  <button type="button" className="danger" onClick={() => deleteCategory(cat.id)}>
                    삭제
                  </button>
                </div>
              </div>
              <ul>
                {cat.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <div>
                      <button type="button" onClick={() => renameItem(cat.id, item.id)}>
                        수정
                      </button>
                      <button type="button" className="danger" onClick={() => deleteItem(cat.id, item.id)}>
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="card bulk-panel">
          <h3>계정 한번에 여러개 입력하기</h3>
          <p className="hint">
            <code>#대분류명</code> 으로 분류 시작, <code>-계정명</code> 또는 한 줄에 계정명. 예:
          </p>
          <pre className="example">{`#일반헌금
-주일헌금
-십일조`}</pre>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={12}
            placeholder="#대분류&#10;-계정1&#10;-계정2"
          />
          <button type="button" className="primary" onClick={applyBulk}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
