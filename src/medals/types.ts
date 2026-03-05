export type Medal = {
    id: number
    name: string
    type: 'countries' | 'locations' | 'capitals' | 'provinces' | 'flags'
    questionIds: (string | number)[]
    countryISO2?: string  // For provinces - which country the provinces belong to
}

export type MenuNode =
    | { name: string; medalId: number }
    | { name: string; children: MenuNode[] }

export type MedalsData = {
    medals: Medal[]
    menu: MenuNode[]
}

export type LocationsData = Record<string, { name: string; lat: number; lng: number }>
