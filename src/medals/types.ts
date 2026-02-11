export type Medal = {
    id: number
    name: string
    type: 'countries' | 'locations'
    questionIds: string[]
}

export type MenuNode =
    | { name: string; medalId: number }
    | { name: string; children: MenuNode[] }

export type MedalsData = {
    medals: Medal[]
    menu: MenuNode[]
}

export type LocationsData = Record<string, { name: string; lat: number; lng: number }>
