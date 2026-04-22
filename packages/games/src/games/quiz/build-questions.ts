import type { Question } from '../../shared/quiz/quiz-types';
import type { QuizDef, LocationsData } from '../../quiz/types';
import { asset } from '../../shared/asset-path';
import { COUNTRY_NAMES } from '../../shared/i18n/country-names';
import { getLocale } from '../../shared/i18n/i18n';

let locationsCache: LocationsData | null = null;

async function loadLocations(): Promise<LocationsData> {
    if (!locationsCache) {
        const res = await fetch(asset('locations.json'));
        locationsCache = await res.json();
    }
    return locationsCache!;
}

export async function buildQuestions(quiz: QuizDef): Promise<Question[]> {
    const locale = getLocale();
    const countryNames = COUNTRY_NAMES[locale] || COUNTRY_NAMES['en'];
    const questions: Question[] = [];

    if (quiz.type === 'countries') {
        for (const iso2 of quiz.questionIds) {
            const name = countryNames[iso2 as string];
            if (!name) continue;
            questions.push({
                present: 'text',
                answer: 'country',
                countryISO2: iso2 as string,
                prompt: name,
            });
        }
    } else if (quiz.type === 'provinces') {
        const provinceRes = await fetch(asset(`provinces/${quiz.countryISO2}.json`));
        const provinceData: { provinces: { id: number; name: string }[] } = await provinceRes.json();
        const provinceNames = new Map(provinceData.provinces.map((p) => [p.id, p.name]));

        for (const provinceId of quiz.questionIds) {
            const name = provinceNames.get(provinceId as number);
            if (!name) continue;
            questions.push({
                present: 'text',
                answer: 'province',
                provinceId: provinceId as number,
                countryISO2: quiz.countryISO2,
                prompt: name,
            });
        }
    } else if (quiz.type === 'flags') {
        for (const iso2 of quiz.questionIds) {
            questions.push({
                present: 'image',
                answer: 'country',
                countryISO2: iso2 as string,
                imageUrl: asset(`_flags/${iso2}.png`),
                imageFrame: 'simple',
                prompt: '',
            });
        }
    } else if (quiz.type === 'locations' || quiz.type === 'capitals') {
        const locationsData = await loadLocations();
        for (const locId of quiz.questionIds) {
            const loc = locationsData[locId as string];
            if (!loc) continue;
            questions.push({
                present: 'text',
                answer: 'location-alternatives',
                lat: loc.lat,
                lng: loc.lng,
                prompt: loc.name,
            });
        }
    }

    return questions;
}
