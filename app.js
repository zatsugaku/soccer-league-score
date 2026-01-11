// サッカーリーグ スコア管理アプリ

class LeagueManager {
    constructor() {
        this.blocks = [];
        this.currentBlockId = null;
        this.currentMatch = null;
        this.loadData();
        this.initEventListeners();
        this.render();
    }

    // LocalStorageからデータを読み込み
    loadData() {
        const saved = localStorage.getItem('soccerLeagueData');
        if (saved) {
            const data = JSON.parse(saved);
            this.blocks = data.blocks || [];
            this.currentBlockId = data.currentBlockId || null;
        }
    }

    // LocalStorageにデータを保存
    saveData() {
        const data = {
            blocks: this.blocks,
            currentBlockId: this.currentBlockId
        };
        localStorage.setItem('soccerLeagueData', JSON.stringify(data));
    }

    // イベントリスナーの初期化
    initEventListeners() {
        // ブロック追加
        document.getElementById('addBlockBtn').addEventListener('click', () => {
            this.addBlock();
        });

        document.getElementById('newBlockName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addBlock();
        });

        // モーダル関連
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModals();
            });
        });

        // チーム追加
        document.getElementById('addTeamBtn').addEventListener('click', () => {
            this.addTeam();
        });

        document.getElementById('newTeamName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTeam();
        });

        // スコア保存
        document.getElementById('saveScoreBtn').addEventListener('click', () => {
            this.saveScore();
        });
    }

    // ブロック追加
    addBlock() {
        const input = document.getElementById('newBlockName');
        const name = input.value.trim();
        if (!name) return;

        const block = {
            id: Date.now().toString(),
            name: name,
            teams: [],
            matches: []
        };

        this.blocks.push(block);
        this.currentBlockId = block.id;
        input.value = '';
        this.saveData();
        this.render();
    }

    // ブロック選択
    selectBlock(blockId) {
        this.currentBlockId = blockId;
        this.saveData();
        this.render();
    }

    // ブロック削除
    deleteBlock(blockId) {
        if (!confirm('このブロックを削除しますか？')) return;

        this.blocks = this.blocks.filter(b => b.id !== blockId);
        if (this.currentBlockId === blockId) {
            this.currentBlockId = this.blocks.length > 0 ? this.blocks[0].id : null;
        }
        this.saveData();
        this.render();
    }

    // 現在のブロックを取得
    getCurrentBlock() {
        return this.blocks.find(b => b.id === this.currentBlockId);
    }

    // チーム追加モーダルを開く
    openTeamModal() {
        document.getElementById('teamModal').classList.add('show');
        document.getElementById('newTeamName').focus();
    }

    // チーム追加
    addTeam() {
        const block = this.getCurrentBlock();
        if (!block) return;

        const input = document.getElementById('newTeamName');
        const name = input.value.trim();
        if (!name) return;

        const team = {
            id: Date.now().toString(),
            name: name
        };

        block.teams.push(team);
        this.generateMatches(block);
        input.value = '';
        this.closeModals();
        this.saveData();
        this.render();
    }

    // チーム削除
    deleteTeam(teamId) {
        const block = this.getCurrentBlock();
        if (!block) return;

        if (!confirm('このチームを削除しますか？関連する試合も削除されます。')) return;

        block.teams = block.teams.filter(t => t.id !== teamId);
        block.matches = block.matches.filter(m => m.homeTeamId !== teamId && m.awayTeamId !== teamId);
        this.saveData();
        this.render();
    }

    // 対戦表を生成
    generateMatches(block) {
        const existingMatches = block.matches;
        const newMatches = [];

        for (let i = 0; i < block.teams.length; i++) {
            for (let j = i + 1; j < block.teams.length; j++) {
                const homeTeam = block.teams[i];
                const awayTeam = block.teams[j];

                // 既存の試合を探す
                const existing = existingMatches.find(m =>
                    (m.homeTeamId === homeTeam.id && m.awayTeamId === awayTeam.id) ||
                    (m.homeTeamId === awayTeam.id && m.awayTeamId === homeTeam.id)
                );

                if (existing) {
                    newMatches.push(existing);
                } else {
                    newMatches.push({
                        id: Date.now().toString() + '_' + i + '_' + j,
                        homeTeamId: homeTeam.id,
                        awayTeamId: awayTeam.id,
                        homeScore: null,
                        awayScore: null,
                        played: false
                    });
                }
            }
        }

        block.matches = newMatches;
    }

    // スコア入力モーダルを開く
    openScoreModal(matchId) {
        const block = this.getCurrentBlock();
        if (!block) return;

        const match = block.matches.find(m => m.id === matchId);
        if (!match) return;

        this.currentMatch = match;

        const homeTeam = block.teams.find(t => t.id === match.homeTeamId);
        const awayTeam = block.teams.find(t => t.id === match.awayTeamId);

        document.getElementById('homeTeamName').textContent = homeTeam ? homeTeam.name : '';
        document.getElementById('awayTeamName').textContent = awayTeam ? awayTeam.name : '';
        document.getElementById('homeScore').value = match.homeScore !== null ? match.homeScore : 0;
        document.getElementById('awayScore').value = match.awayScore !== null ? match.awayScore : 0;

        document.getElementById('scoreModal').classList.add('show');
    }

    // スコア保存
    saveScore() {
        if (!this.currentMatch) return;

        const homeScore = parseInt(document.getElementById('homeScore').value) || 0;
        const awayScore = parseInt(document.getElementById('awayScore').value) || 0;

        this.currentMatch.homeScore = homeScore;
        this.currentMatch.awayScore = awayScore;
        this.currentMatch.played = true;

        this.currentMatch = null;
        this.closeModals();
        this.saveData();
        this.render();
    }

    // モーダルを閉じる
    closeModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    }

    // 順位表を計算
    calculateStandings(block) {
        const standings = block.teams.map(team => ({
            team: team,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
        }));

        block.matches.forEach(match => {
            if (!match.played) return;

            const homeStanding = standings.find(s => s.team.id === match.homeTeamId);
            const awayStanding = standings.find(s => s.team.id === match.awayTeamId);

            if (!homeStanding || !awayStanding) return;

            // 試合数
            homeStanding.played++;
            awayStanding.played++;

            // 得点・失点
            homeStanding.goalsFor += match.homeScore;
            homeStanding.goalsAgainst += match.awayScore;
            awayStanding.goalsFor += match.awayScore;
            awayStanding.goalsAgainst += match.homeScore;

            // 勝敗
            if (match.homeScore > match.awayScore) {
                homeStanding.won++;
                homeStanding.points += 3;
                awayStanding.lost++;
            } else if (match.homeScore < match.awayScore) {
                awayStanding.won++;
                awayStanding.points += 3;
                homeStanding.lost++;
            } else {
                homeStanding.drawn++;
                awayStanding.drawn++;
                homeStanding.points += 1;
                awayStanding.points += 1;
            }
        });

        // 得失点差を計算
        standings.forEach(s => {
            s.goalDifference = s.goalsFor - s.goalsAgainst;
        });

        // 順位でソート（勝点 → 得失点差 → 得点）
        standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });

        return standings;
    }

    // 画面を描画
    render() {
        this.renderBlockTabs();
        this.renderBlockContent();
    }

    // ブロックタブを描画
    renderBlockTabs() {
        const container = document.getElementById('blockTabs');
        container.innerHTML = '';

        this.blocks.forEach(block => {
            const tab = document.createElement('div');
            tab.className = 'block-tab' + (block.id === this.currentBlockId ? ' active' : '');
            tab.innerHTML = `
                <span>${block.name}</span>
                <button class="delete-block" title="削除">&times;</button>
            `;

            tab.querySelector('span').addEventListener('click', () => {
                this.selectBlock(block.id);
            });

            tab.querySelector('.delete-block').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteBlock(block.id);
            });

            container.appendChild(tab);
        });
    }

    // ブロックコンテンツを描画
    renderBlockContent() {
        const container = document.getElementById('currentBlockContent');
        const block = this.getCurrentBlock();

        if (!block) {
            container.innerHTML = '<p class="no-block-message">ブロックを追加または選択してください</p>';
            return;
        }

        const standings = this.calculateStandings(block);

        container.innerHTML = `
            <section class="team-section">
                <h3>
                    <span>${block.name} - チーム管理</span>
                    <button class="add-team-btn" id="openTeamModalBtn">+ チーム追加</button>
                </h3>
            </section>

            <section class="standings-section">
                <h3>順位表</h3>
                ${this.renderStandingsTable(standings)}
            </section>

            <section class="matches-section">
                <h3>対戦表（クリックしてスコアを入力）</h3>
                <div class="matches-grid">
                    ${this.renderMatches(block)}
                </div>
            </section>
        `;

        document.getElementById('openTeamModalBtn').addEventListener('click', () => {
            this.openTeamModal();
        });

        // 試合カードのクリックイベント
        container.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', () => {
                const matchId = card.dataset.matchId;
                this.openScoreModal(matchId);
            });
        });

        // チーム削除ボタン
        container.querySelectorAll('.delete-team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const teamId = btn.dataset.teamId;
                this.deleteTeam(teamId);
            });
        });
    }

    // 順位表をHTML化
    renderStandingsTable(standings) {
        if (standings.length === 0) {
            return '<p>チームがまだ登録されていません</p>';
        }

        let html = `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>順位</th>
                        <th>チーム</th>
                        <th>試合</th>
                        <th>勝</th>
                        <th>分</th>
                        <th>負</th>
                        <th>得点</th>
                        <th>失点</th>
                        <th>得失差</th>
                        <th>勝点</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
        `;

        standings.forEach((s, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            html += `
                <tr class="${rankClass}">
                    <td>${index + 1}</td>
                    <td class="team-name-cell">${s.team.name}</td>
                    <td>${s.played}</td>
                    <td>${s.won}</td>
                    <td>${s.drawn}</td>
                    <td>${s.lost}</td>
                    <td>${s.goalsFor}</td>
                    <td>${s.goalsAgainst}</td>
                    <td>${s.goalDifference > 0 ? '+' : ''}${s.goalDifference}</td>
                    <td><strong>${s.points}</strong></td>
                    <td><button class="delete-team-btn" data-team-id="${s.team.id}">削除</button></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        return html;
    }

    // 対戦表をHTML化
    renderMatches(block) {
        if (block.matches.length === 0) {
            return '<p>チームを2つ以上追加すると対戦表が表示されます</p>';
        }

        return block.matches.map(match => {
            const homeTeam = block.teams.find(t => t.id === match.homeTeamId);
            const awayTeam = block.teams.find(t => t.id === match.awayTeamId);

            const scoreDisplay = match.played
                ? `${match.homeScore} - ${match.awayScore}`
                : '未入力';

            return `
                <div class="match-card ${match.played ? 'played' : ''}" data-match-id="${match.id}">
                    <div class="match-teams">
                        <span class="match-team">${homeTeam ? homeTeam.name : '?'}</span>
                        <span class="match-vs">vs</span>
                        <span class="match-team">${awayTeam ? awayTeam.name : '?'}</span>
                    </div>
                    <span class="match-score ${match.played ? '' : 'not-played'}">${scoreDisplay}</span>
                </div>
            `;
        }).join('');
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new LeagueManager();
});
