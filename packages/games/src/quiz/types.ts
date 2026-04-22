export type QuizDef = {
    id: number
    name: string
    type: 'countries' | 'locations' | 'capitals' | 'provinces' | 'flags'
    questionIds: (string | number)[]
    countryISO2?: string  // For provinces - which country the provinces belong to
}

export type MenuNode =
    | { name: string; quizId: number }
    | { name: string; children: MenuNode[] }

export type QuizzesData = {
    quizzes: QuizDef[]
    menu: MenuNode[]
}

export type LocationsData = Record<string, { name: string; lat: number; lng: number }>
