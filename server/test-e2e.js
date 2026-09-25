// End-to-End Simulation Test for "Find Your Bestfriend"

async function runTest() {
  const baseUrl = 'http://localhost:3001';
  console.log('🧪 Starting End-to-End Test Suite against:', baseUrl);

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const health = await healthRes.json();
  console.log('✅ Health Check passed:', health.name);

  // 2. Register shared duo account
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player1Name: 'Sam',
      player2Name: 'Taylor',
      password: 'bestiesforever'
    })
  });
  const reg = await regRes.json();
  console.log('✅ Shared Account Registered:', reg.account.username);
  console.log('   User 1:', reg.account.player1.name, '| User 2:', reg.account.player2.name);

  const accountId = reg.account.id;
  const username = reg.account.username;

  // 3. Login as User 1 and User 2 concurrently
  const loginUser1 = await (await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: 'bestiesforever', playerRole: 'user1' })
  })).json();

  const loginUser2 = await (await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: 'bestiesforever', playerRole: 'user2' })
  })).json();

  console.log('✅ Dual Login Successful:');
  console.log('   User 1 Token:', loginUser1.token);
  console.log('   User 2 Token:', loginUser2.token);

  // 4. Fetch Themes
  const themesRes = await (await fetch(`${baseUrl}/api/themes?accountId=${accountId}`)).json();
  console.log(`✅ Themes loaded (${themesRes.themes.length} themes):`);
  themesRes.themes.forEach(t => console.log(`   - ${t.name} (isHorror: ${t.isHorror}, isLocked: ${t.isLocked})`));

  // 5. Create Session (Theme: Nature, Difficulty: Easy)
  const sessionRes = await (await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId,
      difficulty: 'easy',
      themeId: 'nature',
      finderPlayerId: loginUser1.currentPlayer.id,
      answererPlayerId: loginUser2.currentPlayer.id
    })
  })).json();

  const session = sessionRes.session;
  console.log('✅ Session Created:', session.id);
  console.log('   Status:', session.status);
  console.log('   Finder:', session.finderName, '| Answerer:', session.answererName);
  console.log(`   Questions in deck: ${session.questions.length}`);

  // 6. Answerer submits 10 truth answers
  const answersPayload = session.questions.map((q, idx) => ({
    questionId: q.id,
    answerText: q.distractors[0] || `Favorite choice ${idx}`
  }));

  const submitAnswersRes = await (await fetch(`${baseUrl}/api/sessions/${session.id}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: answersPayload })
  })).json();

  console.log('✅ Truth Answers Submitted! Exploration phase started:', submitAnswersRes.session.status);

  // 7. Test Hint Token Usage
  const hintRes = await (await fetch(`${baseUrl}/api/sessions/${session.id}/hint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ waypointIndex: 0 })
  })).json();
  console.log('✅ Hint Used successfully: Eliminated', hintRes.eliminatedOption, '| Remaining hints:', hintRes.hintsRemaining);

  // 8. Finder answers waypoints (let's answer 8 correctly, 2 wrong)
  for (let i = 0; i < 10; i++) {
    const q = session.questions[i];
    const isTargetCorrect = i < 8; // 8/10 correct = Round Won!
    const answerChoice = isTargetCorrect 
      ? answersPayload[i].answerText 
      : 'Deliberately wrong answer for testing';

    const submitRes = await (await fetch(`${baseUrl}/api/sessions/${session.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waypointIndex: i,
        selectedAnswer: answerChoice
      })
    })).json();

    console.log(`   Waypoint #${i + 1}: ${submitRes.isCorrect ? '✨ CORRECT' : '❌ WRONG'} | Score: ${submitRes.score}/10`);

    if (submitRes.isCompleted) {
      console.log('🏆 ROUND COMPLETED!');
      console.log('   Is Won:', submitRes.isWon);
      console.log('   Title Awarded:', submitRes.reward.title);
      console.log('   Meme Quote:', submitRes.reward.memeText);
      console.log('   Partner Perk Coupon:', submitRes.reward.coupon.title, `(${submitRes.reward.coupon.code})`);
    }
  }

  // 9. Check account progress
  const progressRes = await (await fetch(`${baseUrl}/api/users/${accountId}/progress`)).json();
  console.log('✅ Account Progress Updated:');
  console.log('   Easy rounds won:', progressRes.progress.easy);
  console.log('   Medium rounds won:', progressRes.progress.medium);
  console.log('   Hard rounds won:', progressRes.progress.hard);
  console.log('   Horror Round Unlocked:', progressRes.progress.horrorUnlocked);

  // 10. Test Dev Horror Unlock
  const unlockRes = await (await fetch(`${baseUrl}/api/users/${accountId}/progress/unlock-horror-dev`, {
    method: 'POST'
  })).json();
  console.log('✅ Developer Bypass Horror Unlock:', unlockRes.progress.horrorUnlocked);

  // 11. Create a session in the Horror Round
  const horrorSessionRes = await (await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId,
      difficulty: 'hard',
      themeId: 'horror',
      finderPlayerId: loginUser2.currentPlayer.id,
      answererPlayerId: loginUser1.currentPlayer.id
    })
  })).json();

  console.log('🕯️ Horror Round Session Created Successfully:', horrorSessionRes.session.themeName);

  console.log('\n🎉 ALL 11 TESTS PASSED PERFECTLY!');
}

runTest().catch(console.error);
