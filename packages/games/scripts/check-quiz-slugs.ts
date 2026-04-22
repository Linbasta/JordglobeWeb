import quizzesData from '../public-prod/quizzes.json' with { type: 'json' };
import { toSlug } from '../src/games/quiz/quiz-manifests.ts';
import type { QuizDef } from '../src/quiz/types.ts';

const quizzes = (quizzesData as { quizzes: QuizDef[] }).quizzes;

const bySlug = new Map<string, string[]>();
for (const quiz of quizzes) {
    const slug = toSlug(quiz.name);
    const list = bySlug.get(slug) ?? [];
    list.push(quiz.name);
    bySlug.set(slug, list);
}

const collisions = [...bySlug.entries()].filter(([, names]) => names.length > 1);

if (collisions.length > 0) {
    console.error('Quiz slug collisions detected:');
    for (const [slug, names] of collisions) {
        console.error(`  "${slug}"  ← ${names.map((n) => `"${n}"`).join(', ')}`);
    }
    console.error('\nQuiz slugs are used as Firestore leaderboard keys. Collisions would');
    console.error('cause leaderboards to overwrite each other. Rename one of the quizzes.');
    process.exit(1);
}

console.log(`[check-quiz-slugs] OK — ${quizzes.length} quizzes, all slugs unique`);
