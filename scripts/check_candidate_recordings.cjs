const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'hrims' });
  const [c1] = await conn.execute('SELECT COUNT(*) as count FROM interview_recordings');
  console.log('interview_recordings count:', c1[0].count);
  const [c2] = await conn.execute("SELECT COUNT(*) as count FROM interview_answers WHERE recording_url IS NOT NULL AND recording_url != ''");
  console.log('interview_answers with recording_url count:', c2[0].count);
  const [candList] = await conn.execute('SELECT DISTINCT candidate_id FROM interview_recordings');
  console.log('Candidate IDs with interview_recordings:', candList.map(c => c.candidate_id));
  const [candList2] = await conn.execute("SELECT DISTINCT i.candidate_id FROM interview_answers a JOIN interviews i ON a.interview_id = i.id WHERE a.recording_url IS NOT NULL AND a.recording_url != ''");
  console.log('Candidate IDs with answers.recording_url:', candList2.map(c => c.candidate_id));
  await conn.end();
}
run();
