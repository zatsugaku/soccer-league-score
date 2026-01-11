// サッカーリーグ スコア管理アプリ

class LeagueManager {
    constructor() {
        this.tournaments = [];
        this.currentTournamentId = null;
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
            this.tournaments = data.tournaments || [];
            this.currentTournamentId = data.currentTournamentId || null;
            this.currentBlockId = data.currentBlockId || null;
        }
    }

    // LocalStorageにデータを保存
    saveData() {
        const data = {
            tournaments: this.tournaments,
            currentTournamentId: this.currentTournamentId,
            currentBlockId: this.currentBlockId
        };
        localStorage.setItem('soccerLeagueData', JSON.stringify(data));
    }

    // イベントリスナーの初期化
    initEventListeners() {
        // 大会追加
        document.getElementById('addTournamentBtn').addEventListener('click', () => {
            this.addTournament();
        });

        document.getElementById('newTournamentName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTournament();
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

    // 大会追加
    addTournament() {
        const input = document.getElementById('newTournamentName');
        const name = input.value.trim();
        if (!name) return;

        const tournament = {
            id: Date.now().toString(),
            name: name,
            blocks: [],
            createdAt: new Date().toISOString()
        };

        this.tournaments.push(tournament);
        this.currentTournamentId = tournament.id;
        this.currentBlockId = null;
        input.value = '';
        this.saveData();
        this.render();
    }

    // 大会選択
    selectTournament(tournamentId) {
        this.currentTournamentId = tournamentId;
        const tournament = this.getCurrentTournament();
        this.currentBlockId = tournament && tournament.blocks.length > 0 ? tournament.blocks[0].id : null;
        this.saveData();
        this.render();
    }

    // 大会削除
    deleteTournament(tournamentId) {
        if (!confirm('この大会を削除しますか？すべてのブロックと試合データも削除されます。')) return;

        this.tournaments = this.tournaments.filter(t => t.id !== tournamentId);
        if (this.currentTournamentId === tournamentId) {
            this.currentTournamentId = this.tournaments.length > 0 ? this.tournaments[0].id : null;
            this.currentBlockId = null;
        }
        this.saveData();
        this.render();
    }

    // 現在の大会を取得
    getCurrentTournament() {
        return this.tournaments.find(t => t.id === this.currentTournamentId);
    }

    // ブロック追加
    addBlock() {
        const tournament = this.getCurrentTournament();
        if (!tournament) return;

        const input = document.getElementById('newBlockName');
        const name = input.value.trim();
        if (!name) return;

        const block = {
            id: Date.now().toString(),
            name: name,
            teams: [],
            matches: []
        };

        tournament.blocks.push(block);
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
        const tournament = this.getCurrentTournament();
        if (!tournament) return;

        if (!confirm('このブロックを削除しますか？')) return;

        tournament.blocks = tournament.blocks.filter(b => b.id !== blockId);
        if (this.currentBlockId === blockId) {
            this.currentBlockId = tournament.blocks.length > 0 ? tournament.blocks[0].id : null;
        }
        this.saveData();
        this.render();
    }

    // 現在のブロックを取得
    getCurrentBlock() {
        const tournament = this.getCurrentTournament();
        if (!tournament) return null;
        return tournament.blocks.find(b => b.id === this.currentBlockId);
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
        document.getElementById('matchDate').value = match.date || '';

        document.getElementById('scoreModal').classList.add('show');
    }

    // スコア保存
    saveScore() {
        if (!this.currentMatch) return;

        const homeScore = parseInt(document.getElementById('homeScore').value) || 0;
        const awayScore = parseInt(document.getElementById('awayScore').value) || 0;
        const matchDate = document.getElementById('matchDate').value || '';

        this.currentMatch.homeScore = homeScore;
        this.currentMatch.awayScore = awayScore;
        this.currentMatch.date = matchDate;
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

            homeStanding.played++;
            awayStanding.played++;

            homeStanding.goalsFor += match.homeScore;
            homeStanding.goalsAgainst += match.awayScore;
            awayStanding.goalsFor += match.awayScore;
            awayStanding.goalsAgainst += match.homeScore;

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

        standings.forEach(s => {
            s.goalDifference = s.goalsFor - s.goalsAgainst;
        });

        standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsFor - a.goalsFor;
        });

        return standings;
    }

    // 星取表を印刷
    printStandings() {
        const tournament = this.getCurrentTournament();
        const block = this.getCurrentBlock();
        if (!tournament || !block) return;

        const standings = this.calculateStandings(block);
        const playedMatches = block.matches.filter(m => m.played);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <title>${tournament.name} - ${block.name} 順位表</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        padding: 20px;
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 15px;
                        border-bottom: 3px solid #333;
                    }
                    .print-header h1 {
                        font-size: 1.8rem;
                        margin-bottom: 10px;
                    }
                    .print-header h2 {
                        font-size: 1.3rem;
                        color: #666;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th, td {
                        padding: 12px;
                        text-align: center;
                        border: 1px solid #333;
                    }
                    th {
                        background: #333;
                        color: white;
                    }
                    .team-name {
                        text-align: left;
                        font-weight: bold;
                    }
                    .rank-1 { background: #fff9c4; }
                    .rank-2 { background: #e0e0e0; }
                    .rank-3 { background: #ffe0b2; }
                    .section-title {
                        font-size: 1.2rem;
                        margin: 20px 0 10px;
                        padding-bottom: 5px;
                        border-bottom: 2px solid #333;
                    }
                    .matches-table td {
                        padding: 8px 12px;
                    }
                    .print-date {
                        text-align: right;
                        margin-top: 20px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>${tournament.name}</h1>
                    <h2>${block.name} - 順位表</h2>
                </div>
                <table>
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
                        </tr>
                    </thead>
                    <tbody>
                        ${standings.map((s, index) => `
                            <tr class="${index < 3 ? 'rank-' + (index + 1) : ''}">
                                <td>${index + 1}</td>
                                <td class="team-name">${s.team.name}</td>
                                <td>${s.played}</td>
                                <td>${s.won}</td>
                                <td>${s.drawn}</td>
                                <td>${s.lost}</td>
                                <td>${s.goalsFor}</td>
                                <td>${s.goalsAgainst}</td>
                                <td>${s.goalDifference > 0 ? '+' : ''}${s.goalDifference}</td>
                                <td><strong>${s.points}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                ${playedMatches.length > 0 ? `
                    <h3 class="section-title">試合結果</h3>
                    <table class="matches-table">
                        <thead>
                            <tr>
                                <th>日付</th>
                                <th>ホーム</th>
                                <th>スコア</th>
                                <th>アウェイ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${playedMatches.map(match => {
                                const homeTeam = block.teams.find(t => t.id === match.homeTeamId);
                                const awayTeam = block.teams.find(t => t.id === match.awayTeamId);
                                const dateStr = match.date ? new Date(match.date).toLocaleDateString('ja-JP') : '-';
                                return `
                                    <tr>
                                        <td>${dateStr}</td>
                                        <td>${homeTeam ? homeTeam.name : '?'}</td>
                                        <td><strong>${match.homeScore} - ${match.awayScore}</strong></td>
                                        <td>${awayTeam ? awayTeam.name : '?'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <p class="print-date">印刷日: ${new Date().toLocaleDateString('ja-JP')}</p>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // 画面を描画
    render() {
        this.renderTournamentTabs();
        this.renderTournamentContent();
    }

    // 大会タブを描画
    renderTournamentTabs() {
        const container = document.getElementById('tournamentTabs');
        container.innerHTML = '';

        this.tournaments.forEach(tournament => {
            const tab = document.createElement('div');
            tab.className = 'tournament-tab' + (tournament.id === this.currentTournamentId ? ' active' : '');
            tab.innerHTML = `
                <span>${tournament.name}</span>
                <button class="delete-tournament" title="削除">&times;</button>
            `;

            tab.querySelector('span').addEventListener('click', () => {
                this.selectTournament(tournament.id);
            });

            tab.querySelector('.delete-tournament').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTournament(tournament.id);
            });

            container.appendChild(tab);
        });
    }

    // 大会コンテンツを描画
    renderTournamentContent() {
        const container = document.getElementById('tournamentContent');
        const tournament = this.getCurrentTournament();

        if (!tournament) {
            container.innerHTML = '<p class="no-tournament-message">大会を追加または選択してください</p>';
            return;
        }

        container.innerHTML = `
            <div class="tournament-header">
                <h3>${tournament.name}</h3>
            </div>

            <section class="block-management">
                <h4>ブロック管理</h4>
                <div class="block-controls">
                    <input type="text" id="newBlockName" placeholder="新しいブロック名">
                    <button id="addBlockBtn">ブロック追加</button>
                </div>
                <div class="block-tabs" id="blockTabs">
                    ${this.renderBlockTabs(tournament)}
                </div>
            </section>

            <div id="currentBlockContent" class="block-content">
                ${this.renderBlockContent()}
            </div>
        `;

        // ブロック追加イベント
        document.getElementById('addBlockBtn').addEventListener('click', () => {
            this.addBlock();
        });

        document.getElementById('newBlockName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addBlock();
        });

        // ブロックタブイベント
        container.querySelectorAll('.block-tab span').forEach(span => {
            span.addEventListener('click', () => {
                const blockId = span.parentElement.dataset.blockId;
                this.selectBlock(blockId);
            });
        });

        container.querySelectorAll('.block-tab .delete-block').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const blockId = btn.parentElement.dataset.blockId;
                this.deleteBlock(blockId);
            });
        });

        // チーム追加ボタン
        const openTeamModalBtn = document.getElementById('openTeamModalBtn');
        if (openTeamModalBtn) {
            openTeamModalBtn.addEventListener('click', () => {
                this.openTeamModal();
            });
        }

        // 印刷ボタン
        const printBtn = document.getElementById('printStandingsBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printStandings();
            });
        }

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

    // ブロックタブをHTML化
    renderBlockTabs(tournament) {
        if (tournament.blocks.length === 0) {
            return '';
        }

        return tournament.blocks.map(block => `
            <div class="block-tab ${block.id === this.currentBlockId ? 'active' : ''}" data-block-id="${block.id}">
                <span>${block.name}</span>
                <button class="delete-block" title="削除">&times;</button>
            </div>
        `).join('');
    }

    // ブロックコンテンツを描画
    renderBlockContent() {
        const block = this.getCurrentBlock();

        if (!block) {
            return '<p class="no-block-message">ブロックを追加または選択してください</p>';
        }

        const standings = this.calculateStandings(block);

        return `
            <section class="team-section">
                <h3>
                    <span>${block.name}</span>
                    <div class="team-section-buttons">
                        <button class="add-team-btn" id="openTeamModalBtn">+ チーム追加</button>
                        <button class="print-btn" id="printStandingsBtn">印刷</button>
                    </div>
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

            const dateDisplay = match.date
                ? this.formatDate(match.date)
                : '';

            return `
                <div class="match-card ${match.played ? 'played' : ''}" data-match-id="${match.id}">
                    ${dateDisplay ? `<span class="match-date">${dateDisplay}</span>` : ''}
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

    // 日付をフォーマット
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new LeagueManager();
});
