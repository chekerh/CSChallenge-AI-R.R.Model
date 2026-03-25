import connect from './db';
import User from './models/User';

async function run() {
  await connect();
  console.log('Mongo migration: ensuring indexes and seeding sample user');
  await User.createIndexes();
  const existing = await User.findOne({ email: 'test@local' }).lean();
  if (!existing) {
    await User.create({
      email: 'test@local',
      name: 'Test User',
      password_hash: '',
      provider: 'local',
    });
    console.log('Seeded test user test@local (no password)');
  }
  console.log('Migration complete');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
