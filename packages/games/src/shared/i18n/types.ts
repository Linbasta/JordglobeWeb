export interface LocaleDef {
    code: string
    label: string
}

export type LocaleStrings = Record<string, string>

export interface QuizTranslations {
    defaultLocale: string
    availableLocales: LocaleDef[]
    strings: Record<string, LocaleStrings>
}
