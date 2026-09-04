/**
 * [NEW] manage_stocks.js
 * GitHub API를 이용한 보유/관심 종목 동적 관리 및 자동 배포 추적 모듈
 */

(function () {
    // ── 상태 변수 ──
    let githubToken = '';
    let githubOwner = '';
    let githubRepo = '';
    let fileSha = ''; // GitHub에서 종목.md를 가져올 때 갱신되는 파일 SHA

    let holdings = []; // { name: '', price: 0, id: '' }
    let watchlist = []; // { name: '', id: '' }
    
    let isPolling = false;
    let pollInterval = null;
    let lastCommitSha = null;

    // ── DOM 요소 ──
    const modal = document.getElementById('settings-modal');
    const manageBtn = document.getElementById('manage-stocks-btn');
    const closeBtn = document.querySelector('.close-settings-modal');
    
    const tokenInput = document.getElementById('github-pat');
    const ownerInput = document.getElementById('github-owner');
    const repoInput = document.getElementById('github-repo');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const saveStatusMsg = document.getElementById('save-status-msg');

    const newStockType = document.getElementById('new-stock-type');
    const newStockName = document.getElementById('new-stock-name');
    const newStockId = document.getElementById('new-stock-id');
    const newStockPrice = document.getElementById('new-stock-price');
    const newStockPriceGroup = document.getElementById('new-stock-price-group');
    const addStockBtn = document.getElementById('add-stock-btn');
    const applyBrokerHoldingsBtn = document.getElementById('apply-broker-holdings-btn');

    const editHoldingsList = document.getElementById('edit-holdings-list');
    const editWatchlistList = document.getElementById('edit-watchlist-list');
    const editHoldingsCount = document.getElementById('edit-holdings-count');
    const editWatchlistCount = document.getElementById('edit-watchlist-count');

    const pushChangesBtn = document.getElementById('push-changes-btn');
    const deployStatusBadge = document.getElementById('deploy-run-status');
    const deployStatusDesc = document.getElementById('deploy-status-desc');

    // ── 초기화 ──
    function init() {
        // 로컬 스토리지에서 설정 로드
        githubToken = localStorage.getItem('github_pat') || '';
        githubOwner = localStorage.getItem('github_owner') || '';
        githubRepo = localStorage.getItem('github_repo') || '';

        // 입력 폼 채우기 (존재할 경우에만)
        if (tokenInput) tokenInput.value = githubToken;
        if (ownerInput) ownerInput.value = githubOwner;
        if (repoInput) repoInput.value = githubRepo;

        // 보유/관심 구분에 따른 평단가 인풋 가시성 토글
        newStockType.addEventListener('change', () => {
            if (newStockType.value === 'HOLDING') {
                newStockPriceGroup.style.display = 'flex';
            } else {
                newStockPriceGroup.style.display = 'none';
            }
        });

        // 모달 열기/닫기 이벤트
        if (manageBtn) {
            manageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 모달을 열 때 항상 최신의 토큰 정보를 로드해와 동기화
                githubToken = localStorage.getItem('github_pat') || '';
                githubOwner = localStorage.getItem('github_owner') || '';
                githubRepo = localStorage.getItem('github_repo') || '';

                modal.style.display = 'block';
                if (githubToken && githubOwner && githubRepo) {
                    fetchStocksFromGitHub();
                } else {
                    alert('종목을 관리하려면 먼저 메인 화면 상단의 [🔑 Admin Login]을 통해 관리자 로그인을 완료해 주세요.');
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // 설정 저장 이벤트 (존재할 경우에만)
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', saveSettings);
        }

        // 종목 추가 이벤트
        addStockBtn.addEventListener('click', addStockToLocalList);

        // Toss+KIS 실전 잔고 → 보유종목 적용 (유일한 수동 실전 연동 예외)
        if (applyBrokerHoldingsBtn) {
            applyBrokerHoldingsBtn.addEventListener('click', applyBrokerHoldings);
        }

        // GitHub 반영 및 배포 이벤트
        pushChangesBtn.addEventListener('click', pushChangesToGitHub);
    }

    // ── 로컬 스토리지에 설정 저장 ──
    function saveSettings() {
        githubToken = tokenInput.value.trim();
        githubOwner = ownerInput.value.trim();
        githubRepo = repoInput.value.trim();

        if (!githubToken || !githubOwner || !githubRepo) {
            saveStatusMsg.textContent = '❌ 모든 항목을 입력해 주세요.';
            saveStatusMsg.style.color = '#ef4444';
            return;
        }

        localStorage.setItem('github_pat', githubToken);
        localStorage.setItem('github_owner', githubOwner);
        localStorage.setItem('github_repo', githubRepo);

        saveStatusMsg.textContent = '✅ 저장되었습니다! 종목 목록을 동기화합니다...';
        saveStatusMsg.style.color = '#10b981';

        setTimeout(() => {
            saveStatusMsg.textContent = '';
            fetchStocksFromGitHub();
        }, 1500);
    }

    // ── GitHub API 호출 공통 ──
    async function githubApiRequest(path, method = 'GET', body = null) {
        const url = `https://api.github.com/repos/${githubOwner}/${githubRepo}${path}`;
        const headers = {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        const config = {
            method,
            headers
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(url, config);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${response.status}`);
        }
        return response.json();
    }

    // ── GitHub에서 종목.md 가져오기 ──
    async function fetchStocksFromGitHub() {
        updateDeployStatus('idle', '종목 데이터를 로드하는 중...');
        try {
            const data = await githubApiRequest('/contents/종목.md');
            fileSha = data.sha;
            // Base64 디코딩 (utf-8-sig 대응을 위해 디코딩 시 유니코드 처리 지원)
            const base64Content = data.content.replace(/\s/g, '');
            const decodedText = decodeURIComponent(atob(base64Content).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            parseMarkdownToStocks(decodedText);
            renderEditLists();
            updateDeployStatus('idle', '종목 데이터를 성공적으로 동기화했습니다.');
        } catch (error) {
            console.error('Error fetching 종목.md:', error);
            updateDeployStatus('failed', `동기화 실패: ${error.message}`);
            alert(`GitHub에서 종목.md를 가져오지 못했습니다.\n설정(토큰, Repository 정보)을 다시 확인해 주세요.\n에러: ${error.message}`);
        }
    }

    // ── 마크다운 파싱 ──
    function parseMarkdownToStocks(markdown) {
        holdings = [];
        watchlist = [];
        
        const lines = markdown.split(/\r?\n/);
        let currentSection = null;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            if (line.includes('# 보유종목')) {
                currentSection = 'HOLDING';
                continue;
            } else if (line.includes('# 관심종목')) {
                currentSection = 'WATCHLIST';
                continue;
            }

            if (line.startsWith('-')) {
                const content = line.substring(1).trim();
                const parts = content.split(',').map(p => p.trim());

                if (currentSection === 'HOLDING' && parts.length >= 3) {
                    const name = parts[0];
                    const priceVal = parts[1].replace(/원|KRW/g, '').replace(/,/g, '').trim();
                    const id = parts[2];
                    holdings.push({
                        name,
                        price: parseInt(priceVal, 10) || 0,
                        id
                    });
                } else if (currentSection === 'WATCHLIST' && parts.length >= 2) {
                    const name = parts[0];
                    const id = parts[1];
                    watchlist.push({
                        name,
                        id
                    });
                }
            }
        }
    }

    // ── 종목 목록 렌더링 ──
    function renderEditLists() {
        editHoldingsCount.textContent = holdings.length;
        editWatchlistCount.textContent = watchlist.length;

        // 보유 종목
        editHoldingsList.innerHTML = holdings.length === 0 
            ? '<p style="color: var(--text-muted); font-size: 0.8rem; padding: 10px; text-align: center;">보유 종목이 없습니다.</p>'
            : holdings.map((stock, index) => `
                <div class="edit-stock-item">
                    <div class="edit-stock-info">
                        <span class="edit-stock-name">${stock.name}</span>
                        <span class="edit-stock-meta">${stock.id} | 평단: ${stock.price.toLocaleString()}원</span>
                    </div>
                    <button class="delete-stock-btn" data-type="holding" data-index="${index}">🗑️</button>
                </div>
            `).join('');

        // 관심 종목
        editWatchlistList.innerHTML = watchlist.length === 0
            ? '<p style="color: var(--text-muted); font-size: 0.8rem; padding: 10px; text-align: center;">관심 종목이 없습니다.</p>'
            : watchlist.map((stock, index) => `
                <div class="edit-stock-item">
                    <div class="edit-stock-info">
                        <span class="edit-stock-name">${stock.name}</span>
                        <span class="edit-stock-meta">${stock.id}</span>
                    </div>
                    <button class="delete-stock-btn" data-type="watchlist" data-index="${index}">🗑️</button>
                </div>
            `).join('');

        // 삭제 버튼 이벤트 바인딩
        document.querySelectorAll('.delete-stock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.getAttribute('data-type');
                const index = parseInt(btn.getAttribute('data-index'), 10);
                deleteStock(type, index);
            });
        });
    }

    // ── 임시 목록에서 종목 삭제 ──
    function deleteStock(type, index) {
        if (type === 'holding') {
            holdings.splice(index, 1);
        } else {
            watchlist.splice(index, 1);
        }
        renderEditLists();
        updateDeployStatus('idle', '수정사항이 존재합니다. 배포를 시작하려면 하단 버튼을 클릭해 주세요.');
    }

    // ── Toss+KIS 실전 잔고 → 보유종목 적용 ──
    async function applyBrokerHoldings() {
        const isLocal = window.location.hostname === 'localhost'
            || window.location.hostname === '127.0.0.1'
            || window.location.protocol === 'file:';
        if (!isLocal) {
            alert('보유종목 적용은 로컬 trade 서버(localhost:8000)에서만 가능합니다.');
            return;
        }

        const btn = applyBrokerHoldingsBtn;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '실계좌 조회 중...';
        updateDeployStatus('running', 'Toss·KIS 실전 잔고를 가져오는 중...');

        try {
            const syncRes = await fetch('http://127.0.0.1:8000/api/broker/sync-holdings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: 'stock-management' }),
            });
            const syncData = await syncRes.json().catch(() => ({}));
            if (!syncRes.ok || !syncData.success) {
                throw new Error(syncData.detail || syncData.message || `HTTP ${syncRes.status}`);
            }

            const jongRes = await fetch('http://127.0.0.1:8000/api/jongmok');
            const jongData = await jongRes.json();
            if (!jongRes.ok || !jongData.success) {
                throw new Error(jongData.detail || '종목.md 읽기 실패');
            }

            holdings = (jongData.holdings || []).map(h => ({
                name: h.name,
                price: h.price || 0,
                id: h.id,
            }));
            watchlist = (jongData.watchlist || []).map(w => ({
                name: w.name,
                id: w.id,
            }));
            renderEditLists();

            const count = syncData.holdings ?? holdings.length;
            const errNote = (syncData.errors && syncData.errors.length)
                ? ` (일부 오류: ${syncData.errors.join('; ')})`
                : '';
            updateDeployStatus('idle', `보유종목 ${count}개 적용 완료. GitHub 반영은 하단 배포 버튼을 눌러 주세요.${errNote}`);
            alert(`Toss+KIS 실전 잔고 ${count}종목이 보유종목에 반영되었습니다.\n관심종목 중복은 자동 제거되었습니다.${errNote ? '\n' + errNote : ''}`);
        } catch (error) {
            console.error('applyBrokerHoldings failed:', error);
            updateDeployStatus('failed', `보유종목 적용 실패: ${error.message}`);
            alert(`보유종목 적용 실패:\n${error.message}\n\nlocal_server.py 실행 및 Toss/KIS 실전 API 키를 확인하세요.`);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    // ── 임시 목록에 신규 종목 추가 ──
    function addStockToLocalList() {
        const type = newStockType.value;
        const name = newStockName.value.trim();
        const id = newStockId.value.trim();
        const priceVal = newStockPrice.value.trim();

        if (!name || !id) {
            alert('종목명과 종목 ID를 올바르게 입력해 주세요.');
            return;
        }

        if (type === 'HOLDING') {
            const price = parseInt(priceVal.replace(/,/g, ''), 10);
            if (isNaN(price) || price <= 0) {
                alert('보유 종목의 경우 평단가를 올바른 숫자로 입력해 주세요.');
                return;
            }
            holdings.push({ name, price, id });
        } else {
            watchlist.push({ name, id });
        }

        // 입력 폼 비우기
        newStockName.value = '';
        newStockId.value = '';
        newStockPrice.value = '';

        renderEditLists();
        updateDeployStatus('idle', '수정사항이 존재합니다. 배포를 시작하려면 하단 버튼을 클릭해 주세요.');
    }

    // ── 마크다운 재생성 ──
    function buildMarkdownText() {
        let md = '# 보유종목, 평단가, 종목ID\n\n';
        holdings.forEach(stock => {
            md += `- ${stock.name}, ${stock.price}원, ${stock.id}\n`;
        });
        
        md += '\n# 관심종목, 종목ID\n\n';
        watchlist.forEach(stock => {
            md += `- ${stock.name}, ${stock.id}\n`;
        });

        return md;
    }

    // ── 변경사항 GitHub 반영 및 배포 트리거 ──
    async function pushChangesToGitHub() {
        if (!githubToken || !githubOwner || !githubRepo) {
            alert('설정이 비어 있습니다. GitHub 연동을 먼저 진행해 주세요.');
            return;
        }

        updateDeployStatus('running', 'GitHub에 커밋을 생성하고 있습니다...');
        pushChangesBtn.disabled = true;

        try {
            const markdownText = buildMarkdownText();
            // 유니코드 문자열을 base64로 안전하게 인코딩하기 위해 btoa + encodeURIComponent 처리 우회
            const utf8Bytes = new TextEncoder().encode(markdownText);
            let binary = '';
            for (let i = 0; i < utf8Bytes.length; i++) {
                binary += String.fromCharCode(utf8Bytes[i]);
            }
            const base64Content = btoa(binary);

            const response = await githubApiRequest('/contents/종목.md', 'PUT', {
                message: 'auto: update 종목.md from dashboard settings',
                content: base64Content,
                sha: fileSha
            });

            fileSha = response.content.sha;
            lastCommitSha = response.commit.sha;

            updateDeployStatus('running', 'GitHub Action 빌드 상태를 확인 중...');
            
            // 3초 후 GitHub Action 빌드 결과 폴링 시작
            setTimeout(() => {
                startPollingWorkflow();
            }, 3000);

        } catch (error) {
            console.error('Error committing changes:', error);
            updateDeployStatus('failed', `반영 실패: ${error.message}`);
            alert(`GitHub에 종목을 저장하지 못했습니다.\n에러: ${error.message}`);
            pushChangesBtn.disabled = false;
        }
    }

    // ── 배포 상태 뱃지 업데이트 ──
    function updateDeployStatus(status, description) {
        deployStatusBadge.className = `deploy-badge status-${status}`;
        
        let statusLabel = '대기 중';
        if (status === 'running') statusLabel = '배포 중';
        if (status === 'success') statusLabel = '성공';
        if (status === 'failed') statusLabel = '실패';
        
        deployStatusBadge.textContent = statusLabel;
        deployStatusDesc.textContent = description;
    }

    // ── GitHub Action 빌드 상태 폴링 ──
    function startPollingWorkflow() {
        if (isPolling) return;
        isPolling = true;

        // 기존 타이머 제거
        if (pollInterval) clearInterval(pollInterval);

        pollInterval = setInterval(async () => {
            try {
                // workflow runs 가져오기 (가장 최근 5개 분석)
                const data = await githubApiRequest('/actions/runs?per_page=5');
                const runs = data.workflow_runs || [];

                // generate_report.yml 워크플로우를 찾거나, 최근 커밋 SHA가 매칭되는 run을 식별
                const matchingRun = runs.find(run => {
                    return run.head_sha === lastCommitSha || run.name.includes('Report');
                });

                if (matchingRun) {
                    const status = matchingRun.status; // queued, in_progress, completed
                    const conclusion = matchingRun.conclusion; // success, failure, cancelled, etc.

                    if (status === 'queued' || status === 'in_progress') {
                        updateDeployStatus('running', `GitHub Actions 구동 중: 리포트 빌드 중입니다... (${status})`);
                    } else if (status === 'completed') {
                        clearInterval(pollInterval);
                        isPolling = false;
                        pushChangesBtn.disabled = false;

                        if (conclusion === 'success') {
                            updateDeployStatus('success', '배포 완료! 잠시 후 대시보드가 리로드됩니다.');
                            setTimeout(() => {
                                location.reload();
                            }, 5000);
                        } else {
                            updateDeployStatus('failed', `배포 실패 (GitHub Action 결과: ${conclusion})`);
                        }
                    }
                } else {
                    updateDeployStatus('running', 'GitHub Action이 예약/스케줄링되는 것을 기다리는 중...');
                }
            } catch (error) {
                console.error('Error polling workflow status:', error);
                // 네트워크 에러 등으로 실패 시 일시 중단하지 않고 계속 폴링 시도
            }
        }, 5000); // 5초 간격
    }

    // 문서 로드 시 초기화 구동
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
